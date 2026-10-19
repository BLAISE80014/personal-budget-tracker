import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDatabase } from '../config/db.js'
import { migrateInitialAdmin } from '../utils/admin-provisioning.js'

function argumentValue(name) {
  const prefix = `${name}=`
  const argument = process.argv.slice(2).find((value) => value.startsWith(prefix))
  return argument?.slice(prefix.length)
}

async function main() {
  const sourceEmail = argumentValue('--from')
  if (!process.argv.includes('--confirm') || !sourceEmail) {
    throw new Error('Usage: npm run admin:migrate -- --from=<existing-admin-email> --confirm')
  }
  if (!process.env.ADMIN_EMAIL) {
    throw new Error('ADMIN_EMAIL environment variable is required. Set it to the existing account that will become administrator.')
  }
  await connectDatabase(process.env.MONGODB_URI)
  await migrateInitialAdmin(sourceEmail, process.env.ADMIN_EMAIL)
  console.log('Administrator migration completed successfully.')
}

try {
  await main()
} catch (error) {
  console.error(`Administrator migration failed: ${error.message}`)
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}
