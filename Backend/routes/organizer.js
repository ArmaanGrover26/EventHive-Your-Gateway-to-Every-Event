import express from 'express'
import Event from '../models/Event.js'
import Booking from '../models/Booking.js'
import { protect, requireRole } from '../middleware/auth.js'

const router = express.Router()

router.use(protect, requireRole('organizer', 'admin'))

// GET /api/organizer/events — events owned by this organizer
router.get('/events', async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user._id })
      .sort({ createdAt: -1 })
      .lean({ virtuals: true })
    res.json(events)
  } catch (err) {
    res.status(500).json({ message: 'Error fetching organizer events' })
  }
})

// GET /api/organizer/stats — stats for this organizer's events
router.get('/stats', async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user._id }).lean({ virtuals: true })
    const eventIds = events.map((e) => e._id)

    const bookingsAgg = await Booking.aggregate([
      { $match: { event: { $in: eventIds }, status: 'confirmed' } },
      { $group: { _id: null, totalBookings: { $sum: 1 }, totalRevenue: { $sum: '$totalAmount' } } },
    ])

    const bData = bookingsAgg[0] || { totalBookings: 0, totalRevenue: 0 }

    const totalBooked = events.reduce(
      (sum, e) => sum + e.ticketTypes.reduce((s, t) => s + t.bookedSeats, 0),
      0
    )

    res.json({
      totalEvents: events.length,
      liveEvents: events.filter((e) => e.status === 'approved').length,
      pendingEvents: events.filter((e) => e.status === 'pending').length,
      totalBookings: bData.totalBookings,
      totalRevenue: bData.totalRevenue,
      totalSeatsBooked: totalBooked,
    })
  } catch (err) {
    res.status(500).json({ message: 'Error fetching organizer stats' })
  }
})

export default router
