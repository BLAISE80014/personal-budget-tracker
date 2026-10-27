import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { createHash, randomBytes } from 'node:crypto'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import FinanceData from '../models/FinanceData.js'
import { Notification } from '../models/TrackerRecords.js'
import User from '../models/User.js'
import { requireAuth } from '../middleware/auth.js'
import { forgotPasswordSchema, loginSchema, passwordSchema, profileSchema, registerSchema, resetPasswordSchema, validate } from '../utils/validation.js'

const router = Router()
const publicUser = (user) => ({
  id: String(user._id),
  fullName: user.fullName,
  email: user.email,
  role: user.role || 'user',
  phone: user.phone || '',
  avatar: user.avatar || '',
  memberSince: user.createdAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
})

function issueToken(user) {
  return jwt.sign({ tokenVersion: user.tokenVersion || 0 }, process.env.JWT_SECRET, {
    subject: String(user._id),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'personal-budget-tracker',
    audience: 'personal-budget-tracker-client',
  })
}

const passwordResetResponse = {
  success: true,
  data: { message: 'If an account with that email exists, a password reset link will be sent shortly.' },
}

function passwordResetMailer() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, FRONTEND_URL } = process.env
  const port = Number(SMTP_PORT)
  if (!SMTP_HOST || !Number.isInteger(port) || port < 1 || port > 65535 || !SMTP_USER || !SMTP_PASS || !SMTP_FROM || !FRONTEND_URL) {
    const error = new Error('Password reset email is not configured.')
    error.statusCode = 503
    throw error
  }

  let frontendUrl
  try {
    frontendUrl = new URL(FRONTEND_URL)
  } catch {
    const error = new Error('Password reset email is not configured.')
    error.statusCode = 503
    throw error
  }
  if (!['http:', 'https:'].includes(frontendUrl.protocol) || (process.env.NODE_ENV === 'production' && frontendUrl.protocol !== 'https:')) {
    const error = new Error('Password reset email is not configured.')
    error.statusCode = 503
    throw error
  }

  return {
    transport: nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    }),
    frontendUrl: frontendUrl.origin,
    from: SMTP_FROM,
  }
}

router.post('/forgot-password', async (req, res) => {
  const { email } = validate(forgotPasswordSchema, req.body)
  let mailer
  try {
    mailer = passwordResetMailer()
  } catch (error) {
    if (error.statusCode === 503) {
      return res.status(503).json({ success: false, error: { message: error.message } })
    }
    throw error
  }
  const user = await User.findOne({ email: email.toLowerCase() })

  if (user) {
    const token = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(token).digest('hex')
    user.passwordResetTokenHash = tokenHash
    user.passwordResetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000)
    await user.save()

    try {
      const resetUrl = new URL('/reset-password', mailer.frontendUrl)
      resetUrl.searchParams.set('token', token)
      await mailer.transport.sendMail({
        from: mailer.from,
        to: user.email,
        subject: 'Reset your Personal Budget Tracker password',
        text: `We received a request to reset your password. This link expires in 15 minutes:\n\n${resetUrl.href}\n\nIf you did not request this, you can ignore this email.`,
        html: `<p>We received a request to reset your password.</p><p><a href="${resetUrl.href}">Reset your password</a></p><p>This link expires in 15 minutes. If you did not request this, you can ignore this email.</p>`,
      })
    } catch (error) {
      await User.updateOne(
        { _id: user._id, passwordResetTokenHash: tokenHash },
        { $unset: { passwordResetTokenHash: 1, passwordResetTokenExpiresAt: 1 } },
      )
      console.error('Password reset email delivery failed:', error.code || error.name || 'Unknown mail error')
    }
  }

  res.json(passwordResetResponse)
})

router.post('/reset-password', async (req, res) => {
  const input = validate(resetPasswordSchema, req.body)
  const passwordHash = await bcrypt.hash(input.newPassword, 12)
  const tokenHash = createHash('sha256').update(input.token).digest('hex')
  const user = await User.findOneAndUpdate(
    { passwordResetTokenHash: tokenHash, passwordResetTokenExpiresAt: { $gt: new Date() } },
    {
      $set: { passwordHash },
      $unset: { passwordResetTokenHash: 1, passwordResetTokenExpiresAt: 1 },
      $inc: { tokenVersion: 1 },
    },
    { returnDocument: 'after', runValidators: true },
  )

  if (!user) {
    return res.status(400).json({ success: false, error: { message: 'This password reset link is invalid or has expired. Request a new one and try again.' } })
  }

  res.json({ success: true, data: { message: 'Password reset successfully.' } })
})

router.post('/register', async (req, res) => {
  const input = validate(registerSchema, req.body)
  const email = input.email.toLowerCase()
  const existing = await User.exists({ email })
  if (existing) return res.status(409).json({ success: false, error: { message: 'An account with that email already exists.' } })

  const user = await User.create({
    fullName: input.fullName,
    email,
    role: 'user',
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

async function authenticate(req, res, { adminOnly }) {
  const input = validate(loginSchema, req.body)
  const user = await User.findOne({ email: input.email.toLowerCase() }).select('+passwordHash')
  const matches = user ? await bcrypt.compare(input.password, user.passwordHash) : false
  if (!matches) return res.status(401).json({ success: false, error: { message: 'Email or password is incorrect.' } })
  if (adminOnly && user.role !== 'admin') {
    return res.status(403).json({ success: false, error: { message: 'This account does not have administrator access.' } })
  }
  if (!adminOnly && user.role === 'admin') {
    return res.status(403).json({ success: false, error: { message: 'Use administrator sign-in at /admin/login.' } })
  }
  await User.updateOne({ _id: user._id }, { $set: { lastActiveAt: new Date() } })
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
}

router.post('/login', (req, res) => authenticate(req, res, { adminOnly: false }))
router.post('/admin/login', (req, res) => authenticate(req, res, { adminOnly: true }))

router.post('/heartbeat', requireAuth, async (req, res) => {
  const lastActiveAt = new Date()
  await User.updateOne({ _id: req.user._id }, { $set: { lastActiveAt } })
  res.json({ success: true, data: { lastActiveAt: lastActiveAt.toISOString() } })
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
