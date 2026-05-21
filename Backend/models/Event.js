import mongoose from 'mongoose'

const ticketTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  totalSeats: { type: Number, required: true, min: 1 },
  bookedSeats: { type: Number, default: 0 },
})

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['music', 'sports', 'technology', 'food', 'arts', 'business', 'comedy', 'film'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    time: {
      type: String,
      required: [true, 'Event time is required'],
    },
    venue: {
      name: { type: String, required: true },
      city: { type: String, required: true },
      address: { type: String, default: '' },
    },
    bannerUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80&fit=crop',
    },
    tags: [{ type: String, lowercase: true }],
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    ticketTypes: {
      type: [ticketTypeSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: 'At least one ticket type is required',
      },
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

// Virtual: minimum ticket price
eventSchema.virtual('minPrice').get(function () {
  if (!this.ticketTypes || this.ticketTypes.length === 0) return 0
  return Math.min(...this.ticketTypes.map((t) => t.price))
})

// Text index for search
eventSchema.index({ title: 'text', 'venue.city': 'text', tags: 'text' })

const Event = mongoose.model('Event', eventSchema)
export default Event
