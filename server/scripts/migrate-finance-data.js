import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import mongoose from 'mongoose'
import FinanceData from '../models/FinanceData.js'
import User from '../models/User.js'
import { trackerRecordModels, Notification } from '../models/TrackerRecords.js'

const sourceCollections = {
  income: 'income',
  expenses: 'expenses',
  categories: 'categories',
  budgets: 'budgets',
  savings: 'savings',
}

function migrationRecord(item, resource, userId) {
  const id = String(item.id ?? randomUUID())
  const fields = {
    income: ['date', 'source', 'amount', 'note'],
    expenses: ['date', 'description', 'category', 'amount'],
    categories: ['name', 'icon', 'count'],
    budgets: ['category', 'budget', 'spent', 'month'],
    savings: ['name', 'current', 'target', 'date', 'icon'],
  }[resource]
  return Object.fromEntries([
    ['id', id],
    ['userId', userId],
    ...fields.filter((field) => item[field] !== undefined).map((field) => [field, item[field]]),
  ])
}

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI)
  try {
    const sourceDocuments = await FinanceData.find({}).lean()
    let migrated = 0
    for (const source of sourceDocuments) {
      if (!await User.exists({ _id: source.userId })) continue
      for (const resource of Object.keys(sourceCollections)) {
        const Model = trackerRecordModels[resource]
        for (const item of source[sourceCollections[resource]] || []) {
          const record = migrationRecord(item, resource, source.userId)
          await Model.updateOne(
            { userId: source.userId, id: record.id },
            { $setOnInsert: record },
            { upsert: true, runValidators: true, setDefaultsOnInsert: true },
          )
          migrated += 1
        }
      }
      for (const item of source.notifications || []) {
        const notification = {
          id: String(item.id ?? randomUUID()),
          userId: source.userId,
          type: item.type,
          title: item.title,
          message: item.message || '',
          createdAt: Number(item.createdAt ?? Date.now()),
          read: Boolean(item.read),
        }
        await Notification.updateOne(
          { userId: source.userId, id: notification.id },
          { $setOnInsert: notification },
          { upsert: true, runValidators: true, setDefaultsOnInsert: true },
        )
        migrated += 1
      }
    }
    console.log(`Migration complete. ${migrated} legacy records copied; source FinanceData documents were retained.`)
  } finally {
    await mongoose.disconnect()
  }
}

migrate().catch((error) => {
  console.error('Finance data migration failed:', error.message)
  process.exitCode = 1
})
