import 'dotenv/config'
import app from './app.js'
import { connectDatabase } from './config/db.js'
import { trackerCollections } from './models/TrackerRecords.js'

const port = Number(process.env.PORT || 5000)

async function start() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be set to a random value at least 32 characters long.')
  }
  await connectDatabase(process.env.MONGODB_URI)
  await Promise.all(trackerCollections.map((Model) => Model.createCollection()))
  const server = app.listen(port, () => {
    console.log(`Personal Budget Tracker API listening on http://localhost:${port}`)
  })

  const shutdown = async (signal) => {
    console.log(`${signal} received; shutting down gracefully.`)
    server.close(async () => {
      const mongoose = await import('mongoose')
      await mongoose.default.disconnect()
      process.exit(0)
    })
  }
  process.once('SIGINT', () => shutdown('SIGINT'))
  process.once('SIGTERM', () => shutdown('SIGTERM'))
}

start().catch((error) => {
  console.error('Unable to start the API:', error.message)
  process.exitCode = 1
})
