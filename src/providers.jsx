import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { APP_STORAGE_KEY, THEME_STORAGE_KEY, PREFERENCES_STORAGE_KEY, NOTIFICATIONS_STORAGE_KEY, initialNotifications, readData, readPreferences } from './app-data.js'
import { AppDataContext, NotificationsContext, PreferencesContext, ThemeContext } from './contexts.js'
import { apiRequest, clearApiToken, getApiToken } from './api/client.js'
import { translate } from './translations.js'

const MIN_DATA_LOADING_DURATION = 3000

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
  const [error, setError] = useState('')
  const [loadedForToken, setLoadedForToken] = useState(null)
  const { theme, setTheme } = useContext(ThemeContext)
  const { sessionToken, setSessionToken } = useContext(AppDataContext)

  useEffect(() => {
    const language = preferences.language
    document.documentElement.lang = language === 'Kinyarwanda' ? 'rw' : 'en'
    document.title = `Budgetly | ${translate('Personal Budget Tracker', language)}`
  }, [preferences.language])

  useEffect(() => {
    if (!sessionToken) {
      setLoadedForToken(null)
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences))
      return
    }
    let active = true
    setLoadedForToken(null)
    apiRequest('/preferences')
      .then(({ preferences: saved }) => {
        if (!active) return
        const next = { ...readPreferences(), ...saved, notifications: { ...readPreferences().notifications, ...saved.notifications } }
        setPreferences(next)
        if (saved.theme) setTheme(saved.theme)
        setLoadedForToken(sessionToken)
        setError('')
      })
      .catch((requestError) => {
        if (!active) return
        setError(requestError.message)
        if (requestError.status === 401) {
          clearApiToken()
          localStorage.removeItem('budget-tracker-auth')
          setSessionToken(null)
        }
      })
    return () => { active = false }
  }, [sessionToken, setTheme])

  useEffect(() => {
    if (!sessionToken || loadedForToken !== sessionToken) {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences))
      return
    }
    const timer = window.setTimeout(() => {
      apiRequest('/preferences', { method: 'PATCH', body: preferences })
        .then(() => {
          localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences))
          setError('')
        })
        .catch((requestError) => setError(requestError.message))
    }, 200)
    return () => window.clearTimeout(timer)
  }, [preferences, sessionToken, loadedForToken])

  useEffect(() => {
    if (loadedForToken === sessionToken && sessionToken && preferences.theme !== theme) {
      setPreferences((current) => ({ ...current, theme }))
    }
  }, [theme, preferences.theme, sessionToken, loadedForToken])

  const value = useMemo(() => ({ preferences, setPreferences, sessionToken, setSessionToken, error }), [preferences, sessionToken, error])
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
  const [loadedForToken, setLoadedForToken] = useState(null)
  const { preferences } = useContext(PreferencesContext)
  const { sessionToken, setSessionToken, setApiError } = useContext(AppDataContext)

  useEffect(() => {
    if (!sessionToken) {
      setLoadedForToken(null)
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications))
      return
    }
    let active = true
    apiRequest('/notifications')
      .then(({ notifications: saved }) => {
        if (!active) return
        setNotifications(saved)
        setLoadedForToken(sessionToken)
      })
      .catch((requestError) => {
        if (!active) return
        setApiError(requestError.message)
        if (requestError.status === 401) {
          clearApiToken()
          localStorage.removeItem('budget-tracker-auth')
          setSessionToken(null)
        }
      })
    return () => { active = false }
  }, [sessionToken, setApiError, setSessionToken])

  const addNotification = useCallback(async (type, title, message) => {
    const preferenceKey = {
      budget: 'budgetAlerts',
      expense: 'expenseAlerts',
      income: 'incomeAlerts',
      savings: 'savingsAlerts',
    }[type]
    if (!preferences.notifications.enabled || (preferenceKey && !preferences.notifications[preferenceKey])) return
    const notification = { id: `${Date.now()}-${Math.random()}`, type, title, message, createdAt: Date.now(), read: false }
    if (sessionToken && loadedForToken === sessionToken) {
      try {
        const result = await apiRequest('/notifications', { method: 'POST', body: notification })
        setNotifications((items) => [result.notification, ...items])
      } catch (requestError) {
        setApiError(requestError.message)
      }
      return
    }
    setNotifications((items) => [notification, ...items])
  }, [preferences.notifications, sessionToken, loadedForToken, setApiError])
  const markRead = useCallback(async (id) => {
    if (sessionToken && loadedForToken === sessionToken) {
      try {
        const { notifications: updated } = await apiRequest(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' })
        setNotifications(updated)
      } catch (requestError) {
        setApiError(requestError.message)
      }
      return
    }
    setNotifications((items) => items.map((item) => item.id === id ? { ...item, read: true } : item))
  }, [sessionToken, loadedForToken, setApiError])
  const markAllRead = useCallback(async () => {
    if (sessionToken && loadedForToken === sessionToken) {
      try {
        const { notifications: updated } = await apiRequest('/notifications/read-all', { method: 'PATCH' })
        setNotifications(updated)
      } catch (requestError) {
        setApiError(requestError.message)
      }
      return
    }
    setNotifications((items) => items.map((item) => ({ ...item, read: true })))
  }, [sessionToken, loadedForToken, setApiError])

  useEffect(() => {
    if (!sessionToken) localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications))
  }, [notifications, sessionToken])

  const value = useMemo(() => ({ notifications, addNotification, markRead, markAllRead }), [notifications, addNotification, markRead, markAllRead])
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function AppDataProvider({ children }) {
  const [data, setData] = useState(readData)
  const [sessionToken, setSessionToken] = useState(getApiToken)
  const [loading, setLoading] = useState(() => Boolean(getApiToken()))
  const [error, setError] = useState('')
  const [dataError, setDataError] = useState('')
  const [dataRequestId, setDataRequestId] = useState(0)

  const updateSessionToken = useCallback((token) => {
    setSessionToken(token)
    setLoading(Boolean(token))
    setDataError('')
    setError('')
  }, [])

  const retryData = useCallback(() => {
    setLoading(true)
    setDataError('')
    setError('')
    setDataRequestId((current) => current + 1)
  }, [])

  useEffect(() => {
    if (!sessionToken) {
      localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(data))
      return
    }
    let active = true
    const requestStartedAt = Date.now()
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 20000)
    let minimumDurationTimer
    apiRequest('/data', { signal: controller.signal })
      .then((remoteData) => {
        if (!active) return
        setData(remoteData)
        setDataError('')
        setError('')
      })
      .catch((requestError) => {
        if (!active) return
        const message = controller.signal.aborted
          ? 'Loading your financial data took too long. Check your connection and try again.'
          : requestError.message
        setError(message)
        setDataError(message)
        if (requestError.status === 401) {
          clearApiToken()
          localStorage.removeItem('budget-tracker-auth')
          updateSessionToken(null)
        }
      })
      .finally(() => {
        window.clearTimeout(timeout)
        if (active) {
          const remainingDuration = Math.max(0, MIN_DATA_LOADING_DURATION - (Date.now() - requestStartedAt))
          minimumDurationTimer = window.setTimeout(() => setLoading(false), remainingDuration)
        }
      })
    return () => {
      active = false
      window.clearTimeout(timeout)
      window.clearTimeout(minimumDurationTimer)
      controller.abort()
    }
  }, [sessionToken, dataRequestId, updateSessionToken])

  useEffect(() => {
    if (!sessionToken) return undefined
    let active = true
    let requestInFlight = false
    const sendHeartbeat = async () => {
      if (!active || document.visibilityState !== 'visible' || requestInFlight) return
      requestInFlight = true
      try {
        await apiRequest('/auth/heartbeat', { method: 'POST' })
      } catch (requestError) {
        if (!active) return
        if (requestError.status === 401) {
          clearApiToken()
          localStorage.removeItem('budget-tracker-auth')
          updateSessionToken(null)
        } else {
          setError(requestError.message)
        }
      } finally {
        requestInFlight = false
      }
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') sendHeartbeat()
    }
    sendHeartbeat()
    const interval = window.setInterval(sendHeartbeat, 60_000)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      active = false
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [sessionToken, updateSessionToken])

  useEffect(() => {
    if (!sessionToken) localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(data))
  }, [data, sessionToken])

  const value = useMemo(() => ({
    data,
    setData,
    loading,
    dataError,
    error,
    setApiError: setError,
    sessionToken,
    setSessionToken: updateSessionToken,
    retryData,
  }), [data, loading, dataError, error, sessionToken, updateSessionToken, retryData])
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}
