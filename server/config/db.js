
import mongoose from 'mongoose'

export async function connectDatabase(uri) {
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is required.')
  }

  if (
    !uri.startsWith('mongodb://') &&
    !uri.startsWith('mongodb+srv://')
  ) {
    throw new Error('MONGODB_URI must be a valid MongoDB connection string.')
  }

  mongoose.set('strictQuery', true)

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 20000,
      autoIndex: process.env.NODE_ENV !== 'production',
    })

    console.log('MongoDB connected successfully.')

    return mongoose.connection
  } catch (error) {
    console.error('MongoDB connection failed:', error.message)
  }
}
