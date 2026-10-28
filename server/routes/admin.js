import { Router } from 'express'
import mongoose from 'mongoose'
import { z } from 'zod'
import AdminActivity from '../models/AdminActivity.js'
import AdminNotification from '../models/AdminNotification.js'
import AdminProvisioning from '../models/AdminProvisioning.js'
import User from '../models/User.js'
import { Budget, Category, Expense, Income, Payment, SavingsGoal } from '../models/TrackerRecords.js'
import Task from '../models/Task.js'
import { adminRoleSchema, validate } from '../utils/validation.js'

const router = Router()
const recordModels = {
  income: Income,
  expenses: Expense,
  categories: Category,
  budgets: Budget,
  savings: SavingsGoal,
  payments: Payment,
}
const datePattern = /^\d{4}-\d{2}-\d{2}$/
const ACTIVE_WINDOW_MS = 5 * 60 * 1000
const analyticsQuery = z.object({ range: z.enum(['7', '30', '90', '365']).default('30') }).strict()
const usersQuery = z.object({
  search: z.string().trim().max(120).default(''),
  role: z.enum(['all', 'admin', 'user']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(5).max(100).default(20),
}).strict()
const recordsQuery = z.object({
  type: z.enum(['all', ...Object.keys(recordModels)]).default('all'),
  search: z.string().trim().max(120).default(''),
  from: z.string().regex(datePattern).optional(),
  to: z.string().regex(datePattern).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(5).max(100).default(20),
}).strict().refine((query) => !query.from || !query.to || query.from <= query.to, {
  message: 'The start date must be on or before the end date.',
})
const activityQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(5).max(100).default(20),
}).strict()
const tasksQuery = z.object({
  search: z.string().trim().max(120).default(''),
  status: z.enum(['all', 'Pending', 'In Progress', 'Completed']).default('all'),
  priority: z.enum(['all', 'Low', 'Medium', 'High']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(5).max(100).default(20),
}).strict()
const escaped = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const textMatch = (value) => new RegExp(escaped(value), 'i')

function getRange(days) {
  const end = new Date()
  end.setUTCHours(23, 59, 59, 999)
  const start = new Date()
  start.setUTCHours(0, 0, 0, 0)
  start.setUTCDate(start.getUTCDate() - Number(days) + 1)
  return { start, end, monthly: Number(days) === 365 }
}

function periodKey(date, monthly) {
  return monthly
    ? `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
    : date.toISOString().slice(0, 10)
}

function createPeriods(start, end, monthly) {
  const cursor = new Date(start)
  const periods = []
  if (monthly) cursor.setUTCDate(1)
  while (cursor <= end) {
    periods.push(periodKey(cursor, monthly))
    if (monthly) cursor.setUTCMonth(cursor.getUTCMonth() + 1)
    else cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return periods
}

async function aggregateSeries(Model, start, end, monthly, valueField) {
  const dateExpression = {
    $dateFromString: {
      dateString: { $substrBytes: [{ $ifNull: ['$date', ''] }, 0, 10] },
      onError: null,
      onNull: null,
    },
  }
  const bucketFormat = monthly ? '%Y-%m' : '%Y-%m-%d'
  const pipeline = [
    { $addFields: { _adminDate: dateExpression } },
    { $match: { _adminDate: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: { $dateToString: { format: bucketFormat, date: '$_adminDate', timezone: 'UTC' } },
        total: { $sum: valueField ? `$${valueField}` : 1 },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]
  return Model.aggregate(pipeline)
}

async function aggregateDistribution(Model, start, end, field) {
  return Model.aggregate([
    {
      $addFields: {
        _adminDate: {
          $dateFromString: {
            dateString: { $substrBytes: [{ $ifNull: ['$date', ''] }, 0, 10] },
            onError: null,
            onNull: null,
          },
        },
      },
    },
    { $match: { _adminDate: { $gte: start, $lte: end } } },
    { $group: { _id: `$${field}`, total: { $sum: '$amount' } } },
    { $sort: { total: -1 } },
    { $limit: 6 },
  ])
}

router.get('/overview', async (_req, res) => {
  const activeSince = new Date(Date.now() - ACTIVE_WINDOW_MS)
  const [totalUsers, administrators, activeUsers, newUsersThisMonth, totalIncome, totalExpenses, savingsGoals] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ lastActiveAt: { $gte: activeSince } }),
    User.countDocuments({ createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }),
    Income.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
    Expense.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
    SavingsGoal.countDocuments(),
  ])

  res.json({
    success: true,
    data: {
      summary: {
        totalUsers,
        administrators,
        regularUsers: totalUsers - administrators,
        activeUsers,
        newUsersThisMonth,
        totalIncome: totalIncome[0]?.total ?? 0,
        totalExpenses: totalExpenses[0]?.total ?? 0,
        savingsGoals,
      },
    },
  })
})

router.get('/active-users', async (_req, res) => {
  const checkedAt = new Date()
  const activeSince = new Date(checkedAt.getTime() - ACTIVE_WINDOW_MS)
  const count = await User.countDocuments({ lastActiveAt: { $gte: activeSince } })
  res.json({
    success: true,
    data: {
      count,
      windowMinutes: ACTIVE_WINDOW_MS / 60_000,
      checkedAt: checkedAt.toISOString(),
    },
  })
})

router.get('/analytics', async (req, res) => {
  const { range } = validate(analyticsQuery, req.query)
  const { start, end, monthly } = getRange(range)
  const periods = createPeriods(start, end, monthly)
  const [userGrowth, incomeSeries, expenseSeries, incomeCategories, expenseCategories, savings] = await Promise.all([
    User.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: { $dateToString: { format: monthly ? '%Y-%m' : '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    aggregateSeries(Income, start, end, monthly, 'amount'),
    aggregateSeries(Expense, start, end, monthly, 'amount'),
    aggregateDistribution(Income, start, end, 'source'),
    aggregateDistribution(Expense, start, end, 'category'),
    SavingsGoal.aggregate([
      { $group: { _id: null, goals: { $sum: 1 }, saved: { $sum: '$current' }, target: { $sum: '$target' } } },
    ]),
  ])
  const byPeriod = (rows, field) => new Map(rows.map((row) => [row._id, row[field]]))
  const usersByPeriod = byPeriod(userGrowth, 'count')
  const incomeByPeriod = byPeriod(incomeSeries, 'total')
  const expenseByPeriod = byPeriod(expenseSeries, 'total')
  const incomeCounts = byPeriod(incomeSeries, 'count')
  const expenseCounts = byPeriod(expenseSeries, 'count')

  res.json({
    success: true,
    data: {
      range: Number(range),
      series: periods.map((period) => ({
        period,
        users: usersByPeriod.get(period) ?? 0,
        income: incomeByPeriod.get(period) ?? 0,
        expenses: expenseByPeriod.get(period) ?? 0,
        transactions: (incomeCounts.get(period) ?? 0) + (expenseCounts.get(period) ?? 0),
      })),
      incomeCategories: incomeCategories.map(({ _id, total }) => ({ name: _id || 'Unspecified', total })),
      expenseCategories: expenseCategories.map(({ _id, total }) => ({ name: _id || 'Unspecified', total })),
      savings: savings[0] ?? { goals: 0, saved: 0, target: 0 },
    },
  })
})

router.get('/users', async (req, res) => {
  const { search, role, page, limit } = validate(usersQuery, req.query)
  const filter = {}
  if (role !== 'all') filter.role = role
  if (search) {
    const match = textMatch(search)
    filter.$or = [{ fullName: match }, { email: match }]
  }
  const [total, users, initialSetup] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter).select('fullName email role avatar createdAt').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    AdminProvisioning.findById('initial-admin').select('userId').lean(),
  ])
  res.json({
    success: true,
    data: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      users: users.map(({ _id, fullName, email, role: userRole, avatar, createdAt }) => ({
        id: String(_id),
        fullName,
        email,
        role: userRole || 'user',
        avatar: avatar || '',
        createdAt,
        protected: String(_id) === String(initialSetup?.userId),
      })),
    },
  })
})

router.get('/users/:userId', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.userId)) {
    return res.status(400).json({ success: false, error: { message: 'Invalid account identifier.' } })
  }
  const [user, income, expenses, savings, budgets] = await Promise.all([
    User.findById(req.params.userId).select('fullName email role phone avatar createdAt').lean(),
    Income.aggregate([{ $match: { userId: new mongoose.Types.ObjectId(req.params.userId) } }, { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amount' } } }]),
    Expense.aggregate([{ $match: { userId: new mongoose.Types.ObjectId(req.params.userId) } }, { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amount' } } }]),
    SavingsGoal.countDocuments({ userId: req.params.userId }),
    Budget.countDocuments({ userId: req.params.userId }),
  ])
  if (!user) return res.status(404).json({ success: false, error: { message: 'Account not found.' } })
  res.json({
    success: true,
    data: {
      user: { id: String(user._id), fullName: user.fullName, email: user.email, role: user.role, phone: user.phone, avatar: user.avatar, createdAt: user.createdAt },
      finance: {
        incomeCount: income[0]?.count ?? 0,
        incomeTotal: income[0]?.total ?? 0,
        expenseCount: expenses[0]?.count ?? 0,
        expenseTotal: expenses[0]?.total ?? 0,
        savingsGoals: savings,
        budgets,
      },
    },
  })
})

router.get('/tasks', async (req, res) => {
  const { search, status, priority, page, limit } = validate(tasksQuery, req.query)
  const filter = {}
  if (status !== 'all') filter.status = status
  if (priority !== 'all') filter.priority = priority
  if (search) {
    const match = textMatch(search)
    filter.$or = [{ title: match }, { description: match }, { category: match }]
  }
  const [total, tasks] = await Promise.all([
    Task.countDocuments(filter),
    Task.find(filter)
      .select('userId title description category priority status startDate dueDate reminderAt completedAt createdAt updatedAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ])
  const ownerIds = [...new Set(tasks.map((task) => String(task.userId)))]
  const owners = await User.find({ _id: { $in: ownerIds } }).select('fullName email').lean()
  const ownerById = new Map(owners.map((owner) => [String(owner._id), owner]))

  res.json({
    success: true,
    data: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      tasks: tasks.map((task) => {
        const fields = { ...task }
        const id = String(fields._id)
        const owner = ownerById.get(String(fields.userId)) ?? null
        delete fields._id
        delete fields.userId
        return { id, ...fields, owner }
      }),
    },
  })
})

router.get('/records', async (req, res) => {
  const { type, search, from, to, page, limit } = validate(recordsQuery, req.query)
  const types = type === 'all' ? ['income', 'expenses', 'payments'] : [type]
  const pipelineFor = (recordType) => {
    const filter = {}
    if (from || to) {
      const date = {}
      if (from) date.$gte = from
      if (to) date.$lte = to
      filter.date = date
    }
    if (search) {
      const match = textMatch(search)
      const fields = {
        income: ['source', 'note'],
        expenses: ['description', 'category'],
        payments: ['description', 'method', 'status'],
        savings: ['name'],
        budgets: ['category'],
        categories: ['name'],
      }[recordType]
      filter.$or = fields.map((field) => ({ [field]: match }))
    }
    return [{ $match: filter }, { $addFields: { recordType: { $literal: recordType } } }]
  }
  const baseType = types[0]
  const pipeline = [...pipelineFor(baseType)]
  for (const otherType of types.slice(1)) {
    pipeline.push({
      $unionWith: {
        coll: recordModels[otherType].collection.name,
        pipeline: pipelineFor(otherType),
      },
    })
  }
  pipeline.push(
    { $sort: { date: -1, createdAt: -1 } },
    {
      $facet: {
        metadata: [{ $count: 'total' }],
        records: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $lookup: {
              from: User.collection.name,
              localField: 'userId',
              foreignField: '_id',
              as: 'owner',
              pipeline: [{ $project: { fullName: 1, email: 1 } }],
            },
          },
          { $unwind: { path: '$owner', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 0,
              userId: 0,
              updatedAt: 0,
              'owner._id': 0,
            },
          },
        ],
      },
    },
  )
  const [result = { metadata: [], records: [] }] = await recordModels[baseType].aggregate(pipeline)
  const total = result.metadata[0]?.total ?? 0
  res.json({
    success: true,
    data: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      records: result.records.map(({ id, recordType, owner, ...fields }) => ({
        id,
        recordType,
        owner: owner ? { name: owner.fullName, email: owner.email } : null,
        ...fields,
      })),
    },
  })
})

router.get('/activity', async (req, res) => {
  const { page, limit } = validate(activityQuery, req.query)
  const [total, activity] = await Promise.all([
    AdminActivity.countDocuments(),
    AdminActivity.find().select('actorEmail targetEmail previousRole nextRole status createdAt').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
  ])
  res.json({ success: true, data: { page, limit, total, pages: Math.ceil(total / limit), activity } })
})

router.get('/notifications', async (req, res) => {
  const { page, limit } = validate(activityQuery, req.query)
  const filter = { recipientId: req.user._id }
  const [total, unread, notifications] = await Promise.all([
    AdminNotification.countDocuments(filter),
    AdminNotification.countDocuments({ ...filter, read: false }),
    AdminNotification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
  ])
  res.json({
    success: true,
    data: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      unread,
      notifications: notifications.map(({ _id, title, message, read, createdAt }) => ({
        id: String(_id), title, message, read, createdAt,
      })),
    },
  })
})

router.patch('/notifications/read-all', async (req, res) => {
  await AdminNotification.updateMany(
    { recipientId: req.user._id, read: false },
    { $set: { read: true } },
  )
  res.json({ success: true, data: { unread: 0 } })
})

router.patch('/notifications/:notificationId/read', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.notificationId)) {
    return res.status(400).json({ success: false, error: { message: 'Invalid notification identifier.' } })
  }
  const notification = await AdminNotification.findOneAndUpdate(
    { _id: req.params.notificationId, recipientId: req.user._id },
    { $set: { read: true } },
    { returnDocument: 'after' },
  ).select('_id read')
  if (!notification) return res.status(404).json({ success: false, error: { message: 'Notification not found.' } })
  res.json({ success: true, data: { id: String(notification._id), read: notification.read } })
})

router.patch('/users/:userId/role', async (req, res) => {
  const { role } = validate(adminRoleSchema, req.body)
  if (!mongoose.isValidObjectId(req.params.userId)) {
    return res.status(400).json({ success: false, error: { message: 'Invalid account identifier.' } })
  }
  if (String(req.user._id) === req.params.userId) {
    return res.status(400).json({ success: false, error: { message: 'You cannot change your own administrator role.' } })
  }

  const target = await User.findById(req.params.userId).select('_id email role')
  if (!target) return res.status(404).json({ success: false, error: { message: 'Account not found.' } })
  const previousRole = target.role || 'user'
  if (previousRole === role) {
    return res.json({ success: true, data: { user: { id: String(target._id), email: target.email, role } } })
  }
  if (role === 'user') {
    const initialSetup = await AdminProvisioning.findById('initial-admin').select('userId').lean()
    if (initialSetup && String(initialSetup.userId) === String(target._id)) {
      return res.status(400).json({ success: false, error: { message: 'The initial administrator cannot be demoted.' } })
    }
  }

  const activity = await AdminActivity.create({
    actorId: req.user._id,
    actorEmail: req.user.email,
    targetUserId: target._id,
    targetEmail: target.email,
    previousRole,
    nextRole: role,
  })
  const update = await User.updateOne(
    { _id: target._id, role: previousRole },
    { $set: { role } },
    { runValidators: true },
  )
  if (update.modifiedCount !== 1) {
    await AdminActivity.updateOne({ _id: activity._id }, { $set: { status: 'failed' } })
    return res.status(409).json({ success: false, error: { message: 'The account role changed. Refresh and try again.' } })
  }

  await Promise.all([
    AdminActivity.updateOne({ _id: activity._id }, { $set: { status: 'completed' } }),
    AdminNotification.insertMany(
      (await User.find({ role: 'admin' }).select('_id').lean()).map(({ _id }) => ({
        recipientId: _id,
        title: 'Account role updated',
        message: `${target.email} was changed from ${previousRole} to ${role} by ${req.user.email}.`,
      })),
    ),
  ])
  res.json({ success: true, data: { user: { id: String(target._id), email: target.email, role } } })
})

export default router
