import express from 'express'
import Booking from '../models/Booking.js'
import Event from '../models/Event.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// GET /api/bookings/my — current user's bookings
router.get('/my', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate({
        path: 'event',
        select: 'title date time venue bannerUrl category status',
        populate: { path: 'organizer', select: 'name avatar' },
      })
      .sort({ createdAt: -1 })
      .lean()
    res.json(bookings)
  } catch (err) {
    res.status(500).json({ message: 'Error fetching bookings' })
  }
})

// POST /api/bookings — create a booking
router.post('/', protect, async (req, res) => {
  try {
    const { eventId, ticketTypeId, quantity } = req.body

    if (!eventId || !ticketTypeId || !quantity) {
      return res.status(400).json({ message: 'eventId, ticketTypeId, and quantity are required' })
    }

    const event = await Event.findById(eventId)
    if (!event) return res.status(404).json({ message: 'Event not found' })
    if (event.status !== 'approved') {
      return res.status(400).json({ message: 'Event is not available for booking' })
    }

    const ticketType = event.ticketTypes.id(ticketTypeId)
    if (!ticketType) return res.status(404).json({ message: 'Ticket type not found' })

    const available = ticketType.totalSeats - ticketType.bookedSeats
    if (quantity > available) {
      return res.status(400).json({ message: `Only ${available} seats available` })
    }

    // Decrement available seats
    ticketType.bookedSeats += parseInt(quantity)
    await event.save()

    const booking = await Booking.create({
      user: req.user._id,
      event: event._id,
      ticketType: {
        _id: ticketType._id,
        name: ticketType.name,
        price: ticketType.price,
      },
      quantity: parseInt(quantity),
      totalAmount: ticketType.price * parseInt(quantity),
    })

    const populated = await booking.populate({
      path: 'event',
      select: 'title date time venue bannerUrl category',
      populate: { path: 'organizer', select: 'name avatar' },
    })

    res.status(201).json(populated)
  } catch (err) {
    res.status(500).json({ message: 'Error creating booking', error: err.message })
  }
})

// PATCH /api/bookings/:id/cancel — cancel a booking
router.patch('/:id/cancel', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ message: 'Booking not found' })

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' })
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' })
    }

    booking.status = 'cancelled'
    await booking.save()

    // Restore seats
    const event = await Event.findById(booking.event)
    if (event) {
      const tt = event.ticketTypes.id(booking.ticketType._id)
      if (tt) {
        tt.bookedSeats = Math.max(0, tt.bookedSeats - booking.quantity)
        await event.save()
      }
    }

    res.json({ success: true, message: 'Booking cancelled successfully', booking })
  } catch (err) {
    res.status(500).json({ message: 'Error cancelling booking' })
  }
})

export default router
