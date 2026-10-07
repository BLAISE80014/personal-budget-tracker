import { Bell, BookOpen, CarFront, Clapperboard, CreditCard, FileText, HeartPulse, Home, Landmark, Lightbulb, Laptop, PackageOpen, PiggyBank, Plane, Shield, ShieldCheck, ShoppingBag, SlidersHorizontal, Sun, Target, Utensils, User, UserRound, Wallet } from 'lucide-react'

export const THEME_STORAGE_KEY = 'theme'
export const AUTH_STORAGE_KEY = 'budget-tracker-auth'
export const AUTH_ACCOUNT_KEY = 'budget-tracker-account'
export const APP_STORAGE_KEY = 'budget-tracker-data'
export const PREFERENCES_STORAGE_KEY = 'budget-tracker-preferences'
export const NOTIFICATIONS_STORAGE_KEY = 'budget-tracker-notifications'

export const defaultPreferences = {
  notifications: {
    enabled: true,
    email: true,
    push: true,
    budgetAlerts: true,
    expenseAlerts: true,
    incomeAlerts: true,
    savingsAlerts: true,
  },
  currency: 'USD',
  language: 'English',
  dateFormat: 'MMM d, yyyy',
  theme: 'light',
}

export const initialNotifications = [
  { id: 1, type: 'account', title: 'Welcome to your budget tracker', message: 'Your account is ready to use.', createdAt: Date.now() - 1000 * 60 * 8, read: false },
  { id: 2, type: 'budget', title: 'Budget limit is almost reached', message: 'Your Food budget is 84% used this month.', createdAt: Date.now() - 1000 * 60 * 48, read: false },
  { id: 3, type: 'income', title: 'New income was added', message: 'Your latest income record was saved.', createdAt: Date.now() - 1000 * 60 * 60 * 3, read: true },
  { id: 4, type: 'expense', title: 'New expense was added', message: 'Your latest expense record was saved.', createdAt: Date.now() - 1000 * 60 * 60 * 22, read: true },
  { id: 5, type: 'savings', title: 'Savings goal was updated', message: 'Your savings progress has been updated.', createdAt: Date.now() - 1000 * 60 * 60 * 48, read: true },
]

export const defaultUser = {
  fullName: 'Jane Cooper',
  email: 'jane.cooper@example.com',
  phone: '+1 (415) 234-9283',
  memberSince: 'May 11, 2024',
}

export const defaultData = {
  income: [
    { id: 1, date: 'May 20, 2024', source: 'Salary', amount: 5400, note: 'Monthly salary' },
    { id: 2, date: 'May 22, 2024', source: 'Freelance', amount: 1200, note: 'Website design' },
    { id: 3, date: 'May 23, 2024', source: 'Bonus', amount: 850, note: 'Performance bonus' },
    { id: 4, date: 'May 27, 2024', source: 'Gift', amount: 150, note: 'Birthday gift' },
    { id: 5, date: 'May 29, 2024', source: 'Investments', amount: 750, note: 'Stock dividends' },
  ],
  expenses: [
    { id: 1, date: 'May 18, 2024', description: 'Groceries', category: 'Food', amount: 260 },
    { id: 2, date: 'May 19, 2024', description: 'Rent', category: 'Rent', amount: 1450 },
    { id: 3, date: 'May 21, 2024', description: 'Transport', category: 'Transport', amount: 120 },
    { id: 4, date: 'May 23, 2024', description: 'Electricity bill', category: 'Bills', amount: 85 },
    { id: 5, date: 'May 24, 2024', description: 'Lunch', category: 'Food', amount: 28 },
    { id: 6, date: 'May 25, 2024', description: 'Fuel', category: 'Transport', amount: 64 },
    { id: 7, date: 'May 26, 2024', description: 'T-shirt', category: 'Shopping', amount: 42 },
    { id: 8, date: 'May 28, 2024', description: 'Streaming subscription', category: 'Entertainment', amount: 16 },
  ],
  categories: [
    { id: 1, name: 'Food', icon: 'food', count: 0 },
    { id: 2, name: 'Transport', icon: 'transport', count: 0 },
    { id: 3, name: 'Rent', icon: 'rent', count: 0 },
    { id: 4, name: 'Shopping', icon: 'shopping', count: 0 },
    { id: 5, name: 'Bills', icon: 'bills', count: 0 },
    { id: 6, name: 'Entertainment', icon: 'entertainment', count: 0 },
    { id: 7, name: 'Health', icon: 'health', count: 0 },
    { id: 8, name: 'Education', icon: 'education', count: 0 },
    { id: 9, name: 'Others', icon: 'others', count: 0 },
  ],
  budgets: [
    { id: 1, category: 'Food', budget: 500, spent: 0, month: '2024-05' },
    { id: 2, category: 'Transport', budget: 260, spent: 0, month: '2024-05' },
    { id: 3, category: 'Rent', budget: 1800, spent: 0, month: '2024-05' },
    { id: 4, category: 'Shopping', budget: 350, spent: 0, month: '2024-05' },
    { id: 5, category: 'Entertainment', budget: 300, spent: 0, month: '2024-05' },
  ],
  savings: [
    { id: 1, name: 'New Laptop', current: 780, target: 1500, date: 'Dec 25, 2024', icon: 'laptop' },
    { id: 2, name: 'Emergency Fund', current: 1000, target: 2000, date: 'Jul 02, 2025', icon: 'shield' },
    { id: 3, name: 'Vacation Trip', current: 2100, target: 4500, date: 'Aug 15, 2025', icon: 'plane' },
    { id: 4, name: 'New Car', current: 8000, target: 18000, date: 'Sep 30, 2026', icon: 'car' },
  ],
  user: defaultUser,
}

