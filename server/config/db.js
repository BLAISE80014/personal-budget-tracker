import mongoose from 'mongoose'

export async function connectDatabase(uri) {
  if (!uri) throw new Error('MONGODB_URI environment variable is required.')
  mongoose.set('strictQuery', true)
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    autoIndex: process.env.NODE_ENV !== 'production',
  })
  return mongoose.connection
}
