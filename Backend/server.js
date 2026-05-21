import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/db.js'
import authRoutes from './routes/auth.js'
import eventRoutes from './routes/events.js'
import bookingRoutes from './routes/bookings.js'
import adminRoutes from './routes/admin.js'
import organizerRoutes from './routes/organizer.js'

dotenv.config()

// Connect to MongoDB
connectDB()

const app = express()

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests from any localhost port (dev) or no origin (mobile/Postman)
    if (!origin || /^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'EventHive API is running 🔥', timestamp: new Date().toISOString() })
})

// Routes
app.use('/api/auth',      authRoutes)
app.use('/api/events',    eventRoutes)
app.use('/api/bookings',  bookingRoutes)
app.use('/api/admin',     adminRoutes)
app.use('/api/organizer', organizerRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ message: 'Internal server error', error: err.message })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 EventHive API running on http://localhost:${PORT}`)
})
