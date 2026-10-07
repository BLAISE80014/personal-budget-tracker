import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { Budget, Expense, trackerRecordModels } from '../models/TrackerRecords.js'
import { resourceSchemas, validate } from '../utils/validation.js'

const router = Router()
const resourceNames = Object.keys(resourceSchemas)

router.param('resource', (req, res, next, resource) => {
  if (!resourceNames.includes(resource) || !trackerRecordModels[resource]) {
    return res.status(404).json({ success: false, error: { message: 'Resource not found.' } })
  }
  req.resource = resource
  next()
})

function serialize(record) {
  if (!record) return null
  const item = { ...record }
  for (const key of ['_id', '__v', 'userId', 'createdAt', 'updatedAt']) delete item[key]
  return item
}

router.get('/:resource', async (req, res) => {
  const Model = trackerRecordModels[req.resource]
  const records = await Model.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean()
  res.json({ success: true, data: { items: records.map(serialize) } })
})

router.post('/:resource', async (req, res) => {
  const record = validate(resourceSchemas[req.resource], req.body)
  record.id ||= randomUUID()
  const Model = trackerRecordModels[req.resource]
  const created = await Model.create({ ...record, userId: req.user._id })
  res.status(201).json({ success: true, data: { item: serialize(created.toObject()) } })
})

router.patch('/:resource/:id', async (req, res) => {
  const record = validate(resourceSchemas[req.resource], { ...req.body, id: req.params.id })
  const Model = trackerRecordModels[req.resource]
  const current = req.resource === 'categories'
    ? await Model.findOne({ userId: req.user._id, id: req.params.id }).lean()
    : null
  if (req.resource === 'categories' && !current) {
    return res.status(404).json({ success: false, error: { message: 'Record not found.' } })
  }
  const previous = await Model.findOneAndUpdate(
    { userId: req.user._id, id: req.params.id },
    { $set: record },
    { returnDocument: 'after', runValidators: true },
  ).lean()
  if (!previous) return res.status(404).json({ success: false, error: { message: 'Record not found.' } })
  if (current && current.name !== record.name) {
    await Promise.all([
      Expense.updateMany({ userId: req.user._id, category: current.name }, { $set: { category: record.name } }),
      Budget.updateMany({ userId: req.user._id, category: current.name }, { $set: { category: record.name } }),
    ])
  }
  res.json({ success: true, data: { item: serialize(previous) } })
})

router.delete('/:resource/:id', async (req, res) => {
  const Model = trackerRecordModels[req.resource]
  const deleted = await Model.findOneAndDelete({ userId: req.user._id, id: req.params.id })
  if (!deleted) return res.status(404).json({ success: false, error: { message: 'Record not found.' } })
  res.json({ success: true, data: { id: req.params.id } })
})

export default router
