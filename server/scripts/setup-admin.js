import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDatabase } from '../config/db.js'
import { migrateMissingUserRoles, provisionInitialAdmin } from '../utils/admin-provisioning.js'

async function main() {
  const email = process.env.ADMIN_EMAIL
  if (!email) throw new Error('ADMIN_EMAIL environment variable is required. Set it to the email of an existing account.')
  await connectDatabase(process.env.MONGODB_URI)
  await migrateMissingUserRoles()
  await provisionInitialAdmin(email)
  console.log('Administrator setup completed successfully.')
}

try {
  await main()
} catch (error) {
  console.error(`Administrator setup failed: ${error.message}`)
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}
