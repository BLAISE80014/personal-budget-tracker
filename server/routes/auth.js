import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import FinanceData from '../models/FinanceData.js'
import { Notification } from '../models/TrackerRecords.js'
import User from '../models/User.js'
import { requireAuth } from '../middleware/auth.js'
import { loginSchema, passwordSchema, profileSchema, registerSchema, validate } from '../utils/validation.js'

const router = Router()
const publicUser = (user) => ({
  id: String(user._id),
  fullName: user.fullName,
  email: user.email,
  phone: user.phone || '',
  avatar: user.avatar || '',
  memberSince: user.createdAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
})

function issueToken(user) {
  return jwt.sign({}, process.env.JWT_SECRET, {
    subject: String(user._id),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'personal-budget-tracker',
    audience: 'personal-budget-tracker-client',
  })
}

router.post('/register', async (req, res) => {
  const input = validate(registerSchema, req.body)
  const email = input.email.toLowerCase()
  const existing = await User.exists({ email })
  if (existing) return res.status(409).json({ success: false, error: { message: 'An account with that email already exists.' } })

  const user = await User.create({
    fullName: input.fullName,
    email,
    passwordHash: await bcrypt.hash(input.password, 12),
  })
  try {
    await Promise.all([
      FinanceData.create({ userId: user._id }),
      Notification.create({
        id: `${Date.now()}-welcome`,
        userId: user._id,
        type: 'account',
        title: 'Your account is ready',
        message: 'Welcome to your personal budget tracker.',
        createdAt: Date.now(),
        read: false,
      }),
    ])
  } catch (error) {
    await FinanceData.deleteOne({ userId: user._id })
    await Notification.deleteMany({ userId: user._id })
    await User.deleteOne({ _id: user._id })
    throw error
  }
  res.status(201).json({ success: true, data: { token: issueToken(user), user: publicUser(user) } })
})

router.post('/login', async (req, res) => {
  const input = validate(loginSchema, req.body)
  const user = await User.findOne({ email: input.email.toLowerCase() }).select('+passwordHash')
  const matches = user ? await bcrypt.compare(input.password, user.passwordHash) : false
  if (!matches) return res.status(401).json({ success: false, error: { message: 'Email or password is incorrect.' } })
  await Notification.create({
    id: `${Date.now()}-login`,
    userId: user._id,
    type: 'account',
    title: 'Welcome back',
    message: 'You have successfully signed in.',
    createdAt: Date.now(),
    read: false,
  })
  res.json({ success: true, data: { token: issueToken(user), user: publicUser(user) } })
})

router.get('/me', requireAuth, (req, res) => {
  res.json({ success: true, data: { user: publicUser(req.user) } })
})

router.patch('/profile', requireAuth, async (req, res) => {
  const input = validate(profileSchema, req.body)
  const email = input.email.toLowerCase()
  const collision = await User.exists({ email, _id: { $ne: req.user._id } })
  if (collision) return res.status(409).json({ success: false, error: { message: 'That email address is already in use.' } })
  const user = await User.findByIdAndUpdate(req.user._id, { ...input, email }, { new: true, runValidators: true })
  res.json({ success: true, data: { user: publicUser(user) } })
})

router.patch('/password', requireAuth, async (req, res) => {
  const input = validate(passwordSchema, req.body)
  const user = await User.findById(req.user._id).select('+passwordHash')
  if (!await bcrypt.compare(input.currentPassword, user.passwordHash)) {
    return res.status(400).json({ success: false, error: { message: 'Current password is incorrect.' } })
  }
  user.passwordHash = await bcrypt.hash(input.newPassword, 12)
  await user.save()
  res.json({ success: true, data: { message: 'Password updated successfully.' } })
})

export { publicUser }
export default router
