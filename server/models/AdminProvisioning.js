import mongoose from 'mongoose'

const adminProvisioningSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sourceUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  email: { type: String, required: true, lowercase: true, trim: true },
  status: { type: String, enum: ['reserved', 'migrating', 'completed'], default: 'reserved', required: true },
}, { timestamps: true, versionKey: false })

export default mongoose.models.AdminProvisioning || mongoose.model('AdminProvisioning', adminProvisioningSchema)
