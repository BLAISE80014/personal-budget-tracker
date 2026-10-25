
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { requireAuth } from './middleware/auth.js'
import { errorHandler, notFound } from './middleware/errors.js'
import authRoutes from './routes/auth.js'
import adminRoutes from './routes/admin.js'
import dashboardRoutes from './routes/dashboard.js'
import dataRoutes from './routes/data.js'
import notificationRoutes from './routes/notifications.js'
import preferenceRoutes from './routes/preferences.js'
import resourceRoutes from './routes/resources.js'
import { requireAdmin } from './middleware/require-admin.js'

const app = express()

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean)

if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push(
    'http://localhost:5173',
    'http://localhost:5174',
  )
}

app.disable('x-powered-by')
app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false)

app.use(helmet())

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin.replace(/\/+$/, ''))) {
      return callback(null, true)
    }

    console.warn(`Blocked CORS origin: ${origin}`)
    return callback(null, false)
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  maxAge: 600,
}))

app.use(express.json({ limit: '256kb', strict: true }))
app.use(express.urlencoded({ extended: false, limit: '32kb' }))

app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Personal Budget Tracker API is running',
  })
})

app.get('/api', (_req, res) => {
  res.json({
    success: true,
    message: 'Personal Budget Tracker API',
    health: '/api/health',
  })
})

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  })
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts. Try again in 15 minutes.',
    },
  },
})

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many password reset attempts. Try again in 15 minutes.',
    },
  },
})

app.use('/api/auth/forgot-password', passwordResetLimiter)
app.use('/api/auth/reset-password', passwordResetLimiter)
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/admin', requireAuth, requireAdmin, adminRoutes)
app.use('/api/dashboard', requireAuth, dashboardRoutes)
app.use('/api/data', requireAuth, dataRoutes)
app.use('/api/preferences', requireAuth, preferenceRoutes)
app.use('/api/notifications', requireAuth, notificationRoutes)
app.use('/api', resourceRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
