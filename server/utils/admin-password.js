import bcrypt from 'bcryptjs'
import { z } from 'zod'
import User from '../models/User.js'

const passwordSchema = z.string().min(8).max(128)

export async function resetAdminPassword(emailValue, passwordValue) {
  const email = z.string().trim().email().max(254).parse(emailValue).toLowerCase()
  const password = passwordSchema.parse(passwordValue)
  const passwordHash = await bcrypt.hash(password, 12)
  const result = await User.updateOne(
    { email, role: 'admin' },
    { $set: { passwordHash }, $inc: { tokenVersion: 1 } },
    { runValidators: true },
  )
  if (result.matchedCount !== 1) {
    throw new Error('ADMIN_EMAIL must match an existing administrator account. No password was changed.')
  }
}
