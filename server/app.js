import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { requireAuth } from './middleware/auth.js'
import { errorHandler, notFound } from './middleware/errors.js'
import authRoutes from './routes/auth.js'
import dashboardRoutes from './routes/dashboard.js'
import dataRoutes from './routes/data.js'
import notificationRoutes from './routes/notifications.js'
import preferenceRoutes from './routes/preferences.js'
import resourceRoutes from './routes/resources.js'

const app = express()
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5174,http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.disable('x-powered-by')
app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false)
app.use(helmet())
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error('This origin is not allowed by the CORS policy.'))
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600,
}))
app.use(express.json({ limit: '256kb', strict: true }))
app.use(express.urlencoded({ extended: false, limit: '32kb' }))

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', database: 'connected', timestamp: new Date().toISOString() } })
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, error: { message: 'Too many authentication attempts. Try again in 15 minutes.' } },
})
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/dashboard', requireAuth, dashboardRoutes)
app.use('/api/data', requireAuth, dataRoutes)
app.use('/api/preferences', requireAuth, preferenceRoutes)
app.use('/api/notifications', requireAuth, notificationRoutes)
app.use('/api', requireAuth, resourceRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
