import { useEffect, useRef, useState } from 'react'
import {
  Bell,
  BellRing,
  ChevronRight,
  CreditCard,
  LogOut,
  Moon,
  Monitor,
  PackageOpen,
  PiggyBank,
  Search,
  Settings,
  Sun,
  Target,
  TrendingDown,
  TrendingUp,
  UserRound,
  Wallet
} from 'lucide-react'
import { Link, Navigate, NavLink, useNavigate } from 'react-router-dom'
import { AUTH_STORAGE_KEY, initials, money, navItems, profileAvatarOptions, settingSections } from './app-data.js'
import { useAppData, useNotifications, usePreferences, useTheme } from './contexts.js'
import { apiRequest, clearApiToken, getApiToken } from './api/client.js'

export function DataModal({ title, form, setForm, fields, onClose, onSave, submitLabel = 'Save', isSaving = false }) {
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
            <button type="submit" className="primary-button" disabled={isSaving}>{isSaving ? 'Saving…' : submitLabel}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
      {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  )
}

export function PublicHeader({ minimal = false }) {
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

export function NotificationList({ items, onRead }) {
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

const avatarPalettes = {
  violet: { background: '#dedbff', skin: '#b97854', hair: '#34264d', shirt: '#7063d9' },
  ocean: { background: '#d6eff5', skin: '#e3ae83', hair: '#312b34', shirt: '#3986a2' },
  meadow: { background: '#dff1df', skin: '#87543f', hair: '#211d1d', shirt: '#4f966c' },
  berry: { background: '#f4dce9', skin: '#f0c29e', hair: '#623948', shirt: '#ba5f87' },
  sunset: { background: '#fae6d2', skin: '#d2956c', hair: '#382c25', shirt: '#d27a48' },
}

export function ProfileAvatar({ avatar, name, className = '' }) {
  const palette = avatarPalettes[avatar]
  const label = profileAvatarOptions.find((option) => option.id === avatar)?.label
  const isUploadedImage = typeof avatar === 'string' && avatar.startsWith('data:image/jpeg;base64,')

  return (
    <span className={`avatar ${palette || isUploadedImage ? 'profile-avatar-image' : ''} ${className}`} role={palette || isUploadedImage ? 'img' : undefined} aria-label={isUploadedImage ? 'Uploaded profile picture' : palette ? `${label} profile avatar` : undefined}>
      {isUploadedImage ? (
        <img src={avatar} alt="" />
      ) : palette ? (
        <svg viewBox="0 0 72 72" aria-hidden="true">
          <circle cx="36" cy="36" r="36" fill={palette.background} />
          <path d="M13 72c2-14 11-22 23-22s21 8 23 22" fill={palette.shirt} />
          <path d="M25 48c2-5 2-9 1-13h20c-1 5-1 9 2 13-4 5-8 7-12 7s-8-2-11-7" fill={palette.skin} />
          <path d="M20 34c-2-16 5-25 17-25 13 0 19 10 15 27l-4 7-2-13c-7 1-14-1-20-5l-2 18z" fill={palette.hair} />
          <ellipse cx="29" cy="34" rx="2" ry="1.5" fill="#382b2a" />
          <ellipse cx="43" cy="34" rx="2" ry="1.5" fill="#382b2a" />
          <path d="M32 42c2 2 6 2 8 0" fill="none" stroke="#8d4e49" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M29 29c2-1 4-1 6 0m4 0c2-1 4-1 6 0" fill="none" stroke={palette.hair} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ) : initials(name)}
    </span>
  )
}

export function DashboardHeader() {
  const navigate = useNavigate()
  const { data, setSessionToken } = useAppData()
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
    clearApiToken()
    localStorage.removeItem(AUTH_STORAGE_KEY)
    setSessionToken(null)
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
          <ProfileAvatar avatar={data.user.avatar} name={data.user.fullName} />
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

export function AppLayout({ children }) {
  const navigate = useNavigate()
  const { error, setSessionToken } = useAppData()
  const { error: preferencesError } = usePreferences()
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

        <button type="button" className="logout-nav" onClick={() => { clearApiToken(); localStorage.removeItem(AUTH_STORAGE_KEY); setSessionToken(null); navigate('/login') }}>
          <LogOut size={14} />
          Logout
        </button>
      </aside>

      <div className="content-panel">
        <DashboardHeader />
        {(error || preferencesError) && <div className="api-error-banner" role="alert">{error || preferencesError}</div>}
        {children}
      </div>
    </div>
  )
}

export function ProtectedRoute({ children }) {
  const isLoggedIn = Boolean(localStorage.getItem(AUTH_STORAGE_KEY)) && Boolean(getApiToken())

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  return children
}


export function SummaryCard({ title, value, helper, trend, positive = true }) {
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


export function ToggleSetting({ title, description, checked, onChange }) {
  return (
    <label className="setting-toggle-row">
      <span><strong>{title}</strong><small>{description}</small></span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  )
}

export function PasswordChangeForm() {
  const { setApiError } = useAppData()
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
      await apiRequest('/auth/password', {
        method: 'PATCH',
        body: { currentPassword: passwordForm.current, newPassword: passwordForm.next },
      })
      setPasswordForm({ current: '', next: '', confirm: '' })
      setPasswordMessage('Password updated.')
    } catch (requestError) {
      setPasswordError(requestError.message)
      setApiError(requestError.message)
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
