import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { APP_STORAGE_KEY, THEME_STORAGE_KEY, PREFERENCES_STORAGE_KEY, NOTIFICATIONS_STORAGE_KEY, initialNotifications, readData, readPreferences } from './app-data.js'
import { AppDataContext, NotificationsContext, PreferencesContext, ThemeContext } from './contexts.js'

export function ThemeProvider({ children }) {
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

export function PreferencesProvider({ children }) {
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

export function NotificationsProvider({ children }) {
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

export function AppDataProvider({ children }) {
  const [data, setData] = useState(readData)

  useEffect(() => {
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(data))
  }, [data])

  return <AppDataContext.Provider value={{ data, setData }}>{children}</AppDataContext.Provider>
}
