import { Router } from 'express'
import { Expense, Income, SavingsGoal } from '../models/TrackerRecords.js'

const router = Router()

router.get('/', async (req, res) => {
  const [incomeRecords, expenseRecords, savingsRecords, incomeCount, expenseCount] = await Promise.all([
    Income.find({ userId: req.user._id }).select('amount').lean(),
    Expense.find({ userId: req.user._id }).select('amount').lean(),
    SavingsGoal.find({ userId: req.user._id }).select('current').lean(),
    Income.countDocuments({ userId: req.user._id }),
    Expense.countDocuments({ userId: req.user._id }),
  ])
  const income = incomeRecords.reduce((total, item) => total + item.amount, 0)
  const expenses = expenseRecords.reduce((total, item) => total + item.amount, 0)
  const savings = savingsRecords.reduce((total, goal) => total + goal.current, 0)
  res.json({
    success: true,
    data: {
      totalIncome: income,
      totalExpenses: expenses,
      balance: income - expenses,
      savings,
      incomeCount,
      expenseCount,
      savingsGoalCount: savingsRecords.length,
    },
  })
})

export default router
