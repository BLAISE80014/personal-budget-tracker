import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { ensureFinanceData } from '../utils/finance-data.js'

export async function requireAuth(req, res, next) {
  try {
    const authorization = req.get('authorization') || ''
    const [scheme, token] = authorization.split(' ')
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ success: false, error: { message: 'Authentication is required.' } })
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET)
    if (typeof payload !== 'object' || !payload.sub) {
      return res.status(401).json({ success: false, error: { message: 'The access token is invalid.' } })
    }

    const user = await User.findById(payload.sub).select('_id fullName email phone avatar createdAt')
    if (!user) return res.status(401).json({ success: false, error: { message: 'The account no longer exists.' } })
    await ensureFinanceData(user._id)
    req.user = user
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, error: { message: 'Your session is invalid or expired. Please sign in again.' } })
    }
    next(error)
  }
}
