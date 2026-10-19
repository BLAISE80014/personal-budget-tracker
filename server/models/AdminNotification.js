import mongoose from 'mongoose'

const adminNotificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, maxlength: 160 },
  message: { type: String, required: true, maxlength: 500 },
  read: { type: Boolean, default: false, required: true },
}, { timestamps: true, versionKey: false })

adminNotificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 })

export default mongoose.models.AdminNotification || mongoose.model('AdminNotification', adminNotificationSchema)
