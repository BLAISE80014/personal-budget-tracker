import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  Bell,
  BookOpen,
  ArrowUp,
  BellRing,
  CalendarDays,
  CarFront,
  CheckCheck,
  ChevronRight,
  Clapperboard,
  CreditCard,
  DollarSign,
  Download,
  Edit3,
  FileText,
  HeartPulse,
  Home,
  Languages,
  Landmark,
  Lightbulb,
  Laptop,
  LogOut,
  Mail,
  Moon,
  MoreHorizontal,
  Monitor,
  PackageOpen,
  PiggyBank,
  Plane,
  Plus,
  ShoppingBag,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Utensils,
  User,
  UserRound,
  Wallet,
} from 'lucide-react'
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import './App.css'

const THEME_STORAGE_KEY = 'theme'
const AUTH_STORAGE_KEY = 'budget-tracker-auth'
const AUTH_ACCOUNT_KEY = 'budget-tracker-account'
const APP_STORAGE_KEY = 'budget-tracker-data'
const PREFERENCES_STORAGE_KEY = 'budget-tracker-preferences'
const NOTIFICATIONS_STORAGE_KEY = 'budget-tracker-notifications'

const defaultPreferences = {
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
}

const initialNotifications = [
  { id: 1, type: 'account', title: 'Welcome to your budget tracker', message: 'Your account is ready to use.', createdAt: Date.now() - 1000 * 60 * 8, read: false },
  { id: 2, type: 'budget', title: 'Budget limit is almost reached', message: 'Your Food budget is 84% used this month.', createdAt: Date.now() - 1000 * 60 * 48, read: false },
  { id: 3, type: 'income', title: 'New income was added', message: 'Your latest income record was saved.', createdAt: Date.now() - 1000 * 60 * 60 * 3, read: true },
  { id: 4, type: 'expense', title: 'New expense was added', message: 'Your latest expense record was saved.', createdAt: Date.now() - 1000 * 60 * 60 * 22, read: true },
  { id: 5, type: 'savings', title: 'Savings goal was updated', message: 'Your savings progress has been updated.', createdAt: Date.now() - 1000 * 60 * 60 * 48, read: true },
]

const defaultUser = {
  fullName: 'Jane Cooper',
  email: 'jane.cooper@example.com',
  phone: '+1 (415) 234-9283',
  memberSince: 'May 11, 2024',
}

const defaultData = {
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

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: Home },
  { label: 'Income', path: '/income', icon: Wallet },
  { label: 'Expenses', path: '/expenses', icon: CreditCard },
  { label: 'Categories', path: '/categories', icon: Landmark },
  { label: 'Budgets', path: '/budgets', icon: PiggyBank },
  { label: 'Savings', path: '/savings', icon: Target },
  { label: 'Reports', path: '/reports', icon: FileText },
  { label: 'Profile', path: '/profile', icon: User },
]

const readPreferences = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY) || '{}')
    return { ...defaultPreferences, ...saved, notifications: { ...defaultPreferences.notifications, ...saved.notifications } }
  } catch {
    return defaultPreferences
  }
}

const localeForLanguage = (language) => ({ French: 'fr-FR', Spanish: 'es-ES', English: 'en-US' }[language] || 'en-US')
const money = (value) => {
  const preferences = readPreferences()
  return new Intl.NumberFormat(localeForLanguage(preferences.language), {
    style: 'currency',
    currency: preferences.currency,
    maximumFractionDigits: 0,
  }).format(value)
}
const compactMoney = (value) => {
  const preferences = readPreferences()
  return new Intl.NumberFormat(localeForLanguage(preferences.language), {
    style: 'currency',
    currency: preferences.currency,
    notation: 'compact',
    compactDisplay: 'short',
    maximumSignificantDigits: 3,
  }).format(value)
}

const todayInputDate = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
const initials = (name) => name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
const toInputDate = (value) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const humanDate = /^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})$/.exec(value)
  if (humanDate) {
    const monthIndex = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].indexOf(humanDate[1].slice(0, 3).toLowerCase())
    if (monthIndex !== -1) return `${humanDate[3]}-${String(monthIndex + 1).padStart(2, '0')}-${humanDate[2].padStart(2, '0')}`
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? todayInputDate() : `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`
}
const belongsToMonth = (value, month) => {
  const parsed = new Date(value)
  return !Number.isNaN(parsed.getTime()) && `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}` === month
}
const hashPassword = async (password) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}
const formatDate = (value) => {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  const preferences = readPreferences()
  const locale = localeForLanguage(preferences.language)
  if (preferences.dateFormat === 'MM/dd/yyyy') return date.toLocaleDateString(locale, { month: '2-digit', day: '2-digit', year: 'numeric' })
  if (preferences.dateFormat === 'dd/MM/yyyy') return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
  if (preferences.dateFormat === 'yyyy-MM-dd') return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })
}

const categoryIcons = {
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

const goalIcons = {
  laptop: Laptop,
  shield: Shield,
  plane: Plane,
  car: CarFront,
}

const getExpenseBreakdown = (expenses) => {
  const totals = expenses.reduce((result, expense) => {
    result[expense.category] = (result[expense.category] ?? 0) + Number(expense.amount)
    return result
  }, {})
  const total = Object.values(totals).reduce((sum, amount) => sum + amount, 0)
  return Object.entries(totals)
    .map(([category, amount]) => ({ category, amount, percent: total ? (amount / total) * 100 : 0 }))
    .sort((left, right) => right.amount - left.amount)
}

const expenseColors = ['#5b6cf2', '#8575ee', '#f0bd58', '#36b98b', '#3f9ee8', '#ed7f8d']
const donutGradient = (breakdown) => {
  if (breakdown.length === 0) return 'conic-gradient(#e8ebf3 0 100%)'
  let position = 0
  const stops = breakdown.map((item, index) => {
    const start = position
    position += item.percent
    return `${expenseColors[index % expenseColors.length]} ${start}% ${position}%`
  })
  return `conic-gradient(${stops.join(', ')})`
}

const percentageChange = (current, previous) => {
  if (previous === 0) return current === 0 ? '0%' : '+100%'
  const value = ((current - previous) / previous) * 100
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
}

const getMonthlyTotals = (income, expenses) => {
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

const readData = () => {
  const saved = localStorage.getItem(APP_STORAGE_KEY)
  if (!saved) return defaultData

  try {
    return { ...defaultData, ...JSON.parse(saved) }
  } catch {
    return defaultData
  }
}

const ThemeContext = createContext(null)
const AppDataContext = createContext(null)
const PreferencesContext = createContext(null)
const NotificationsContext = createContext(null)

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    return ['light', 'dark', 'system'].includes(saved) ? saved : 'light'
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const applyTheme = () => document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && mediaQuery.matches))
    applyTheme()
    localStorage.setItem(THEME_STORAGE_KEY, theme)
    if (theme === 'system') {
      mediaQuery.addEventListener('change', applyTheme)
      return () => mediaQuery.removeEventListener('change', applyTheme)
    }
  }, [theme])

  const value = useMemo(() => ({
    theme,
    setTheme,
    toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
  }), [theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

function PreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(readPreferences)

  useEffect(() => {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences))
  }, [preferences])

  const value = useMemo(() => ({ preferences, setPreferences }), [preferences])
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

function readNotifications() {
  try {
    const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
    if (!saved) return initialNotifications
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : initialNotifications
  } catch {
    return initialNotifications
  }
}

function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState(readNotifications)
  const { preferences } = useContext(PreferencesContext)

  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications))
  }, [notifications])

  const addNotification = useCallback((type, title, message) => {
    const preferenceKey = {
      budget: 'budgetAlerts',
      expense: 'expenseAlerts',
      income: 'incomeAlerts',
      savings: 'savingsAlerts',
    }[type]
    if (!preferences.notifications.enabled || (preferenceKey && !preferences.notifications[preferenceKey])) return
    setNotifications((items) => [{ id: `${Date.now()}-${Math.random()}`, type, title, message, createdAt: Date.now(), read: false }, ...items])
  }, [preferences.notifications])
  const markRead = useCallback((id) => setNotifications((items) => items.map((item) => item.id === id ? { ...item, read: true } : item)), [])
  const markAllRead = useCallback(() => setNotifications((items) => items.map((item) => ({ ...item, read: true }))), [])

  const value = useMemo(() => ({ notifications, addNotification, markRead, markAllRead }), [notifications, addNotification, markRead, markAllRead])
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

function AppDataProvider({ children }) {
  const [data, setData] = useState(readData)

  useEffect(() => {
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(data))
  }, [data])

  return <AppDataContext.Provider value={{ data, setData }}>{children}</AppDataContext.Provider>
}

function useTheme() {
  return useContext(ThemeContext)
}

function useAppData() {
  return useContext(AppDataContext)
}

function usePreferences() {
  return useContext(PreferencesContext)
}

function useNotifications() {
  return useContext(NotificationsContext)
}

