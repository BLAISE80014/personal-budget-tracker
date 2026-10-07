import mongoose from 'mongoose'

export async function connectDatabase(uri) {
  if (!uri) throw new Error('mongodb://127.0.0.1:27017/personal-budget-tracker')
  mongoose.set('strictQuery', true)
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    autoIndex: process.env.NODE_ENV !== 'production',
  })
  return mongoose.connection
}
