import { useEffect, useMemo, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PublicHeader } from '../components.jsx'
import { apiRequest } from '../api/client.js'

function PasswordStrength({ password }) {
  const score = useMemo(() => {
    if (!password) return 0
    return [
      password.length >= 8,
      password.length >= 12,
      /[a-z]/.test(password) && /[A-Z]/.test(password),
      /\d/.test(password) || /[^A-Za-z0-9]/.test(password),
    ].filter(Boolean).length
  }, [password])
  const label = ['Enter a password', 'Weak', 'Fair', 'Good', 'Strong'][score]

  return (
    <div className="password-strength" aria-live="polite">
      <div className="password-strength-bars" aria-hidden="true">
        {[1, 2, 3, 4].map((level) => (
          <span key={level} className={level <= score ? `is-active strength-${score}` : ''} />
        ))}
      </div>
      <span>{label}</span>
    </div>
  )
}

function PasswordResetLayout({ children }) {
  return (
    <div className="auth-shell password-reset-shell">
      <PublicHeader minimal />
      <main className="auth-main auth-main-centered">
        {children}
      </main>
    </div>
  )
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const onSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setSubmitting(true)

    try {
      const result = await apiRequest('/auth/forgot-password', {
        method: 'POST',
        authenticated: false,
        body: { email: email.trim().toLowerCase() },
      })
      setMessage(result.message)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PasswordResetLayout>
      <form className="auth-card password-reset-card" onSubmit={onSubmit}>
        <h1>Forgot Password?</h1>
        <p>Don't worry! Enter your registered email address and we'll send you a link to reset your password.</p>

        <label>
          <span>Email</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            maxLength={254}
            required
            disabled={submitting}
          />
        </label>

        {error && <p className="form-error" role="alert">{error}</p>}
        {message && <p className="password-reset-success" role="status">{message}</p>}
        <button type="submit" className="primary-button large-button" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send Reset Link'}
        </button>
        <div className="auth-switch">
          <Link to="/login">Back to Login</Link>
        </div>
      </form>
    </PasswordResetLayout>
  )
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!success) return undefined
    const timer = window.setTimeout(() => {
      navigate('/login', {
        replace: true,
        state: { notice: 'Your password has been reset. Sign in with your new password.' },
      })
    }, 1800)
    return () => window.clearTimeout(timer)
  }, [success, navigate])

  const onSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (newPassword.length < 8 || newPassword.length > 128) {
      setError('Your password must be between 8 and 128 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Your passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        authenticated: false,
        body: { token, newPassword },
      })
      setSuccess(true)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PasswordResetLayout>
      <form className="auth-card password-reset-card" onSubmit={onSubmit}>
        <h1>Reset Password</h1>
        <p>Choose a new password for your account.</p>

        {!token ? (
          <p className="form-error" role="alert">This password reset link is invalid or incomplete. Request a new one to continue.</p>
        ) : success ? (
          <div className="password-reset-success" role="status">
            Your password has been reset. Redirecting you to Login…
          </div>
        ) : (
          <>
            <label>
              <span>New Password</span>
              <span className="password-reset-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="newPassword"
                  autoComplete="new-password"
                  placeholder="Enter a new password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  minLength={8}
                  maxLength={128}
                  required
                  disabled={submitting}
                />
                <button
                  type="button"
                  className="password-visibility-button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide new password' : 'Show new password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
              <PasswordStrength password={newPassword} />
              <span className="password-reset-requirement">Use at least 8 characters (up to 128).</span>
            </label>

            <label>
              <span>Confirm New Password</span>
              <span className="password-reset-input-wrap">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  autoComplete="new-password"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={8}
                  maxLength={128}
                  required
                  disabled={submitting}
                />
                <button
                  type="button"
                  className="password-visibility-button"
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                  aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>

            {error && <p className="form-error" role="alert">{error}</p>}
            <button type="submit" className="primary-button large-button" disabled={submitting}>
              {submitting ? 'Resetting…' : 'Reset Password'}
            </button>
          </>
        )}

        <div className="auth-switch">
          <Link to="/login">Back to Login</Link>
        </div>
      </form>
    </PasswordResetLayout>
  )
}
