import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ShieldCheck, UserRound, X } from 'lucide-react'
import './RoleSelectionDialog.css'

export default function RoleSelectionDialog({ intent, onClose, onContinue }) {
  const [selectedRole, setSelectedRole] = useState('')
  const [showAdminRegistrationNotice, setShowAdminRegistrationNotice] = useState(false)
  const userOptionRef = useRef(null)

  useEffect(() => {
    userOptionRef.current?.focus()
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  const continueSelection = () => {
    if (!selectedRole) return
    if (intent === 'register' && selectedRole === 'admin') {
      setShowAdminRegistrationNotice(true)
      return
    }
    onContinue(selectedRole)
  }

  return (
    <div className="role-dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="role-dialog" role="dialog" aria-modal="true" aria-labelledby="role-dialog-title" aria-describedby="role-dialog-description">
        {showAdminRegistrationNotice ? (
          <>
            <button type="button" className="role-dialog-back" onClick={() => setShowAdminRegistrationNotice(false)}>
              <ArrowLeft size={16} /> Back to role selection
            </button>
            <div className="role-dialog-heading">
              <span className="role-dialog-heading-icon admin"><ShieldCheck size={22} /></span>
              <h2 id="role-dialog-title">Administrator accounts are restricted</h2>
              <p id="role-dialog-description">
                Admin accounts can only be provisioned through an authorized server-side setup process.
                Public registration cannot create administrator accounts.
              </p>
            </div>
            <button type="button" className="primary-button role-dialog-continue" onClick={onClose}>Got it</button>
          </>
        ) : (
          <>
            <button type="button" className="role-dialog-close" onClick={onClose} aria-label="Close role selection">
              <X size={18} />
            </button>
            <div className="role-dialog-heading">
              <span className="role-dialog-brand">PT</span>
              <h2 id="role-dialog-title">Welcome to Personal Budget Tracker</h2>
              <p id="role-dialog-description">Choose how you want to continue.</p>
            </div>
            <div className="role-choice-list" role="group" aria-label="Choose account type">
              <button
                ref={userOptionRef}
                type="button"
                className={`role-choice ${selectedRole === 'user' ? 'selected' : ''}`}
                aria-pressed={selectedRole === 'user'}
                onClick={() => setSelectedRole('user')}
              >
                <span className="role-choice-icon user"><UserRound size={20} /></span>
                <span className="role-choice-copy">
                  <strong>User</strong>
                  <small>Manage your personal income, expenses, budgets, savings, and reports.</small>
                </span>
                <span className="role-choice-indicator" aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`role-choice ${selectedRole === 'admin' ? 'selected' : ''}`}
                aria-pressed={selectedRole === 'admin'}
                onClick={() => setSelectedRole('admin')}
              >
                <span className="role-choice-icon admin"><ShieldCheck size={20} /></span>
                <span className="role-choice-copy">
                  <strong>Admin</strong>
                  <small>For authorized administrators with a provisioned account.</small>
                </span>
                <span className="role-choice-indicator" aria-hidden="true" />
              </button>
            </div>
            <div className="role-dialog-actions">
              <button type="button" className="outline-button" onClick={onClose}>Back</button>
              <button type="button" className="primary-button" disabled={!selectedRole} onClick={continueSelection}>
                {selectedRole === 'admin' ? 'Continue as Admin' : 'Continue as User'}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