function DataModal({ title, form, setForm, fields, onClose, onSave, submitLabel = 'Save' }) {
  const changeField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="data-modal-title">
        <div className="modal-header">
          <h3 id="data-modal-title">{title}</h3>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close dialog">×</button>
        </div>
        <form onSubmit={onSave} className="modal-form">
          {fields.map((field) => (
            <label key={field.name}>
              <span>{field.label}</span>
              {field.type === 'select' ? (
                <select name={field.name} value={form[field.name]} onChange={changeField} required={field.required !== false}>
                  {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              ) : field.type === 'icon' ? (
                <div className="icon-choice-grid" role="group" aria-label={field.label}>
                  {field.options.map((option) => {
                    const Icon = field.iconMap[option] ?? PackageOpen
                    return (
                      <button
                        key={option}
                        type="button"
                        className={`icon-choice ${form[field.name] === option ? 'selected' : ''}`}
                        aria-label={option}
                        aria-pressed={form[field.name] === option}
                        onClick={() => setForm((current) => ({ ...current, [field.name]: option }))}
                      >
                        <Icon size={18} />
                        <span>{option[0].toUpperCase() + option.slice(1)}</span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <input
                  name={field.name}
                  type={field.type || 'text'}
                  value={form[field.name] ?? ''}
                  onChange={changeField}
                  required={field.required !== false}
                  min={field.type === 'number' ? 0 : undefined}
                  step={field.type === 'number' ? '0.01' : undefined}
                  placeholder={field.placeholder}
                />
              )}
            </label>
          ))}
          <div className="modal-actions">
            <button type="button" className="outline-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-button">{submitLabel}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
      {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  )
}

function PublicHeader({ minimal = false }) {
  return (
    <header className="public-header">
      <Link to="/" className="brand-wrap" aria-label="Personal Budget Tracker home">
        <div className="brand-mark">PT</div>
        <span>Personal Budget Tracker</span>
      </Link>

      {!minimal && (
        <nav className="main-nav">
          <Link to="/">Home</Link>
          <a href="/#features">Features</a>
          <a href="/#about">About</a>
          <a href="/#pricing">Pricing</a>
        </nav>
      )}

      <div className="header-actions">
        <ThemeToggle />
        {!minimal && <>
          <Link className="nav-button ghost" to="/login">Login</Link>
          <Link className="nav-button primary" to="/register">Register</Link>
        </>}
      </div>
    </header>
  )
}

const settingSections = [
  { id: 'profile', label: 'Profile', icon: UserRound },
  { id: 'account', label: 'Account', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Sun },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal },
]

const notificationIcon = (type) => ({
  account: UserRound,
  budget: PiggyBank,
  expense: CreditCard,
  income: Wallet,
  savings: Target,
}[type] || BellRing)

function timeAgo(timestamp) {
  const minutes = Math.max(0, Math.floor((Date.now() - Number(timestamp)) / 60000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function NotificationList({ items, onRead }) {
  if (!items.length) return <div className="notification-empty">You're all caught up.</div>
  return (
    <div className="notification-list">
      {items.map((item) => {
        const Icon = notificationIcon(item.type)
        return (
          <button key={item.id} type="button" className={`notification-item ${item.read ? 'read' : 'unread'}`} onClick={() => onRead(item.id)}>
            <span className={`notification-item-icon ${item.type}`}><Icon size={16} /></span>
            <span className="notification-item-copy">
              <strong>{item.title}</strong>
              <span>{item.message}</span>
              <small>{timeAgo(item.createdAt)}</small>
            </span>
            {!item.read && <i className="notification-unread-dot" aria-label="Unread" />}
          </button>
        )
      })}
    </div>
  )
}

function DashboardHeader() {
  const navigate = useNavigate()
  const { data } = useAppData()
  const { notifications, markRead, markAllRead } = useNotifications()
  const { theme, setTheme } = useTheme()
  const [openMenu, setOpenMenu] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const toolsRef = useRef(null)
  const searchRef = useRef(null)
  const unreadCount = notifications.filter((item) => !item.read).length

  const searchItems = [
    ...data.income.map((item) => ({ id: `income-${item.id}`, title: item.source, detail: `${money(item.amount)}${item.note ? ` · ${item.note}` : ''}`, type: 'Income', path: '/income', terms: `${item.source} ${item.note} ${item.date} income` })),
    ...data.expenses.map((item) => ({ id: `expense-${item.id}`, title: item.description, detail: `${item.category} · ${money(item.amount)}`, type: 'Expense', path: '/expenses', terms: `${item.description} ${item.category} ${item.date} expense` })),
    ...data.categories.map((item) => ({ id: `category-${item.id}`, title: item.name, detail: `${data.expenses.filter((expense) => expense.category === item.name).length} expenses`, type: 'Category', path: '/categories', terms: `${item.name} category` })),
    ...data.budgets.map((item) => ({ id: `budget-${item.id}`, title: `${item.category} budget`, detail: money(item.budget), type: 'Budget', path: '/budgets', terms: `${item.category} budget ${item.month}` })),
    ...data.savings.map((item) => ({ id: `savings-${item.id}`, title: item.name, detail: `${money(item.current)} saved · ${money(item.target)} goal`, type: 'Savings goal', path: '/savings', terms: `${item.name} savings goal` })),
    { id: 'route-income', title: 'Income', detail: 'View all income records', type: 'Page', path: '/income', terms: 'income earnings salary' },
    { id: 'route-expenses', title: 'Expenses', detail: 'View all expense records', type: 'Page', path: '/expenses', terms: 'expenses spending' },
    { id: 'route-categories', title: 'Categories', detail: 'Manage spending categories', type: 'Page', path: '/categories', terms: 'categories' },
    { id: 'route-budgets', title: 'Budgets', detail: 'Manage monthly budgets', type: 'Page', path: '/budgets', terms: 'budgets' },
    { id: 'route-savings', title: 'Savings', detail: 'View savings goals', type: 'Page', path: '/savings', terms: 'savings goals' },
    { id: 'route-reports', title: 'Reports', detail: 'View financial reports', type: 'Page', path: '/reports', terms: 'reports' },
    { id: 'route-profile', title: data.user.fullName, detail: 'Profile and account settings', type: 'Profile', path: '/settings/profile', terms: `${data.user.fullName} ${data.user.email} profile settings` },
  ]
  const matchingSearchItems = searchQuery.trim()
    ? searchItems.filter((item) => `${item.title} ${item.detail} ${item.terms}`.toLowerCase().includes(searchQuery.trim().toLowerCase())).slice(0, 8)
    : []

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (toolsRef.current && !toolsRef.current.contains(event.target)) setOpenMenu(null)
      if (searchRef.current && !searchRef.current.contains(event.target)) setSearchFocused(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [])

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    navigate('/login')
  }

  return (
    <header className="dashboard-header">
      <div className="dashboard-search" ref={searchRef}>
        <Search size={14} />
        <input
          type="search"
          aria-label="Search tracker"
          placeholder="Search income, expenses, categories..."
          value={searchQuery}
          onFocus={() => setSearchFocused(true)}
          onChange={(event) => { setSearchQuery(event.target.value); setSearchFocused(true) }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setSearchFocused(false)
            if (event.key === 'Enter' && matchingSearchItems[0]) {
              navigate(matchingSearchItems[0].path)
              setSearchQuery('')
              setSearchFocused(false)
            }
          }}
        />
        {searchFocused && searchQuery.trim() && (
          <div className="search-results" role="listbox" aria-label="Search results">
            {matchingSearchItems.length ? matchingSearchItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className="search-result-item"
                role="option"
                onClick={() => { setSearchQuery(''); setSearchFocused(false) }}
              >
                <span className="search-result-icon"><Search size={14} /></span>
                <span className="search-result-copy"><strong>{item.title}</strong><small>{item.detail}</small></span>
                <span className="search-result-type">{item.type}</span>
              </Link>
            )) : <div className="search-no-results">No matching records found.</div>}
          </div>
        )}
      </div>

      <div className="header-tools" ref={toolsRef}>
        <div className="header-menu-anchor">
          <button type="button" className="icon-button" aria-label="Settings" aria-expanded={openMenu === 'settings'} onClick={() => setOpenMenu((menu) => menu === 'settings' ? null : 'settings')}>
            <Settings size={16} />
          </button>
          {openMenu === 'settings' && (
            <div className="header-popover settings-popover">
              <div className="popover-heading"><div><strong>Settings</strong><span>Manage your account</span></div></div>
              <div className="settings-menu-links">
                {settingSections.map(({ id, label, icon: Icon }) => (
                  <Link key={id} to={`/settings/${id}`} onClick={() => setOpenMenu(null)}>
                    <Icon size={16} /><span>{label}</span><ChevronRight size={14} />
                  </Link>
                ))}
              </div>
              <div className="popover-appearance">
                <span>Quick appearance</span>
                <div className="quick-theme-options" role="group" aria-label="Quick appearance">
                  {[
                    { value: 'light', label: 'Light', icon: Sun },
                    { value: 'dark', label: 'Dark', icon: Moon },
                    { value: 'system', label: 'System', icon: Monitor },
                  ].map(({ value, label, icon: Icon }) => (
                    <button key={value} type="button" aria-label={`${label} theme`} aria-pressed={theme === value} className={theme === value ? 'selected' : ''} onClick={() => setTheme(value)}>
                      <Icon size={13} />{label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="header-menu-anchor">
          <button type="button" className="icon-button notification-trigger" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} aria-expanded={openMenu === 'notifications'} onClick={() => setOpenMenu((menu) => menu === 'notifications' ? null : 'notifications')}>
            <Bell size={16} />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>
          {openMenu === 'notifications' && (
            <div className="header-popover notifications-popover">
              <div className="popover-heading">
                <div><strong>Notifications</strong><span>{unreadCount ? `${unreadCount} unread` : "You're all caught up"}</span></div>
                <button type="button" className="popover-text-button" onClick={markAllRead} disabled={!unreadCount}>Mark all read</button>
              </div>
              <NotificationList items={notifications.slice(0, 5)} onRead={markRead} />
              <Link className="popover-footer-link" to="/notifications" onClick={() => setOpenMenu(null)}>View all notifications <ChevronRight size={14} /></Link>
            </div>
          )}
        </div>
        <ThemeToggle />
        <div className="profile-mini">
          <div className="avatar">{initials(data.user.fullName)}</div>
          <div>
            <strong>{data.user.fullName}</strong>
            <small>Premium</small>
          </div>
        </div>
        <button type="button" className="logout-button" onClick={logout}>
          <LogOut size={14} />
        </button>
      </div>
    </header>
  )
}

function AppLayout({ children }) {
  const navigate = useNavigate()
  const location = window.location.pathname

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-wrap sidebar-brand">
          <div className="brand-mark">PT</div>
          <span>Personal Budget Tracker</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={label}
              to={path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={(event) => {
                if (location === path) event.preventDefault()
              }}
            >
              <Icon size={15} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button type="button" className="logout-nav" onClick={() => { localStorage.removeItem(AUTH_STORAGE_KEY); navigate('/login') }}>
          <LogOut size={14} />
          Logout
        </button>
      </aside>

      <div className="content-panel">
        <DashboardHeader />
        {children}
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const isLoggedIn = Boolean(localStorage.getItem(AUTH_STORAGE_KEY))

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  return children
}

function AuthPage({ mode }) {
  const navigate = useNavigate()
  const { setData } = useAppData()
  const { addNotification } = useNotifications()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agree: false,
  })

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  const onSubmit = (event) => {
    event.preventDefault()
    setError('')
    const email = form.email.trim().toLowerCase()
    if (isRegister && form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (isRegister && !form.agree) {
      setError('Please agree to the Terms & Conditions to continue.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    setSubmitting(true)
    Promise.resolve().then(async () => {
      const passwordHash = await hashPassword(form.password)
      if (isRegister) {
        if (!form.fullName.trim()) {
          setError('Enter your full name.')
          return
        }
        const currentAccount = localStorage.getItem(AUTH_ACCOUNT_KEY)
        if (currentAccount) {
          const account = JSON.parse(currentAccount)
          if (account.email === email) {
            setError('An account with this email already exists. Please log in.')
            return
          }
        }
        localStorage.setItem(AUTH_ACCOUNT_KEY, JSON.stringify({ email, passwordHash }))
        const user = {
          ...defaultUser,
          fullName: form.fullName.trim(),
          email,
          memberSince: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        }
        setData((current) => ({ ...current, user }))
        addNotification('account', 'Your account is ready', 'Welcome to your personal budget tracker.')
      } else {
        const storedAccount = localStorage.getItem(AUTH_ACCOUNT_KEY)
        if (!storedAccount) {
          setError('No local account exists yet. Register to create one.')
          return
        }
        const account = JSON.parse(storedAccount)
        if (account.email !== email || account.passwordHash !== passwordHash) {
          setError('Email or password is incorrect.')
          return
        }
        addNotification('account', 'Welcome back', 'You have successfully signed in.')
      }
      localStorage.setItem(AUTH_STORAGE_KEY, email)
      navigate('/dashboard')
    }).catch(() => {
      setError('Unable to complete sign in. Please try again.')
    }).finally(() => setSubmitting(false))
  }

  const isRegister = mode === 'register'

  return (
    <div className="auth-shell">
      <PublicHeader minimal />

      <main className="auth-main">
        <div className="auth-illustration">
          <div className="safe-figure">
            <div className="safe-box">
              <div className="safe-top" />
              <div className="safe-door" />
              <div className="safe-ring" />
            </div>
            <div className="plant plant-left"> </div>
            <div className="plant plant-right"> </div>
            <div className="coin coin-one">$</div>
            <div className="coin coin-two">$</div>
            <div className="coin coin-three">$</div>
            <div className="figure">
              <div className="figure-head" />
              <div className="figure-body" />
            </div>
          </div>
        </div>

        <form className="auth-card" onSubmit={onSubmit}>
          <h1>{isRegister ? 'Create Account' : 'Welcome Back'}</h1>
          <p>{isRegister ? 'Register a new account' : 'Login to your account'}</p>

          {isRegister && (
            <label>
              <span>Full Name</span>
              <input name="fullName" placeholder="Your full name" value={form.fullName} onChange={handleChange} required />
            </label>
          )}

          <label>
            <span>Email</span>
            <input type="email" name="email" placeholder="Enter your email" value={form.email} onChange={handleChange} required />
          </label>

          <label>
            <span>Password</span>
            <input type="password" name="password" placeholder="Enter your password" value={form.password} onChange={handleChange} minLength={8} required />
          </label>

          {isRegister && (
            <label>
              <span>Confirm Password</span>
              <input type="password" name="confirmPassword" placeholder="Confirm your password" value={form.confirmPassword} onChange={handleChange} minLength={8} required />
            </label>
          )}

          {!isRegister && <a href="/login" className="muted-link">Forgot password?</a>}

          {isRegister && (
            <label className="checkbox-row">
              <input type="checkbox" name="agree" checked={form.agree} onChange={handleChange} />
              <span>I agree to the Terms &amp; Conditions</span>
            </label>
          )}

          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="primary-button large-button" disabled={submitting}>
            {submitting ? 'Please wait…' : isRegister ? 'Register' : 'Login'}
          </button>

          <div className="auth-switch">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Login' : 'Register'}</Link>
          </div>
        </form>
      </main>
    </div>
  )
}

function SummaryCard({ title, value, helper, trend, positive = true }) {
  return (
    <div className="summary-card">
      <div className="card-header-row">
        <span>{title}</span>
        <span className={`tag ${positive ? 'positive' : 'negative'}`}>
          {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trend}
        </span>
      </div>
      <div className="summary-value">{value}</div>
      <div className="summary-helper">{helper}</div>
    </div>
  )
}

function DashboardPage() {
  const { data } = useAppData()

  const totalIncome = data.income.reduce((sum, item) => sum + item.amount, 0)
  const totalExpenses = data.expenses.reduce((sum, item) => sum + item.amount, 0)
  const totalBalance = totalIncome - totalExpenses
  const monthlySavings = data.savings.reduce((sum, goal) => sum + Number(goal.current), 0)
  const monthlyTotals = getMonthlyTotals(data.income, data.expenses)
  const latestMonth = monthlyTotals.at(-1)
  const previousMonth = monthlyTotals.at(-2)
  const expenseBreakdown = getExpenseBreakdown(data.expenses)
  const recentTransactions = [
    ...data.income.map((item) => ({ ...item, type: 'Income', description: item.source, category: 'Income', positive: true })),
    ...data.expenses.map((item) => ({ ...item, type: 'Expense', positive: false })),
  ].sort((left, right) => new Date(right.date) - new Date(left.date)).slice(0, 4)

  return (
    <AppLayout>
      <main className="dashboard-content">
        <section className="summary-grid">
          <SummaryCard title="Total Income" value={compactMoney(totalIncome)} helper="Compared to last month" trend={percentageChange(latestMonth.income, previousMonth.income)} positive />
          <SummaryCard title="Total Expenses" value={compactMoney(totalExpenses)} helper="This month" trend={percentageChange(latestMonth.expenses, previousMonth.expenses)} positive={latestMonth.expenses <= previousMonth.expenses} />
          <SummaryCard title="Total Balance" value={compactMoney(totalBalance)} helper="Available funds" trend={totalBalance >= 0 ? 'On track' : 'Over budget'} positive={totalBalance >= 0} />
          <SummaryCard title="Monthly Savings" value={compactMoney(monthlySavings)} helper="Saved toward your goals" trend={`${data.savings.length} goals`} positive />
        </section>

        <section className="dashboard-grid">
          <div className="panel large-panel">
            <div className="panel-header">
              <h3>Income vs Expenses</h3>
              <button type="button" className="outline-button">View Report</button>
            </div>
            <div className="chart-card">
              <div className="bars-chart">
                {monthlyTotals.map((month) => {
                  const ceiling = Math.max(...monthlyTotals.map((item) => Math.max(item.income, item.expenses)), 1)
                  return (
                  <div key={month.label + month.date.toISOString()} className="bar-column" title={`${month.label}: income ${money(month.income)}, expenses ${money(month.expenses)}`}>
                    <span className="bar blue" style={{ height: `${Math.max(3, month.income / ceiling * 100)}%` }} />
                    <span className="bar purple" style={{ height: `${Math.max(3, month.expenses / ceiling * 100)}%` }} />
                    <small className="bar-label">{month.label}</small>
                  </div>
                )})}
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>Expenses by Category</h3>
              <button type="button" className="mini-button">See All</button>
            </div>
            <div className="donut-wrap">
              <div className="donut-chart" style={{ background: donutGradient(expenseBreakdown) }}>
                <div className="donut-center">
                  <strong>{Math.round(expenseBreakdown[0]?.percent ?? 0)}%</strong>
                </div>
              </div>
              <ul className="legend-list">
                {expenseBreakdown.slice(0, 4).map((item, index) => (
                  <li key={item.category}><span className="dot" style={{ background: expenseColors[index % expenseColors.length] }} /> {item.category}</li>
                ))}
                {expenseBreakdown.length === 0 && <li>No expense data yet</li>}
              </ul>
            </div>
          </div>
        </section>

        <section className="bottom-grid">
          <div className="panel">
            <div className="panel-header">
              <h3>Recent Transactions</h3>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((item) => (
                  <tr key={`${item.type}-${item.id}`}>
                    <td>{item.description}</td>
                    <td>{formatDate(item.date)}</td>
                    <td>{item.category}</td>
                    <td className={`amount ${item.positive ? 'positive' : 'negative'}`}>{item.positive ? '+' : '-'}{money(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>Budgets Overview</h3>
            </div>
            <div className="budget-stack">
              {data.budgets.map((budget) => {
                const spent = data.expenses.filter((item) => item.category === budget.category).reduce((sum, item) => sum + Number(item.amount), 0)
                const progress = budget.budget > 0 ? Math.min(100, (spent / budget.budget) * 100) : 0
                return (
                  <div key={budget.id} className="budget-row">
                    <div className="budget-meta">
                      <span>{budget.category}</span>
                      <strong>{money(spent)}</strong>
                    </div>
                    <div className="progress-bar"><span style={{ width: `${progress}%` }} /></div>
                    <div className="small-row">
                      <span>{Math.round(progress)}%</span>
                      <span>{money(budget.budget)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </main>
    </AppLayout>
  )
}

function IncomePage() {
  const { data, setData } = useAppData()
  const { addNotification } = useNotifications()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ date: todayInputDate(), source: '', amount: '', note: '' })

  const total = data.income.reduce((sum, entry) => sum + entry.amount, 0)

  const openForm = (entry = null) => {
    setEditing(entry)
    setForm(entry ? { ...entry, date: toInputDate(entry.date) } : { date: todayInputDate(), source: '', amount: '', note: '' })
    setOpen(true)
  }

  const saveIncome = (event) => {
    event.preventDefault()
    const record = { ...form, amount: Number(form.amount) }
    setData((current) => ({
      ...current,
      income: editing
        ? current.income.map((entry) => entry.id === editing.id ? { ...record, id: editing.id } : entry)
        : [{ id: Date.now(), ...record }, ...current.income],
    }))
    addNotification('income', editing ? 'Income updated' : 'Income added', `${record.source} income of ${money(record.amount)} was ${editing ? 'updated' : 'added'}.`)
    setOpen(false)
    setEditing(null)
  }

  const removeIncome = (id) => {
    setData((current) => ({ ...current, income: current.income.filter((entry) => entry.id !== id) }))
    const entry = data.income.find((item) => item.id === id)
    if (entry) addNotification('income', 'Income removed', `${entry.source} income of ${money(entry.amount)} was removed.`)
  }

  return (
    <AppLayout>
      <main className="page-panel">
        <div className="page-header-row">
          <h2>Income</h2>
          <button type="button" className="primary-button" onClick={() => openForm()}>
            <Plus size={14} /> Add Income
          </button>
        </div>

        <div className="table-card">
          <table className="data-table wide-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Source</th>
                <th>Amount</th>
                <th>Note</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.income.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatDate(entry.date)}</td>
                  <td>{entry.source}</td>
                  <td className="amount positive">{money(entry.amount)}</td>
                  <td>{entry.note}</td>
                  <td>
                    <div className="table-actions">
                      <button type="button" className="action-button" onClick={() => openForm(entry)} aria-label={`Edit ${entry.source}`}><Edit3 size={14} /></button>
                      <button type="button" className="action-button danger" onClick={() => removeIncome(entry.id)} aria-label="Delete income"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {data.income.length === 0 && <tr><td colSpan="5" className="empty-row">No income records yet. Add your first income to get started.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="page-footer">
          <span>Total Income</span>
          <strong className="amount positive">{money(total)}</strong>
        </div>
      </main>

      {open && <DataModal
        title={editing ? 'Edit Income' : 'Add Income'}
        form={form}
        setForm={setForm}
        fields={[
          { name: 'date', label: 'Date', type: 'date' },
          { name: 'source', label: 'Source' },
          { name: 'amount', label: 'Amount', type: 'number' },
          { name: 'note', label: 'Note', required: false },
        ]}
        onClose={() => setOpen(false)}
        onSave={saveIncome}
        submitLabel={editing ? 'Update Income' : 'Save Income'}
      />}
    </AppLayout>
  )
}

function ExpensesPage() {
  const { data, setData } = useAppData()
  const { addNotification } = useNotifications()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ date: todayInputDate(), description: '', category: data.categories[0]?.name ?? 'Others', amount: '' })

  const total = data.expenses.reduce((sum, item) => sum + item.amount, 0)

  const openForm = (item = null) => {
    setEditing(item)
    setForm(item ? { ...item, date: toInputDate(item.date) } : { date: todayInputDate(), description: '', category: data.categories[0]?.name ?? 'Others', amount: '' })
    setOpen(true)
  }

  const saveExpense = (event) => {
    event.preventDefault()
    const record = { ...form, amount: Number(form.amount) }
    const updatedExpenses = editing
      ? data.expenses.map((item) => item.id === editing.id ? { ...record, id: editing.id } : item)
      : [{ id: Date.now(), ...record }, ...data.expenses]
    setData((current) => ({
      ...current,
      expenses: editing
        ? current.expenses.map((item) => item.id === editing.id ? { ...record, id: editing.id } : item)
        : [{ id: Date.now(), ...record }, ...current.expenses],
    }))
    addNotification('expense', editing ? 'Expense updated' : 'Expense added', `${record.description} expense of ${money(record.amount)} was ${editing ? 'updated' : 'added'}.`)
    data.budgets
      .filter((budget) => !budget.month || belongsToMonth(form.date, budget.month))
      .filter((budget) => budget.category === record.category)
      .forEach((budget) => {
        const spent = updatedExpenses
          .filter((item) => item.category === budget.category && (!budget.month || belongsToMonth(item.date, budget.month)))
          .reduce((sum, item) => sum + Number(item.amount), 0)
        const progress = budget.budget > 0 ? spent / budget.budget : 0
        if (progress >= 0.8) addNotification('budget', 'Budget limit is almost reached', `${budget.category} is ${Math.round(progress * 100)}% used.`)
      })
    setOpen(false)
    setEditing(null)
  }

  const removeExpense = (id) => {
    setData((current) => ({ ...current, expenses: current.expenses.filter((item) => item.id !== id) }))
    const item = data.expenses.find((expense) => expense.id === id)
    if (item) addNotification('expense', 'Expense removed', `${item.description} expense of ${money(item.amount)} was removed.`)
  }

  return (
    <AppLayout>
      <main className="page-panel">
        <div className="page-header-row">
          <h2>Expenses</h2>
          <button type="button" className="primary-button" onClick={() => openForm()}>
            <Plus size={14} /> Add Expense
          </button>
        </div>

        <div className="table-card">
          <table className="data-table wide-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.expenses.map((item) => (
                <tr key={item.id}>
                  <td>{formatDate(item.date)}</td>
                  <td>{item.description}</td>
                  <td>{item.category}</td>
                  <td className="amount negative">-{money(item.amount)}</td>
                  <td>
                    <div className="table-actions">
                      <button type="button" className="action-button" onClick={() => openForm(item)} aria-label={`Edit ${item.description}`}><Edit3 size={14} /></button>
                      <button type="button" className="action-button danger" onClick={() => removeExpense(item.id)} aria-label="Delete expense"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {data.expenses.length === 0 && <tr><td colSpan="5" className="empty-row">No expenses recorded yet. Add your first expense to get started.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="page-footer">
          <span>Total Expenses</span>
          <strong className="amount negative">-{money(total)}</strong>
        </div>
      </main>

      {open && <DataModal
        title={editing ? 'Edit Expense' : 'Add Expense'}
        form={form}
        setForm={setForm}
        fields={[
          { name: 'date', label: 'Date', type: 'date' },
          { name: 'description', label: 'Description' },
          { name: 'category', label: 'Category', type: 'select', options: data.categories.length ? data.categories.map((category) => category.name) : ['Others'] },
          { name: 'amount', label: 'Amount', type: 'number' },
        ]}
        onClose={() => setOpen(false)}
        onSave={saveExpense}
        submitLabel={editing ? 'Update Expense' : 'Save Expense'}
      />}
    </AppLayout>
  )
}

function CategoriesPage() {
  const { data, setData } = useAppData()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', icon: 'food' })

  const addCategory = (event) => {
    event.preventDefault()
    const category = { id: editing?.id ?? Date.now(), name: form.name.trim(), icon: form.icon, count: 0 }
    setData((current) => ({
      ...current,
      categories: editing
        ? current.categories.map((item) => item.id === editing.id ? { ...item, ...category } : item)
        : [...current.categories, category],
      expenses: editing
        ? current.expenses.map((expense) => expense.category === editing.name ? { ...expense, category: category.name } : expense)
        : current.expenses,
      budgets: editing
        ? current.budgets.map((budget) => budget.category === editing.name ? { ...budget, category: category.name } : budget)
        : current.budgets,
    }))
    setOpen(false)
    setEditing(null)
  }

  const openForm = (category = null) => {
    setEditing(category)
    setForm(category ? { name: category.name, icon: category.icon } : { name: '', icon: 'food' })
    setOpen(true)
  }

  const removeCategory = (id) => {
    setData((current) => ({ ...current, categories: current.categories.filter((category) => category.id !== id) }))
  }

  return (
    <AppLayout>
      <main className="page-panel">
        <div className="page-header-row">
          <h2>Categories</h2>
          <button type="button" className="primary-button" onClick={() => openForm()}>
            <Plus size={14} /> Add Category
          </button>
        </div>

        <div className="category-grid">
          {data.categories.map((category) => (
            <div key={category.id} className="category-card">
              <div className="category-topline">
                <span className="category-icon">
                  {(() => {
                    const Icon = categoryIcons[category.icon] ?? PackageOpen
                    return <Icon size={19} />
                  })()}
                </span>
                <button type="button" className="action-dots" aria-label={`Edit or delete ${category.name}`} onClick={() => openForm(category)}><MoreHorizontal size={18} /></button>
              </div>
              <h4>{category.name}</h4>
              <div className="category-meta">{data.expenses.filter((item) => item.category === category.name).length} expenses</div>
              <div className="category-actions">
                <button type="button" className="action-button" onClick={() => openForm(category)} aria-label={`Edit ${category.name}`}><Edit3 size={14} /></button>
                <button type="button" className="action-button danger" onClick={() => removeCategory(category.id)} aria-label="Delete category"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {open && <DataModal
        title={editing ? 'Edit Category' : 'Add Category'}
        form={form}
        setForm={setForm}
        fields={[
          { name: 'name', label: 'Category name' },
          { name: 'icon', label: 'Category icon', type: 'icon', options: Object.keys(categoryIcons), iconMap: categoryIcons },
        ]}
        onClose={() => setOpen(false)}
        onSave={addCategory}
        submitLabel={editing ? 'Update Category' : 'Save Category'}
      />}
    </AppLayout>
  )
}

function BudgetsPage() {
  const { data, setData } = useAppData()
  const { addNotification } = useNotifications()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [month, setMonth] = useState('2024-05')
  const [form, setForm] = useState({ category: data.categories[0]?.name ?? 'Food', budget: '' })

  const addBudget = (event) => {
    event.preventDefault()
    const record = { id: editing?.id ?? Date.now(), category: form.category, budget: Number(form.budget), month }
    setData((current) => ({
      ...current,
      budgets: editing
        ? current.budgets.map((item) => item.id === editing.id ? record : item)
        : [...current.budgets, record],
    }))
    const spent = data.expenses.filter((item) => item.category === form.category && (!month || belongsToMonth(item.date, month))).reduce((sum, item) => sum + Number(item.amount), 0)
    const progress = Number(form.budget) > 0 ? spent / Number(form.budget) : 0
    if (progress >= 0.8) addNotification('budget', 'Budget limit is almost reached', `${form.category} is already ${Math.round(progress * 100)}% used.`)
    addNotification('budget', editing ? 'Budget updated' : 'Budget added', `${form.category} budget of ${money(form.budget)} was ${editing ? 'updated' : 'added'}.`)
    setOpen(false)
    setEditing(null)
  }

  const openForm = (budget = null) => {
    setEditing(budget)
    setForm(budget ? { category: budget.category, budget: budget.budget } : { category: data.categories[0]?.name ?? 'Food', budget: '' })
    setOpen(true)
  }

  const removeBudget = (id) => {
    setData((current) => ({ ...current, budgets: current.budgets.filter((item) => item.id !== id) }))
    const budget = data.budgets.find((item) => item.id === id)
    if (budget) addNotification('budget', 'Budget removed', `${budget.category} budget of ${money(budget.budget)} was removed.`)
  }
  const visibleBudgets = data.budgets.filter((budget) => !budget.month || budget.month === month)

  return (
    <AppLayout>
      <main className="page-panel">
        <div className="page-header-row">
          <h2>Budgets</h2>
          <div className="page-actions compact">
            <label className="month-control"><CalendarDays size={14} /><input aria-label="Budget month" type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></label>
            <button type="button" className="primary-button" onClick={() => openForm()}><Plus size={14} /> Add Budget</button>
          </div>
        </div>

        <div className="table-card">
          <table className="data-table wide-table budgets-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Budget</th>
                <th>Spent</th>
                <th>Left</th>
                <th>Progress</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleBudgets.map((budget) => {
                const spent = data.expenses
                  .filter((expense) => expense.category === budget.category && belongsToMonth(expense.date, budget.month ?? month))
                  .reduce((sum, expense) => sum + Number(expense.amount), 0)
                const left = Number(budget.budget) - spent
                const progress = budget.budget > 0 ? Math.min(100, (spent / budget.budget) * 100) : 0
                return (
                  <tr key={budget.id}>
                    <td>{budget.category}</td>
                    <td>{money(budget.budget)}</td>
                    <td>{money(spent)}</td>
                    <td className={left >= 0 ? 'amount positive' : 'amount negative'}>{money(left)}</td>
                    <td>
                      <div className="progress-column">
                        <div className={`progress-bar ${progress >= 90 ? 'at-limit' : ''}`}><span style={{ width: `${progress}%` }} /></div>
                        <small>{Math.round(progress)}%</small>
                      </div>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="action-button" onClick={() => openForm(budget)} aria-label={`Edit ${budget.category} budget`}><Edit3 size={14} /></button>
                        <button type="button" className="action-button danger" onClick={() => removeBudget(budget.id)} aria-label={`Delete ${budget.category} budget`}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {visibleBudgets.length === 0 && <tr><td colSpan="6" className="empty-row">No budgets for this month. Add a budget to get started.</td></tr>}
            </tbody>
          </table>
        </div>
      </main>

      {open && <DataModal
        title={editing ? 'Edit Budget' : 'Add Budget'}
        form={form}
        setForm={setForm}
        fields={[
          { name: 'category', label: 'Category', type: 'select', options: data.categories.length ? data.categories.map((category) => category.name) : ['Others'] },
          { name: 'budget', label: 'Budget amount', type: 'number' },
        ]}
        onClose={() => setOpen(false)}
        onSave={addBudget}
        submitLabel={editing ? 'Update Budget' : 'Save Budget'}
      />}
    </AppLayout>
  )
}

function SavingsPage() {
  const { data, setData } = useAppData()
  const { addNotification } = useNotifications()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', current: '0', target: '', date: todayInputDate(), icon: 'laptop' })

  const addGoal = (event) => {
    event.preventDefault()
    const record = { ...form, current: Number(form.current), target: Number(form.target), id: editing?.id ?? Date.now() }
    setData((current) => ({
      ...current,
      savings: editing
        ? current.savings.map((goal) => goal.id === editing.id ? record : goal)
        : [record, ...current.savings],
    }))
    addNotification('savings', editing ? 'Savings goal updated' : 'Savings goal added', `Your ${record.name} savings goal was ${editing ? 'updated' : 'added'}.`)
    setOpen(false)
    setEditing(null)
  }

  const openForm = (goal = null) => {
    setEditing(goal)
    setForm(goal
      ? { ...goal, date: toInputDate(goal.date) }
      : { name: '', current: '0', target: '', date: todayInputDate(), icon: 'laptop' })
    setOpen(true)
  }

  const removeGoal = (id) => {
    setData((current) => ({ ...current, savings: current.savings.filter((goal) => goal.id !== id) }))
    const goal = data.savings.find((item) => item.id === id)
    if (goal) addNotification('savings', 'Savings goal removed', `Your ${goal.name} savings goal was removed.`)
  }

  return (
    <AppLayout>
      <main className="page-panel">
        <div className="page-header-row">
          <h2>Savings Goals</h2>
          <button type="button" className="primary-button" onClick={() => openForm()}>
            <Plus size={14} /> Add Goal
          </button>
        </div>

        <div className="savings-grid">
          {data.savings.map((goal) => {
            const percentage = goal.target > 0 ? Math.min(100, (goal.current / goal.target) * 100) : 0
            const GoalIcon = goalIcons[goal.icon] ?? Target
            return (
              <div key={goal.id} className="savings-card">
                <div className="goal-topline">
                  <div className="goal-icon"><GoalIcon size={19} /></div>
                  <div className="goal-text">
                    <h4>{goal.name}</h4>
                    <span>Target: {formatDate(goal.date)}</span>
                  </div>
                  <button type="button" className="action-button" onClick={() => openForm(goal)} aria-label={`Edit ${goal.name}`}><Edit3 size={14} /></button>
                  <button type="button" className="action-button danger" onClick={() => removeGoal(goal.id)} aria-label="Delete goal">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="money-row">
                  <span>{money(goal.current)}</span>
                  <span>{money(goal.target)}</span>
                </div>
                <div className="progress-bar"><span style={{ width: `${percentage}%` }} /></div>
                <div className="goal-summary">
                  <strong>{Math.round(percentage)}%</strong>
                  <small>{money(goal.target - goal.current)} left</small>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {open && <DataModal
        title={editing ? 'Edit Savings Goal' : 'Add Savings Goal'}
        form={form}
        setForm={setForm}
        fields={[
          { name: 'name', label: 'Goal name' },
          { name: 'current', label: 'Current savings', type: 'number' },
          { name: 'target', label: 'Target amount', type: 'number' },
          { name: 'date', label: 'Target date', type: 'date' },
          { name: 'icon', label: 'Goal icon', type: 'icon', options: Object.keys(goalIcons), iconMap: goalIcons },
        ]}
        onClose={() => setOpen(false)}
        onSave={addGoal}
        submitLabel={editing ? 'Update Goal' : 'Save Goal'}
      />}
    </AppLayout>
  )
}

function ReportsPage() {
  const { data } = useAppData()
  const [period, setPeriod] = useState('Monthly')
  const [month, setMonth] = useState('2024-05')

  const inMonth = (date) => {
    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) return false
    if (period === 'Yearly') return String(parsed.getFullYear()) === month.slice(0, 4)
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}` === month
  }
  const incomes = data.income.filter((entry) => inMonth(entry.date))
  const expenses = data.expenses.filter((item) => inMonth(item.date))
  const totalIncome = incomes.reduce((sum, entry) => sum + Number(entry.amount), 0)
  const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount), 0)
  const totalSavings = data.savings.reduce((sum, goal) => sum + goal.current, 0)
  const netBalance = totalIncome - totalExpenses
  const monthlyTotals = getMonthlyTotals(data.income, data.expenses)
  const expenseBreakdown = getExpenseBreakdown(expenses)
  const activeMonths = monthlyTotals.filter((item) => item.income || item.expenses)
  const averageIncome = activeMonths.length ? activeMonths.reduce((sum, item) => sum + item.income, 0) / activeMonths.length : 0
  const averageExpenses = activeMonths.length ? activeMonths.reduce((sum, item) => sum + item.expenses, 0) / activeMonths.length : 0
  const sortedExpenses = [...expenses].sort((left, right) => right.amount - left.amount)

  const exportReport = () => {
    const rows = [
      ['Type', 'Date', 'Description', 'Category', 'Amount'],
      ...incomes.map((item) => ['Income', item.date, item.source, '', item.amount]),
      ...expenses.map((item) => ['Expense', item.date, item.description, item.category, item.amount]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `budget-report-${month}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AppLayout>
      <main className="page-panel">
        <div className="page-header-row">
          <h2>Reports</h2>
          <div className="page-actions compact">
            <select className="report-period" aria-label="Report period" value={period} onChange={(event) => setPeriod(event.target.value)}>
              <option>Monthly</option><option>Yearly</option>
            </select>
            <label className="month-control"><CalendarDays size={14} /><input aria-label="Report month" type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></label>
            <button type="button" className="primary-button" onClick={exportReport}><Download size={14} /> Export</button>
          </div>
        </div>

        <section className="summary-grid compact-grid">
          <SummaryCard title="Total Income" value={money(totalIncome)} helper="Selected period" trend={`${incomes.length} records`} positive />
          <SummaryCard title="Total Expenses" value={money(totalExpenses)} helper="Selected period" trend={`${expenses.length} records`} positive={netBalance >= 0} />
          <SummaryCard title="Total Savings" value={money(totalSavings)} helper="Saved toward goals" trend={`${data.savings.length} goals`} positive />
          <SummaryCard title="Net Balance" value={money(netBalance)} helper="Income less expenses" trend={netBalance >= 0 ? 'Positive' : 'Negative'} positive={netBalance >= 0} />
        </section>

        <section className="dashboard-grid">
          <div className="panel large-panel">
            <div className="panel-header">
              <h3>Income vs Expenses</h3>
            </div>
            <div className="chart-card">
              <div className="bars-chart mini-bars">
                {monthlyTotals.map((entry) => {
                  const ceiling = Math.max(...monthlyTotals.map((item) => Math.max(item.income, item.expenses)), 1)
                  return (
                  <div key={entry.label + entry.date.toISOString()} className="bar-column">
                    <span className="bar blue" style={{ height: `${Math.max(3, entry.income / ceiling * 100)}%` }} />
                    <span className="bar purple" style={{ height: `${Math.max(3, entry.expenses / ceiling * 100)}%` }} />
                    <small className="bar-label">{entry.label}</small>
                  </div>
                  )
                })}
              </div>
              <div className="chart-legend"><span><i className="dot dot-blue" /> Income</span><span><i className="dot dot-purple" /> Expenses</span></div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>Expenses by Category</h3>
            </div>
            <div className="donut-wrap">
              <div className="donut-chart small-donut" style={{ background: donutGradient(expenseBreakdown) }}>
                <div className="donut-center">
                  <strong>{Math.round(expenseBreakdown[0]?.percent ?? 0)}%</strong>
                </div>
              </div>
              <ul className="legend-list">
                {expenseBreakdown.slice(0, 4).map((item, index) => (
                  <li key={item.category}><span className="dot" style={{ background: expenseColors[index % expenseColors.length] }} /> {item.category}</li>
                ))}
                {expenseBreakdown.length === 0 && <li>No expense data yet</li>}
              </ul>
            </div>
          </div>
        </section>
        <section className="report-summary panel">
          <div className="panel-header"><h3>Summary</h3></div>
          <div className="report-metrics">
            <div><span>Average Monthly Income</span><strong>{money(averageIncome)}</strong></div>
            <div><span>Average Monthly Expenses</span><strong>{money(averageExpenses)}</strong></div>
            <div><span>Highest Expense</span><strong>{sortedExpenses.length ? money(sortedExpenses[0].amount) : money(0)}</strong><small>{sortedExpenses[0]?.description ?? 'No expenses'}</small></div>
            <div><span>Lowest Expense</span><strong>{sortedExpenses.length ? money(sortedExpenses.at(-1).amount) : money(0)}</strong><small>{sortedExpenses.at(-1)?.description ?? 'No expenses'}</small></div>
          </div>
        </section>
      </main>
    </AppLayout>
  )
}

function ToggleSetting({ title, description, checked, onChange }) {
  return (
    <label className="setting-toggle-row">
      <span><strong>{title}</strong><small>{description}</small></span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  )
}

function PasswordChangeForm() {
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' })
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const changePassword = async (event) => {
    event.preventDefault()
    setPasswordMessage('')
    setPasswordError('')
    if (passwordForm.next.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordError('New passwords do not match.')
      return
    }
    try {
      const storedAccount = localStorage.getItem(AUTH_ACCOUNT_KEY)
      if (!storedAccount) {
        setPasswordError('Password changes require a locally registered account.')
        return
      }
      const account = JSON.parse(storedAccount)
      if (account.passwordHash !== await hashPassword(passwordForm.current)) {
        setPasswordError('Current password is incorrect.')
        return
      }
      localStorage.setItem(AUTH_ACCOUNT_KEY, JSON.stringify({ ...account, passwordHash: await hashPassword(passwordForm.next) }))
      setPasswordForm({ current: '', next: '', confirm: '' })
      setPasswordMessage('Password updated.')
    } catch {
      setPasswordError('Unable to update your password. Please try again.')
    }
  }

  return (
    <form className="modal-form" onSubmit={changePassword}>
      <label>
        <span>Current Password</span>
        <input type="password" autoComplete="current-password" value={passwordForm.current} onChange={(event) => setPasswordForm((current) => ({ ...current, current: event.target.value }))} required />
      </label>
      <label>
        <span>New Password</span>
        <input type="password" autoComplete="new-password" value={passwordForm.next} onChange={(event) => setPasswordForm((current) => ({ ...current, next: event.target.value }))} minLength={8} required />
      </label>
      <label>
        <span>Confirm New Password</span>
        <input type="password" autoComplete="new-password" value={passwordForm.confirm} onChange={(event) => setPasswordForm((current) => ({ ...current, confirm: event.target.value }))} minLength={8} required />
      </label>
      <button type="submit" className="primary-button">Update Password</button>
      {passwordError && <p className="form-error" role="alert">{passwordError}</p>}
      {passwordMessage && <p className="form-success" role="status">{passwordMessage}</p>}
    </form>
  )
}

function SettingsPage() {
  const { section = 'profile' } = useParams()
  const navigate = useNavigate()
  const { data, setData } = useAppData()
  const { theme, setTheme } = useTheme()
  const { preferences, setPreferences } = usePreferences()
  const validSection = settingSections.some((item) => item.id === section)
  const [editing, setEditing] = useState(false)
  const [profileForm, setProfileForm] = useState({ fullName: data.user.fullName, email: data.user.email, phone: data.user.phone })

  if (!validSection) return <Navigate to="/settings/profile" replace />

  const saveProfile = (event) => {
    event.preventDefault()
    const updated = { ...data.user, ...profileForm, email: profileForm.email.trim().toLowerCase() }
    setData((current) => ({ ...current, user: updated }))
    const savedAccount = localStorage.getItem(AUTH_ACCOUNT_KEY)
    if (savedAccount) {
      const account = JSON.parse(savedAccount)
      localStorage.setItem(AUTH_ACCOUNT_KEY, JSON.stringify({ ...account, email: updated.email }))
    }
    setEditing(false)
  }

  const updateNotificationPreference = (key, value) => setPreferences((current) => ({
    ...current,
    notifications: { ...current.notifications, [key]: value },
  }))

  const sectionTitles = {
    profile: ['Profile', 'Manage your personal information.'],
    account: ['Account', 'Review your account details and sign-in status.'],
    notifications: ['Notifications', 'Choose which activity updates you receive.'],
    appearance: ['Appearance', 'Personalize how the tracker looks.'],
    security: ['Security', 'Keep your local demo account secure.'],
    preferences: ['Preferences', 'Set your preferred language, currency, and date format.'],
  }
  const [title, description] = sectionTitles[section]

  return (
    <AppLayout>
      <main className="page-panel settings-page">
        <div className="settings-intro">
          <div><h2>Settings</h2><p>Customize your account and experience.</p></div>
        </div>
        <div className="settings-layout">
          <nav className="settings-nav" aria-label="Settings sections">
            {settingSections.map(({ id, label, icon: Icon }) => (
              <NavLink key={id} to={`/settings/${id}`} className={({ isActive }) => `settings-nav-item ${isActive ? 'active' : ''}`}>
                <Icon size={16} /><span>{label}</span><ChevronRight size={14} />
              </NavLink>
            ))}
          </nav>
          <section className="settings-content">
            <div className="settings-section-heading"><h3>{title}</h3><p>{description}</p></div>

            {section === 'profile' && (
              <div className="settings-profile-card">
                <div className="settings-profile-identity">
                  <div className="avatar large-avatar">{initials(data.user.fullName)}</div>
                  <div><h4>{data.user.fullName}</h4><p>{data.user.email}</p></div>
                </div>
                <div className="settings-detail-grid">
                  <div><small>Phone</small><strong>{data.user.phone || 'Not provided'}</strong></div>
                  <div><small>Member since</small><strong>{data.user.memberSince}</strong></div>
                </div>
                <button type="button" className="primary-button" onClick={() => { setProfileForm({ fullName: data.user.fullName, email: data.user.email, phone: data.user.phone }); setEditing(true) }}>Edit Profile</button>
              </div>
            )}

            {section === 'account' && (
              <div className="settings-card">
                <div className="account-detail-row"><span><UserRound size={17} /> Account name</span><strong>{data.user.fullName}</strong></div>
                <div className="account-detail-row"><span><Mail size={17} /> Email address</span><strong>{data.user.email}</strong></div>
                <div className="account-detail-row"><span><ShieldCheck size={17} /> Account type</span><strong>Local demo account</strong></div>
                <div className="settings-notice">Your information and sign-in are stored in this browser. No remote account service is connected.</div>
                <button type="button" className="outline-button" onClick={() => navigate('/profile')}>Open full profile</button>
              </div>
            )}

            {section === 'notifications' && (
              <div className="settings-card settings-toggles">
                <ToggleSetting title="Enable notifications" description="Master switch for in-app activity alerts." checked={preferences.notifications.enabled} onChange={(value) => updateNotificationPreference('enabled', value)} />
                <ToggleSetting title="Budget alerts" description="Get notified when a budget reaches 80% or more." checked={preferences.notifications.budgetAlerts} onChange={(value) => updateNotificationPreference('budgetAlerts', value)} />
                <ToggleSetting title="Expense activity" description="Get notified when a new expense is recorded." checked={preferences.notifications.expenseAlerts} onChange={(value) => updateNotificationPreference('expenseAlerts', value)} />
                <ToggleSetting title="Income activity" description="Get notified when new income is recorded." checked={preferences.notifications.incomeAlerts} onChange={(value) => updateNotificationPreference('incomeAlerts', value)} />
                <ToggleSetting title="Savings goals" description="Get notified when a savings goal is created." checked={preferences.notifications.savingsAlerts} onChange={(value) => updateNotificationPreference('savingsAlerts', value)} />
                <ToggleSetting title="Email notifications" description="Email delivery preference (delivery is not connected in this demo)." checked={preferences.notifications.email} onChange={(value) => updateNotificationPreference('email', value)} />
                <ToggleSetting title="Push notifications" description="Browser push preference (delivery is not connected in this demo)." checked={preferences.notifications.push} onChange={(value) => updateNotificationPreference('push', value)} />
              </div>
            )}

            {section === 'appearance' && (
              <div className="settings-card">
                <h4 className="settings-subheading">Color theme</h4>
                <div className="theme-choice-grid">
                  {[
                    { value: 'light', label: 'Light', icon: Sun, detail: 'Bright and clear' },
                    { value: 'dark', label: 'Dark', icon: Moon, detail: 'Easy on the eyes' },
                    { value: 'system', label: 'System', icon: Monitor, detail: 'Follow device setting' },
                  ].map(({ value, label, icon: Icon, detail }) => (
                    <button type="button" key={value} className={`theme-choice ${theme === value ? 'selected' : ''}`} onClick={() => setTheme(value)} aria-pressed={theme === value}>
                      <Icon size={19} /><strong>{label}</strong><small>{detail}</small>
                    </button>
                  ))}
                </div>
                <p className="settings-help">Your theme choice is saved on this device.</p>
              </div>
            )}

            {section === 'security' && (
              <div className="settings-card security-settings">
                <div className="settings-notice">This demo stores a password hash locally in your browser. It is not a substitute for server-side authentication.</div>
                <PasswordChangeForm />
              </div>
            )}

            {section === 'preferences' && (
              <div className="settings-card settings-selects">
                <label><span><Languages size={16} /> Language</span>
                  <select value={preferences.language} onChange={(event) => setPreferences((current) => ({ ...current, language: event.target.value }))}>
                    <option>English</option><option>French</option><option>Spanish</option>
                  </select>
                </label>
                <label><span><DollarSign size={16} /> Currency</span>
                  <select value={preferences.currency} onChange={(event) => setPreferences((current) => ({ ...current, currency: event.target.value }))}>
                    <option value="USD">USD — US Dollar</option><option value="EUR">EUR — Euro</option><option value="GBP">GBP — British Pound</option><option value="CAD">CAD — Canadian Dollar</option><option value="AUD">AUD — Australian Dollar</option><option value="RWF">RWF — Rwandan Franc</option>
                  </select>
                </label>
                <label><span><CalendarDays size={16} /> Date format</span>
                  <select value={preferences.dateFormat} onChange={(event) => setPreferences((current) => ({ ...current, dateFormat: event.target.value }))}>
                    <option value="MMM d, yyyy">May 20, 2024</option><option value="MM/dd/yyyy">05/20/2024</option><option value="dd/MM/yyyy">20/05/2024</option><option value="yyyy-MM-dd">2024-05-20</option>
                  </select>
                </label>
                <p className="settings-help">Currency and date changes are reflected throughout the tracker.</p>
              </div>
            )}
          </section>
        </div>
      </main>
      {editing && <DataModal
        title="Edit Profile"
        form={profileForm}
        setForm={setProfileForm}
        fields={[
          { name: 'fullName', label: 'Full name' },
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'phone', label: 'Phone', type: 'tel', required: false },
        ]}
        onClose={() => setEditing(false)}
        onSave={saveProfile}
        submitLabel="Save Profile"
      />}
    </AppLayout>
  )
}

function NotificationsPage() {
  const { notifications, markRead, markAllRead } = useNotifications()
  const unreadCount = notifications.filter((item) => !item.read).length
  return (
    <AppLayout>
      <main className="page-panel notifications-page">
        <div className="page-header-row">
          <div><h2>Notifications</h2><p className="settings-help">{unreadCount ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : "You're all caught up."}</p></div>
          <button type="button" className="outline-button" onClick={markAllRead} disabled={!unreadCount}><CheckCheck size={15} /> Mark all as read</button>
        </div>
        <div className="notifications-page-list"><NotificationList items={notifications} onRead={markRead} /></div>
      </main>
    </AppLayout>
  )
}

function ProfilePage() {
  const { data, setData } = useAppData()
  const user = data.user
  const [editing, setEditing] = useState(false)
  const [profileForm, setProfileForm] = useState({ fullName: user.fullName, email: user.email, phone: user.phone })

  const saveProfile = (event) => {
    event.preventDefault()
    const updated = { ...user, ...profileForm, email: profileForm.email.trim().toLowerCase() }
    setData((current) => ({ ...current, user: updated }))
    const savedAccount = localStorage.getItem(AUTH_ACCOUNT_KEY)
    if (savedAccount) {
      const account = JSON.parse(savedAccount)
      localStorage.setItem(AUTH_ACCOUNT_KEY, JSON.stringify({ ...account, email: updated.email }))
    }
    setEditing(false)
  }

  return (
    <AppLayout>
      <main className="page-panel profile-layout">
        <div className="profile-card">
          <div className="profile-header">
            <div className="avatar large-avatar">{initials(user.fullName)}</div>
            <div>
              <h3>{user.fullName}</h3>
              <p>{user.email}</p>
            </div>
          </div>

          <div className="profile-meta">
            <div><span>Phone</span><strong>{user.phone}</strong></div>
            <div><span>Member Since</span><strong>{user.memberSince}</strong></div>
          </div>

          <button type="button" className="primary-button" onClick={() => { setProfileForm({ fullName: user.fullName, email: user.email, phone: user.phone }); setEditing(true) }}>Edit Profile</button>
        </div>

        <div className="password-card">
          <h3>Change Password</h3>
          <PasswordChangeForm />
        </div>
      </main>
      {editing && <DataModal
        title="Edit Profile"
        form={profileForm}
        setForm={setProfileForm}
        fields={[
          { name: 'fullName', label: 'Full name' },
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'phone', label: 'Phone', type: 'tel', required: false },
        ]}
        onClose={() => setEditing(false)}
        onSave={saveProfile}
        submitLabel="Save Profile"
      />}
    </AppLayout>
  )
}

function HomePage() {
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    const updateScrollButton = () => setShowBackToTop(window.scrollY > 320)
    updateScrollButton()
    window.addEventListener('scroll', updateScrollButton, { passive: true })
    return () => window.removeEventListener('scroll', updateScrollButton)
  }, [])

  return (
    <div className="home-shell min-h-screen">
      <PublicHeader />

      <main className="hero-shell">
        <section className="hero-section">
          <div className="hero-copy min-w-0">
            <h1>Take Control Of<br />Your Finances</h1>
            <p>
              Track income, manage expenses, set budgets,
              achieve your savings goals and build a better
              financial future.
            </p>

            <div className="cta-row">
              <Link to="/register" className="primary-button">Get Started</Link>
              <a href="#features" className="secondary-button">Learn More</a>
            </div>
          </div>

          <div className="illustration-panel min-w-0">
            <div className="home-illustration" aria-label="Illustration of a personal finance dashboard" role="img">
              <div className="illustration-orbit orbit-one" />
              <div className="illustration-orbit orbit-two" />
              <div className="float-icon float-savings"><PiggyBank size={19} /></div>
              <div className="float-icon float-growth"><TrendingUp size={17} /></div>
              <div className="illustration-plant"><i /><i /><i /><i /><b /></div>
              <div className="finance-dashboard">
                <div className="finance-topbar">
                  <div><span className="tiny-brand">PT</span><b>Dashboard</b></div>
                  <span className="tiny-avatar">JD</span>
                </div>
                <div className="finance-balance">
                  <small>Total Balance</small>
                  <strong>$4,750.00</strong>
                  <span>↑ 12.5%</span>
                </div>
                <div className="finance-chart">
                  <div className="chart-lines"><i /><i /><i /></div>
                  <svg viewBox="0 0 260 92" role="presentation" aria-hidden="true">
                    <defs>
                      <linearGradient id="home-chart-fill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0" stopColor="#8195ff" stopOpacity=".2" />
                        <stop offset="1" stopColor="#8195ff" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M2 70 C22 67 24 48 42 55 S67 68 82 47 S110 54 124 39 S147 53 161 30 S187 44 202 22 S229 38 258 9 V92 H2Z" fill="url(#home-chart-fill)" />
                    <path d="M2 70 C22 67 24 48 42 55 S67 68 82 47 S110 54 124 39 S147 53 161 30 S187 44 202 22 S229 38 258 9" fill="none" stroke="#6275f5" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  <div className="chart-months"><span>May 01</span><span>May 15</span><span>May 30</span></div>
                </div>
                <div className="finance-stats">
                  <div><span>Income</span><b>$3,200</b><i className="stat-up" /></div>
                  <div><span>Expenses</span><b>$1,250</b><i className="stat-down" /></div>
                  <div><span>Savings</span><b>$1,950</b><i className="stat-up" /></div>
                </div>
              </div>
              <div className="illustration-person">
                <div className="person-hair" />
                <div className="person-face"><i /><i /></div>
                <div className="person-neck" />
                <div className="person-shirt" />
                <div className="person-arm" />
                <div className="person-pants" />
                <div className="person-leg leg-left" />
                <div className="person-leg leg-right" />
                <div className="person-shoe shoe-left" />
                <div className="person-shoe shoe-right" />
              </div>
              <div className="ground-shadow" />
              <div className="float-icon float-check"><ShieldCheck size={18} /></div>
              <div className="float-icon float-wallet"><Wallet size={18} /></div>
            </div>
          </div>
        </section>

        <section className="feature-row w-full" aria-label="Tracker highlights">
          <FeatureCard icon={<Wallet size={17} />} title="Track Income" description="Easily record all sources of income" />
          <FeatureCard icon={<CreditCard size={17} />} title="Manage Expenses" description="Keep track of your spending" />
          <FeatureCard icon={<PiggyBank size={17} />} title="Set Budgets" description="Plan your spending with budgets" />
          <FeatureCard icon={<Sparkles size={17} />} title="Achieve Goals" description="Save money and reach your goals" />
        </section>
      </main>

      <section className="home-info-section" id="features">
        <div className="home-info-inner">
          <div className="home-section-heading">
            <span className="home-eyebrow">Features</span>
            <h2>Everything you need to feel in control</h2>
            <p>One simple place to understand what comes in, where it goes, and what you are saving toward.</p>
          </div>
          <div className="home-feature-grid">
            <article className="home-info-card">
              <span className="home-info-icon income"><Wallet size={20} /></span>
              <h3>Know your income</h3>
              <p>Keep track of salary, freelance work, and other income in one clear view.</p>
            </article>
            <article className="home-info-card">
              <span className="home-info-icon expenses"><CreditCard size={20} /></span>
              <h3>Understand spending</h3>
              <p>Organize expenses by category and see how everyday spending adds up.</p>
            </article>
            <article className="home-info-card">
              <span className="home-info-icon budgets"><PiggyBank size={20} /></span>
              <h3>Stay on budget</h3>
              <p>Set category budgets and check your progress before you reach your limits.</p>
            </article>
            <article className="home-info-card">
              <span className="home-info-icon goals"><Target size={20} /></span>
              <h3>Reach savings goals</h3>
              <p>Track your progress toward the things that matter to you.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="home-info-section about-section" id="about">
        <div className="home-info-inner about-content">
          <span className="home-eyebrow">About</span>
          <h2>Small steps make money feel simpler</h2>
          <p>
            Personal Budget Tracker helps you bring income, expenses, budgets, and savings goals together.
            Instead of guessing where your money went, you can review your activity and make your next
            decision with more confidence.
          </p>
          <Link to="/register" className="primary-button">Start tracking</Link>
        </div>
      </section>

      <section className="home-info-section pricing-section" id="pricing">
        <div className="home-info-inner">
          <div className="home-section-heading">
            <span className="home-eyebrow">Pricing</span>
            <h2>Get started for free</h2>
            <p>Try the personal budgeting tools without a subscription.</p>
          </div>
          <article className="pricing-card">
            <div>
              <span className="pricing-label">Personal</span>
              <h3>Free</h3>
              <p>Everything you need to get started organizing your finances.</p>
            </div>
            <ul>
              <li><Wallet size={16} /> Income and expense tracking</li>
              <li><Landmark size={16} /> Categories and budgets</li>
              <li><Target size={16} /> Savings goals and reports</li>
            </ul>
            <Link to="/register" className="primary-button">Create your free account</Link>
            <small>Demo note: data is saved in this browser on this device.</small>
          </article>
        </div>
      </section>
      {showBackToTop && (
        <button
          type="button"
          className="back-to-top"
          aria-label="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <ArrowUp size={19} />
        </button>
      )}
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="feature-card">
      <span className="feature-icon">{icon}</span>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AppDataProvider>
        <PreferencesProvider>
          <NotificationsProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<AuthPage mode="login" />} />
                <Route path="/register" element={<AuthPage mode="register" />} />
                <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/income" element={<ProtectedRoute><IncomePage /></ProtectedRoute>} />
                <Route path="/expenses" element={<ProtectedRoute><ExpensesPage /></ProtectedRoute>} />
                <Route path="/categories" element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
                <Route path="/budgets" element={<ProtectedRoute><BudgetsPage /></ProtectedRoute>} />
                <Route path="/savings" element={<ProtectedRoute><SavingsPage /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                <Route path="/settings/:section" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </NotificationsProvider>
        </PreferencesProvider>
      </AppDataProvider>
    </ThemeProvider>
  )
}

export default App
