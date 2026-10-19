import mongoose from 'mongoose'

const adminActivitySchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  actorEmail: { type: String, required: true, lowercase: true, trim: true },
  targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetEmail: { type: String, required: true, lowercase: true, trim: true },
  previousRole: { type: String, enum: ['user', 'admin'], required: true },
  nextRole: { type: String, enum: ['user', 'admin'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending', required: true },
  eventKey: { type: String },
}, { timestamps: true, versionKey: false })

adminActivitySchema.index({ eventKey: 1 }, { unique: true, sparse: true })

export default mongoose.models.AdminActivity || mongoose.model('AdminActivity', adminActivitySchema)
