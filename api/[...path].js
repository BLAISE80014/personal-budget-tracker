
import app from '../server/app.js'
import { connectDatabase } from '../server/config/db.js'

let databaseConnection

async function ensureDatabaseConnection() {
  if (!databaseConnection) {
    databaseConnection = connectDatabase(process.env.MONGODB_URI).catch((error) => {
      databaseConnection = undefined
      throw error
    })
  }

  return databaseConnection
}

export default async function handler(req, res) {
  try {
    await ensureDatabaseConnection()
    return app(req, res)
  } catch (error) {
    console.error('API initialization failed:', error.message)

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: {
          message: 'The API could not initialize. Check server configuration.',
        },
      })
    }
  }
}
