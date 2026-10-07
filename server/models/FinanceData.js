import mongoose from 'mongoose'

const recordOptions = { _id: false, strict: 'throw' }
const incomeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  date: { type: String, required: true },
  source: { type: String, required: true, trim: true, maxlength: 120 },
  amount: { type: Number, required: true, min: 0 },
  note: { type: String, default: '', maxlength: 500 },
}, recordOptions)
const expenseSchema = new mongoose.Schema({
  id: { type: String, required: true },
  date: { type: String, required: true },
  description: { type: String, required: true, trim: true, maxlength: 160 },
  category: { type: String, required: true, trim: true, maxlength: 100 },
  amount: { type: Number, required: true, min: 0 },
}, recordOptions)
const categorySchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  icon: { type: String, default: 'others', maxlength: 40 },
  count: { type: Number, default: 0, min: 0 },
}, recordOptions)
const budgetSchema = new mongoose.Schema({
  id: { type: String, required: true },
  category: { type: String, required: true, trim: true, maxlength: 100 },
  budget: { type: Number, required: true, min: 0 },
  spent: { type: Number, default: 0, min: 0 },
  month: { type: String, default: '', match: /^\d{4}-\d{2}$/ },
}, recordOptions)
const savingsSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  current: { type: Number, required: true, min: 0 },
  target: { type: Number, required: true, min: 0 },
  date: { type: String, required: true },
  icon: { type: String, default: 'laptop', maxlength: 40 },
}, recordOptions)
const notificationSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, required: true, maxlength: 40 },
  title: { type: String, required: true, maxlength: 160 },
  message: { type: String, required: true, maxlength: 500 },
  createdAt: { type: Number, required: true },
  read: { type: Boolean, default: false },
}, recordOptions)
const preferencesSchema = new mongoose.Schema({
  notifications: {
    enabled: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    budgetAlerts: { type: Boolean, default: true },
    expenseAlerts: { type: Boolean, default: true },
    incomeAlerts: { type: Boolean, default: true },
    savingsAlerts: { type: Boolean, default: true },
  },
  currency: { type: String, default: 'USD', enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'RWF'] },
  language: { type: String, default: 'English', enum: ['English', 'French', 'Spanish'] },
  dateFormat: { type: String, default: 'MMM d, yyyy', enum: ['MMM d, yyyy', 'MM/dd/yyyy', 'dd/MM/yyyy', 'yyyy-MM-dd'] },
  theme: { type: String, default: 'light', enum: ['light', 'dark', 'system'] },
}, { _id: false, strict: 'throw' })

const financeDataSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  income: { type: [incomeSchema], default: [] },
  expenses: { type: [expenseSchema], default: [] },
  categories: { type: [categorySchema], default: [] },
  budgets: { type: [budgetSchema], default: [] },
  savings: { type: [savingsSchema], default: [] },
  preferences: { type: preferencesSchema, default: () => ({}) },
  notifications: { type: [notificationSchema], default: [] },
}, { timestamps: true, versionKey: false })

export default mongoose.model('FinanceData', financeDataSchema)
