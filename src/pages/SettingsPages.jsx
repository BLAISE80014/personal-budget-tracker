import { useState } from 'react'
import {
  CalendarDays,
  CheckCheck,
  ChevronRight,
  DollarSign,
  Languages,
  Mail,
  Moon,
  Monitor,
  ShieldCheck,
  Sun,
  UserRound
} from 'lucide-react'
import { Navigate, NavLink, useNavigate, useParams } from 'react-router-dom'
import { AUTH_ACCOUNT_KEY, initials, settingSections } from '../app-data.js'
import { useAppData, useNotifications, usePreferences, useTheme } from '../contexts.js'
import { AppLayout, DataModal, NotificationList, PasswordChangeForm, ToggleSetting } from '../components.jsx'

export function SettingsPage() {
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

export function NotificationsPage() {
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

export function ProfilePage() {
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
