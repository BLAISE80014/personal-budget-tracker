import AdminNotification from '../models/AdminNotification.js'
import User from '../models/User.js'

const creationEvents = {
  account: { title: 'New account registered', action: 'registered an account' },
  income: { title: 'New income recorded', action: 'created an income record' },
  expenses: { title: 'New expense recorded', action: 'created an expense record' },
  categories: { title: 'New category created', action: 'created a category' },
  budgets: { title: 'New budget created', action: 'created a budget' },
  savings: { title: 'New savings goal created', action: 'created a savings goal' },
  payments: { title: 'New payment recorded', action: 'created a payment' },
  task: { title: 'New task created', action: 'created a task' },
}

export async function notifyAdminsOfUserCreation(user, itemType) {
  const event = creationEvents[itemType]
  if (!event) throw new Error(`Unknown user creation event: ${itemType}`)

  try {
    const admins = await User.find({ role: 'admin' }).select('_id').lean()
    if (!admins.length) return

    await AdminNotification.insertMany(admins.map(({ _id }) => ({
      recipientId: _id,
      title: event.title,
      message: `${user.fullName} (${user.email}) ${event.action}.`,
    })))
  } catch (error) {
    console.error(`Failed to notify administrators about ${itemType} creation:`, error)
  }
}
