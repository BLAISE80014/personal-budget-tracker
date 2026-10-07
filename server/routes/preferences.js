import { Router } from 'express'
import FinanceData from '../models/FinanceData.js'
import { preferencesSchema, validate } from '../utils/validation.js'

const router = Router()

router.get('/', async (req, res) => {
  const data = await FinanceData.findOne({ userId: req.user._id }).select('preferences').lean()
  if (!data) return res.status(404).json({ success: false, error: { message: 'Tracker preferences were not found.' } })
  res.json({ success: true, data: { preferences: data.preferences } })
})

router.patch('/', async (req, res) => {
  const updates = validate(preferencesSchema, req.body)
  const data = await FinanceData.findOne({ userId: req.user._id })
  if (!data) return res.status(404).json({ success: false, error: { message: 'Tracker preferences were not found.' } })
  const current = data.preferences.toObject()
  data.preferences = {
    ...current,
    ...updates,
    notifications: { ...current.notifications, ...updates.notifications },
  }
  await data.save()
  res.json({ success: true, data: { preferences: data.preferences } })
})

export default router
