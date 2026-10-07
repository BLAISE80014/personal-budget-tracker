import mongoose from 'mongoose'

const recordBase = {
  id: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}

function createRecordModel(name, collection, fields) {
  const schema = new mongoose.Schema(
    { ...recordBase, ...fields },
    { timestamps: true, versionKey: false, strict: 'throw' },
  )
  schema.index(
    { userId: 1, id: 1 },
    { unique: true, partialFilterExpression: { userId: { $exists: true }, id: { $exists: true } } },
  )
  return mongoose.models[name] || mongoose.model(name, schema, collection)
}

export const Income = createRecordModel('Income', 'incomes', {
  date: { type: String, required: true },
  source: { type: String, required: true, trim: true, maxlength: 120 },
  amount: { type: Number, required: true, min: 0 },
  note: { type: String, default: '', maxlength: 500 },
})

export const Expense = createRecordModel('Expense', 'expenses', {
  date: { type: String, required: true },
  description: { type: String, required: true, trim: true, maxlength: 160 },
  category: { type: String, required: true, trim: true, maxlength: 100 },
  amount: { type: Number, required: true, min: 0 },
})

export const Category = createRecordModel('Category', 'categories', {
  name: { type: String, required: true, trim: true, maxlength: 100 },
  icon: { type: String, default: 'others', maxlength: 40 },
  count: { type: Number, default: 0, min: 0 },
})

export const Budget = createRecordModel('Budget', 'budgets', {
  category: { type: String, required: true, trim: true, maxlength: 100 },
  budget: { type: Number, required: true, min: 0 },
  spent: { type: Number, default: 0, min: 0 },
  month: { type: String, default: '', match: /^\d{4}-\d{2}$/ },
})

export const SavingsGoal = createRecordModel('SavingsGoal', 'savinggoals', {
  name: { type: String, required: true, trim: true, maxlength: 120 },
  current: { type: Number, required: true, min: 0 },
  target: { type: Number, required: true, min: 0 },
  date: { type: String, required: true },
  icon: { type: String, default: 'laptop', maxlength: 40 },
})

export const Notification = createRecordModel('Notification', 'notifications', {
  type: { type: String, required: true, maxlength: 40 },
  title: { type: String, required: true, maxlength: 160 },
  message: { type: String, default: '', maxlength: 500 },
  createdAt: { type: Number, required: true },
  read: { type: Boolean, default: false },
})

export const Payment = createRecordModel('Payment', 'payments', {
  date: { type: String, required: true },
  description: { type: String, required: true, trim: true, maxlength: 160 },
  amount: { type: Number, required: true, min: 0 },
  method: { type: String, default: '', maxlength: 80 },
  status: { type: String, default: 'completed', maxlength: 40 },
})

export const trackerRecordModels = {
  income: Income,
  expenses: Expense,
  categories: Category,
  budgets: Budget,
  savings: SavingsGoal,
  payments: Payment,
}

export const trackerCollections = [
  Income,
  Expense,
  Category,
  Budget,
  SavingsGoal,
  Notification,
  Payment,
]
