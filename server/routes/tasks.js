import { Router } from 'express'
import mongoose from 'mongoose'
import { z } from 'zod'
import Task from '../models/Task.js'
import { validate } from '../utils/validation.js'
import { notifyAdminsOfUserCreation } from '../utils/admin-notifications.js'

const router = Router()
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}, 'Enter a valid calendar date.')
const optionalDate = dateOnly.nullable().optional()
const taskFields = {
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).optional(),
  category: z.string().trim().max(80).optional(),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  status: z.enum(['Pending', 'In Progress', 'Completed']).optional(),
  startDate: optionalDate,
  dueDate: optionalDate,
  reminderAt: optionalDate,
}
const createTaskSchema = z.object(taskFields).strict().superRefine((task, context) => {
  if (task.startDate && task.dueDate && task.startDate > task.dueDate) {
    context.addIssue({ code: 'custom', path: ['dueDate'], message: 'Due date must be on or after the start date.' })
  }
})
const updateTaskSchema = z.object(taskFields).partial().strict().refine((task) => Object.keys(task).length > 0, 'Provide at least one task field to update.')
  .superRefine((task, context) => {
    if (task.startDate && task.dueDate && task.startDate > task.dueDate) {
      context.addIssue({ code: 'custom', path: ['dueDate'], message: 'Due date must be on or after the start date.' })
    }
  })

function serialize(task) {
  const fields = { ...task }
  const id = String(fields._id)
  delete fields._id
  delete fields.userId
  return { id, ...fields }
}

function taskIdParam(value) {
  if (!mongoose.isValidObjectId(value)) {
    const error = new Error('Task not found.')
    error.statusCode = 404
    throw error
  }
  return value
}

router.get('/', async (req, res) => {
  const tasks = await Task.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean()
  res.json({ success: true, data: { tasks: tasks.map(serialize) } })
})

router.post('/', async (req, res) => {
  const input = validate(createTaskSchema, req.body)
  const fields = {
    ...input,
    description: input.description ?? '',
    category: input.category ?? '',
    priority: input.priority ?? 'Medium',
    status: input.status ?? 'Pending',
    completedAt: input.status === 'Completed' ? new Date() : null,
  }
  const task = await Task.create({ ...fields, userId: req.user._id })
  await notifyAdminsOfUserCreation(req.user, 'task')
  res.status(201).json({ success: true, data: { task: serialize(task.toObject()) } })
})

router.get('/:taskId', async (req, res) => {
  const task = await Task.findOne({ _id: taskIdParam(req.params.taskId), userId: req.user._id }).lean()
  if (!task) return res.status(404).json({ success: false, error: { message: 'Task not found.' } })
  res.json({ success: true, data: { task: serialize(task) } })
})

router.patch('/:taskId', async (req, res) => {
  const input = validate(updateTaskSchema, req.body)
  const taskId = taskIdParam(req.params.taskId)
  const existing = await Task.findOne({ _id: taskId, userId: req.user._id }).select('startDate dueDate').lean()
  if (!existing) return res.status(404).json({ success: false, error: { message: 'Task not found.' } })
  const startDate = input.startDate === undefined ? existing.startDate : input.startDate
  const dueDate = input.dueDate === undefined ? existing.dueDate : input.dueDate
  if (startDate && dueDate && startDate > dueDate) {
    return res.status(400).json({ success: false, error: { message: 'Due date must be on or after the start date.' } })
  }
  const updates = { ...input }
  if (input.status === 'Completed') updates.completedAt = new Date()
  else if (input.status) updates.completedAt = null

  const task = await Task.findOneAndUpdate(
    { _id: taskId, userId: req.user._id },
    { $set: updates },
    { returnDocument: 'after', runValidators: true },
  ).lean()
  if (!task) return res.status(404).json({ success: false, error: { message: 'Task not found.' } })
  res.json({ success: true, data: { task: serialize(task) } })
})

router.delete('/:taskId', async (req, res) => {
  const deleted = await Task.findOneAndDelete({ _id: taskIdParam(req.params.taskId), userId: req.user._id })
  if (!deleted) return res.status(404).json({ success: false, error: { message: 'Task not found.' } })
  res.json({ success: true, data: { id: String(deleted._id) } })
})

export default router
