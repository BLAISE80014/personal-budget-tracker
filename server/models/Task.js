import mongoose from 'mongoose'

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, default: '', trim: true, maxlength: 2000 },
  category: { type: String, default: '', trim: true, maxlength: 80 },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium', required: true },
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending', required: true },
  startDate: { type: String, default: null },
  dueDate: { type: String, default: null },
  reminderAt: { type: String, default: null },
  completedAt: { type: Date, default: null },
}, { timestamps: true, versionKey: false })

taskSchema.index({ userId: 1, status: 1, dueDate: 1 })
taskSchema.index({ userId: 1, createdAt: -1 })

export default mongoose.models.Task || mongoose.model('Task', taskSchema)
