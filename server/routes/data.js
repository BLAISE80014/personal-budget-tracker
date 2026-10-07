import { Router } from 'express'
import { publicUser } from './auth.js'
import { trackerRecordModels } from '../models/TrackerRecords.js'

const router = Router()
const collections = ['income', 'expenses', 'categories', 'budgets', 'savings']

router.get('/', async (req, res) => {
  const records = await Promise.all(collections.map((collection) => (
    trackerRecordModels[collection].find({ userId: req.user._id }).sort({ createdAt: -1 }).lean()
  )))
  const data = Object.fromEntries(collections.map((collection, index) => [
    collection,
    records[index].map((record) => {
      const item = { ...record }
      for (const key of ['_id', '__v', 'userId', 'createdAt', 'updatedAt']) delete item[key]
      return item
    }),
  ]))
  res.json({ success: true, data: { ...data, user: publicUser(req.user) } })
})

export default router
