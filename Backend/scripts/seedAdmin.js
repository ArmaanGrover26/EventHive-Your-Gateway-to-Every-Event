/**
 * Seed Script — Creates the default admin account
 * Run: node scripts/seedAdmin.js  (from the Backend directory)
 */
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import mongoose from 'mongoose'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '..', '.env') })

import User from '../models/User.js'

const ADMIN = {
  name:     'Admin',
  email:    'admin@eventhive.com',
  password: 'Admin@1234',
  role:     'admin',
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('✅ Connected to MongoDB')

    const exists = await User.findOne({ email: ADMIN.email })
    if (exists) {
      console.log(`ℹ️  Admin already exists: ${ADMIN.email}`)
    } else {
      await User.create(ADMIN)
      console.log(`✅ Admin created!`)
      console.log(`   Email:    ${ADMIN.email}`)
      console.log(`   Password: ${ADMIN.password}`)
    }
  } catch (err) {
    console.error('❌ Seed error:', err.message)
  } finally {
    await mongoose.disconnect()
    process.exit(0)
  }
}

seed()
