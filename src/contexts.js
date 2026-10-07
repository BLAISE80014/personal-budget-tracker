import { createContext, useContext } from 'react'

export const ThemeContext = createContext(null)
export const AppDataContext = createContext(null)
export const PreferencesContext = createContext(null)
export const NotificationsContext = createContext(null)

export const useTheme = () => useContext(ThemeContext)
export const useAppData = () => useContext(AppDataContext)
export const usePreferences = () => useContext(PreferencesContext)
export const useNotifications = () => useContext(NotificationsContext)