export const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: Home },
  { label: 'Income', path: '/income', icon: Wallet },
  { label: 'Expenses', path: '/expenses', icon: CreditCard },
  { label: 'Categories', path: '/categories', icon: Landmark },
  { label: 'Budgets', path: '/budgets', icon: PiggyBank },
  { label: 'Savings', path: '/savings', icon: Target },
  { label: 'Reports', path: '/reports', icon: FileText },
  { label: 'Profile', path: '/profile', icon: User },
]

export const settingSections = [
  { id: 'profile', label: 'Profile', icon: UserRound },
  { id: 'account', label: 'Account', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Sun },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal },
]

export const readPreferences = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY) || '{}')
    return { ...defaultPreferences, ...saved, notifications: { ...defaultPreferences.notifications, ...saved.notifications } }
  } catch {
    return defaultPreferences
  }
}

export const localeForLanguage = (language) => ({ French: 'fr-FR', Spanish: 'es-ES', English: 'en-US' }[language] || 'en-US')
export const money = (value) => {
  const preferences = readPreferences()
  return new Intl.NumberFormat(localeForLanguage(preferences.language), {
    style: 'currency',
    currency: preferences.currency,
    maximumFractionDigits: 0,
  }).format(value)
}
export const compactMoney = (value) => {
  const preferences = readPreferences()
  return new Intl.NumberFormat(localeForLanguage(preferences.language), {
    style: 'currency',
    currency: preferences.currency,
    notation: 'compact',
    compactDisplay: 'short',
    maximumSignificantDigits: 3,
  }).format(value)
}

export const todayInputDate = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
export const initials = (name) => name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
export const toInputDate = (value) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const humanDate = /^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})$/.exec(value)
  if (humanDate) {
    const monthIndex = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].indexOf(humanDate[1].slice(0, 3).toLowerCase())
    if (monthIndex !== -1) return `${humanDate[3]}-${String(monthIndex + 1).padStart(2, '0')}-${humanDate[2].padStart(2, '0')}`
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? todayInputDate() : `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`
}
export const belongsToMonth = (value, month) => {
  const parsed = new Date(value)
  return !Number.isNaN(parsed.getTime()) && `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}` === month
}
export const hashPassword = async (password) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}
export const formatDate = (value) => {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  const preferences = readPreferences()
  const locale = localeForLanguage(preferences.language)
  if (preferences.dateFormat === 'MM/dd/yyyy') return date.toLocaleDateString(locale, { month: '2-digit', day: '2-digit', year: 'numeric' })
  if (preferences.dateFormat === 'dd/MM/yyyy') return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
  if (preferences.dateFormat === 'yyyy-MM-dd') return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })
}

export const categoryIcons = {
  food: Utensils,
  transport: CarFront,
  rent: Home,
  shopping: ShoppingBag,
  bills: Lightbulb,
  entertainment: Clapperboard,
  health: HeartPulse,
  education: BookOpen,
  others: PackageOpen,
}

export const goalIcons = {
  laptop: Laptop,
  shield: Shield,
  plane: Plane,
  car: CarFront,
}

export const getExpenseBreakdown = (expenses) => {
  const totals = expenses.reduce((result, expense) => {
    result[expense.category] = (result[expense.category] ?? 0) + Number(expense.amount)
    return result
  }, {})
  const total = Object.values(totals).reduce((sum, amount) => sum + amount, 0)
  return Object.entries(totals)
    .map(([category, amount]) => ({ category, amount, percent: total ? (amount / total) * 100 : 0 }))
    .sort((left, right) => right.amount - left.amount)
}

export const expenseColors = ['#5b6cf2', '#8575ee', '#f0bd58', '#36b98b', '#3f9ee8', '#ed7f8d']
export const donutGradient = (breakdown) => {
  if (breakdown.length === 0) return 'conic-gradient(#e8ebf3 0 100%)'
  let position = 0
  const stops = breakdown.map((item, index) => {
    const start = position
    position += item.percent
    return `${expenseColors[index % expenseColors.length]} ${start}% ${position}%`
  })
  return `conic-gradient(${stops.join(', ')})`
}

export const percentageChange = (current, previous) => {
  if (previous === 0) return current === 0 ? '0%' : '+100%'
  const value = ((current - previous) / previous) * 100
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
}

export const getMonthlyTotals = (income, expenses) => {
  const entries = [
    ...income.map((entry) => ({ date: entry.date, income: Number(entry.amount), expenses: 0 })),
    ...expenses.map((entry) => ({ date: entry.date, income: 0, expenses: Number(entry.amount) })),
  ]
    .map((entry) => ({ ...entry, parsedDate: new Date(entry.date) }))
    .filter((entry) => !Number.isNaN(entry.parsedDate.getTime()))
  const latest = entries.reduce((date, entry) => entry.parsedDate > date ? entry.parsedDate : date, new Date(0))
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(latest.getFullYear(), latest.getMonth() - (5 - index), 1)
    return { date, label: date.toLocaleDateString('en-US', { month: 'short' }), income: 0, expenses: 0 }
  })
  for (const entry of entries) {
    const bucket = months.find((month) => month.date.getFullYear() === entry.parsedDate.getFullYear() && month.date.getMonth() === entry.parsedDate.getMonth())
    if (bucket) {
      bucket.income += entry.income
      bucket.expenses += entry.expenses
    }
  }
  return months
}

export const readData = () => {
  const saved = localStorage.getItem(APP_STORAGE_KEY)
  if (!saved) return defaultData

  try {
    return { ...defaultData, ...JSON.parse(saved) }
  } catch {
    return defaultData
  }
}
