import 'dotenv/config'
import app from './app.js'
import { connectDatabase } from './config/db.js'
import User from './models/User.js'
import { trackerCollections } from './models/TrackerRecords.js'

const port = Number(process.env.PORT || 5000)

const obsoleteTrackerIndexes = {
  categories: [{ name: 'user_1_name_1', key: { user: 1, name: 1 } }],
  budgets: [{ name: 'user_1_category_1_month_1_year_1', key: { user: 1, category: 1, month: 1, year: 1 } }],
}

async function removeObsoleteTrackerIndexes() {
  for (const Model of trackerCollections) {
    const obsolete = obsoleteTrackerIndexes[Model.collection.name] ?? []
    if (obsolete.length === 0) continue

    const indexes = await Model.collection.indexes()
    for (const expected of obsolete) {
      const index = indexes.find((candidate) =>
        candidate.name === expected.name &&
        JSON.stringify(candidate.key) === JSON.stringify(expected.key)
      )

      if (index) {
        try {
          await Model.collection.dropIndex(expected.name)
          console.log(`Dropped obsolete index ${expected.name} on ${Model.collection.name}`)
        } catch (err) {
          console.error(`Failed to drop index ${expected.name} on ${Model.collection.name}:`, err.message)
        }
      }
    }
  }
}

async function start() {
  try {
    await connectDatabase(process.env.MONGODB_URI)
    await User.collection.createIndex({ passwordResetTokenHash: 1 })
    await removeObsoleteTrackerIndexes()

    app.listen(port, () => {
      console.log(`Server listening on port ${port}`)
    })
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

start()