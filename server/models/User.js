import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  phone: { type: String, default: '', trim: true, maxlength: 40 },
  avatar: { type: String, default: '', maxlength: 200_000 },
  passwordHash: { type: String, required: true, select: false },
}, { timestamps: true, versionKey: false })

export default mongoose.model('User', userSchema)
