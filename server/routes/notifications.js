import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { Notification } from '../models/TrackerRecords.js'
import { notificationSchema, validate } from '../utils/validation.js'

const router = Router()

router.get('/', async (req, res) => {
  const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(100).lean()
  res.json({ success: true, data: { notifications: notifications.map(serialize) } })
})

router.post('/', async (req, res) => {
  const notification = validate(notificationSchema, req.body)
  notification.id ||= randomUUID()
  const created = await Notification.create({ ...notification, userId: req.user._id })
  res.status(201).json({ success: true, data: { notification: serialize(created.toObject()) } })
})

router.patch('/read-all', async (req, res) => {
  await Notification.updateMany({ userId: req.user._id, read: false }, { $set: { read: true } })
  const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(100).lean()
  res.json({ success: true, data: { notifications: notifications.map(serialize) } })
})

router.patch('/:id/read', async (req, res) => {
  const updated = await Notification.findOneAndUpdate(
    { userId: req.user._id, id: req.params.id },
    { $set: { read: true } },
    { returnDocument: 'after' },
  )
  if (!updated) return res.status(404).json({ success: false, error: { message: 'Notification not found.' } })
  const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(100).lean()
  res.json({ success: true, data: { notifications: notifications.map(serialize) } })
})

function serialize(record) {
  const item = { ...record }
  for (const key of ['_id', '__v', 'userId', 'updatedAt']) delete item[key]
  return item
}

export default router
