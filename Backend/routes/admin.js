import express from 'express'
import User from '../models/User.js'
import Event from '../models/Event.js'
import Booking from '../models/Booking.js'
import { protect, requireRole } from '../middleware/auth.js'

const router = express.Router()

// All admin routes require authentication + admin role
router.use(protect, requireRole('admin'))

// GET /api/admin/stats — platform overview
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalEvents, bookingsAgg] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      Event.countDocuments(),
      Booking.aggregate([
        { $match: { status: 'confirmed' } },
        { $group: { _id: null, totalBookings: { $sum: 1 }, totalRevenue: { $sum: '$totalAmount' } } },
      ]),
    ])

    const bData = bookingsAgg[0] || { totalBookings: 0, totalRevenue: 0 }

    res.json({
      totalUsers,
      totalEvents,
      totalBookings: bData.totalBookings,
      totalRevenue: bData.totalRevenue,
    })
  } catch (err) {
    res.status(500).json({ message: 'Error fetching stats' })
  }
})

// GET /api/admin/users — all users (with booking count)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean()

    // Attach booking count per user
    const bookingCounts = await Booking.aggregate([
      { $group: { _id: '$user', count: { $sum: 1 } } },
    ])
    const countMap = {}
    bookingCounts.forEach((b) => { countMap[b._id.toString()] = b.count })

    const result = users.map((u) => ({
      ...u,
      bookingCount: countMap[u._id.toString()] || 0,
      joinedAt: u.createdAt,
    }))

    res.json(result)
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users' })
  }
})

// GET /api/admin/events — all events (with organizer populated)
router.get('/events', async (req, res) => {
  try {
    const events = await Event.find()
      .sort({ createdAt: -1 })
      .populate('organizer', 'name email avatar')
      .lean({ virtuals: true })
    res.json(events)
  } catch (err) {
    res.status(500).json({ message: 'Error fetching events' })
  }
})

// PATCH /api/admin/users/:id/block — toggle block status
router.patch('/users/:id/block', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot block an admin account' })
    }

    user.isBlocked = !user.isBlocked
    await user.save()

    res.json({ message: user.isBlocked ? `${user.name} blocked` : `${user.name} unblocked`, user })
  } catch (err) {
    res.status(500).json({ message: 'Error updating user status' })
  }
})

// PATCH /api/admin/events/:id/status — approve or reject event
router.patch('/events/:id/status', async (req, res) => {
  try {
    const { status } = req.body
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Use: approved, rejected, or pending' })
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('organizer', 'name email avatar').lean({ virtuals: true })

    if (!event) return res.status(404).json({ message: 'Event not found' })

    res.json({ message: `Event ${status}`, event })
  } catch (err) {
    res.status(500).json({ message: 'Error updating event status' })
  }
})

// DELETE /api/admin/events/:id — admin force-delete event
router.delete('/events/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id)
    if (!event) return res.status(404).json({ message: 'Event not found' })
    res.json({ message: 'Event deleted by admin' })
  } catch (err) {
    res.status(500).json({ message: 'Error deleting event' })
  }
})

// DELETE /api/admin/users/:id — admin delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (user.role === 'admin') return res.status(400).json({ message: 'Cannot delete an admin account' })
    await user.deleteOne()
    res.json({ message: 'User deleted' })
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user' })
  }
})

export default router
