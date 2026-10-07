import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppDataProvider, NotificationsProvider, PreferencesProvider, ThemeProvider } from './providers.jsx'
import { ProtectedRoute } from './components.jsx'
import { AuthPage, BudgetsPage, CategoriesPage, DashboardPage, ExpensesPage, IncomePage, ReportsPage, SavingsPage } from './pages/TrackerPages.jsx'
import { NotificationsPage, ProfilePage, SettingsPage } from './pages/SettingsPages.jsx'
import { HomePage } from './pages/HomePage.jsx'
import './App.css'

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
