import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    ticketType: {
      _id: { type: mongoose.Schema.Types.ObjectId },
      name: { type: String, required: true },
      price: { type: Number, required: true },
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled', 'pending'],
      default: 'confirmed',
    },
    bookingRef: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true }
)

// Auto-generate booking reference before saving
bookingSchema.pre('save', function () {
  if (!this.bookingRef) {
    const year = new Date().getFullYear()
    const rand = Math.floor(Math.random() * 900000 + 100000)
    this.bookingRef = `EH-${year}-${rand}`
  }
})

const Booking = mongoose.model('Booking', bookingSchema)
export default Booking
