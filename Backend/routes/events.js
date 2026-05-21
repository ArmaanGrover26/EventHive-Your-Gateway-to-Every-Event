import express from 'express'
import Event from '../models/Event.js'
import { protect, requireRole } from '../middleware/auth.js'

const router = express.Router()

// GET /api/events  — public listing with filters, search, pagination
router.get('/', async (req, res) => {
  try {
    const { category, search, sort = 'latest', page = 1, limit = 9 } = req.query
    const pageNum  = parseInt(page)
    const limitNum = parseInt(limit)

    // Build filter
    const filter = { status: 'approved' }
    if (category && category !== 'all') filter.category = category

    if (search) {
      filter.$or = [
        { title:       { $regex: search, $options: 'i' } },
        { 'venue.city': { $regex: search, $options: 'i' } },
        { tags:         { $regex: search, $options: 'i' } },
      ]
    }

    // Sort
    let sortObj = { createdAt: -1 }
    if (sort === 'date')       sortObj = { date: 1 }
    if (sort === 'price_asc')  sortObj = { 'ticketTypes.0.price': 1 }
    if (sort === 'price_desc') sortObj = { 'ticketTypes.0.price': -1 }

    const total  = await Event.countDocuments(filter)
    const events = await Event.find(filter)
      .sort(sortObj)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('organizer', 'name avatar')
      .lean({ virtuals: true })

    res.json({
      events,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    })
  } catch (err) {
    res.status(500).json({ message: 'Error fetching events', error: err.message })
  }
})

// GET /api/events/featured — latest 6 approved events
router.get('/featured', async (req, res) => {
  try {
    const events = await Event.find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('organizer', 'name avatar')
      .lean({ virtuals: true })
    res.json(events)
  } catch (err) {
    res.status(500).json({ message: 'Error fetching featured events' })
  }
})

// GET /api/events/categories — aggregate counts per category
router.get('/categories', async (req, res) => {
  try {
    const CATEGORIES = [
      { id: 'music',      label: 'Music',      icon: '🎵' },
      { id: 'sports',     label: 'Sports',     icon: '🏆' },
      { id: 'technology', label: 'Technology', icon: '💻' },
      { id: 'food',       label: 'Food',       icon: '🍕' },
      { id: 'arts',       label: 'Arts',       icon: '🎨' },
      { id: 'business',   label: 'Business',   icon: '💼' },
      { id: 'comedy',     label: 'Comedy',     icon: '😂' },
      { id: 'film',       label: 'Film',       icon: '🎬' },
    ]

    const agg = await Event.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ])

    const countMap = {}
    agg.forEach((a) => { countMap[a._id] = a.count })

    const categories = CATEGORIES.map((c) => ({ ...c, count: countMap[c.id] || 0 }))
    res.json(categories)
  } catch (err) {
    res.status(500).json({ message: 'Error fetching categories' })
  }
})

// GET /api/events/:id — single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name avatar email')
      .lean({ virtuals: true })
    if (!event) return res.status(404).json({ message: 'Event not found' })
    res.json(event)
  } catch (err) {
    res.status(500).json({ message: 'Error fetching event' })
  }
})

// POST /api/events — create event (organizer or admin)
router.post('/', protect, requireRole('organizer', 'admin'), async (req, res) => {
  try {
    const { title, category, description, date, time, venue, bannerUrl, tags, ticketTypes } = req.body

    // Default ticket type if none provided
    const tickets = ticketTypes && ticketTypes.length > 0
      ? ticketTypes
      : [{ name: 'General', price: 0, totalSeats: 100, bookedSeats: 0 }]

    const event = await Event.create({
      title, category, description, date, time, venue,
      bannerUrl: bannerUrl || undefined,
      tags: tags || [],
      organizer: req.user._id,
      status: req.user.role === 'admin' ? 'approved' : 'pending',
      ticketTypes: tickets,
    })

    const populated = await event.populate('organizer', 'name avatar')
    res.status(201).json(populated)
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message)
      return res.status(400).json({ message: messages[0] })
    }
    res.status(500).json({ message: 'Error creating event', error: err.message })
  }
})

// PUT /api/events/:id — update event (owner or admin)
router.put('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) return res.status(404).json({ message: 'Event not found' })

    if (req.user.role !== 'admin' && event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this event' })
    }

    const updates = req.body
    // Prevent changing organizer or status via this route
    delete updates.organizer
    delete updates.status

    Object.assign(event, updates)
    await event.save()
    const updated = await event.populate('organizer', 'name avatar')
    res.json(updated)
  } catch (err) {
    res.status(500).json({ message: 'Error updating event' })
  }
})

// DELETE /api/events/:id — delete event (owner or admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) return res.status(404).json({ message: 'Event not found' })

    if (req.user.role !== 'admin' && event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this event' })
    }

    await event.deleteOne()
    res.json({ message: 'Event deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Error deleting event' })
  }
})

export default router
