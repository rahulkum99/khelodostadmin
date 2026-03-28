import React, { useEffect, useState } from 'react'
import { useUpdateUserHierarchyPasswordMutation } from '../redux/api/authApi'
import './StatusModal.css'
import './ExposureLimitModal.css'

function HierarchyUserPasswordModal({ isOpen, onClose, user, onSubmit }) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [error, setError] = useState('')

  const [updatePassword, { isLoading }] = useUpdateUserHierarchyPasswordMutation()

  useEffect(() => {
    if (isOpen && user) {
      setNewPassword('')
      setConfirmPassword('')
      setAdminPassword('')
      setShowNew(false)
      setShowConfirm(false)
      setShowAdmin(false)
      setError('')
    }
  }, [isOpen, user])

  if (!isOpen || !user) return null

  const handleCancel = () => {
    setError('')
    onClose?.()
  }

  const handleSubmit = async () => {
    setError('')
    const trimmedNew = (newPassword || '').trim()
    const trimmedConfirm = (confirmPassword || '').trim()
    const trimmedAdmin = (adminPassword || '').trim()

    if (!trimmedNew) {
      setError('Enter a new password.')
      return
    }
    if (trimmedNew.length < 6) {
      setError('New password must be at least 6 characters.')
      return
    }
    if (trimmedNew !== trimmedConfirm) {
      setError('New password and confirmation do not match.')
      return
    }
    if (!trimmedAdmin) {
      setError('Enter your admin password.')
      return
    }

    const userId = user.id || user._id
    if (!userId) {
      setError('User ID missing.')
      return
    }

    try {
      const response = await updatePassword({
        userId,
        adminPassword: trimmedAdmin,
        newPassword: trimmedNew,
      }).unwrap()
      onSubmit?.({ user, response })
      onClose?.()
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Failed to change password.')
    }
  }

  return (
    <div className="status-modal-overlay">
      <div className="status-modal">
        <div className="status-modal-header">
          <div className="status-modal-title">Change user password</div>
          <button type="button" className="status-modal-close" onClick={handleCancel}>
            ×
          </button>
        </div>

        {error && <div className="status-modal-error">{error}</div>}

        <div className="status-modal-user-row">
          <div className="status-user-badge">{user.userType || 'USER'}</div>
          <div className="status-user-name">{user.username}</div>
        </div>

        <div className="exposure-limit-form">
          <div className="exposure-limit-field">
            <label htmlFor="hierarchy-pw-new">New password</label>
            <div className="status-password-wrapper">
              <input
                id="hierarchy-pw-new"
                type={showNew ? 'text' : 'password'}
                className="status-password-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="status-password-toggle"
                onClick={() => setShowNew((v) => !v)}
                aria-label={showNew ? 'Hide password' : 'Show password'}
              >
                {showNew ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div className="exposure-limit-field">
            <label htmlFor="hierarchy-pw-confirm">Confirm new password</label>
            <div className="status-password-wrapper">
              <input
                id="hierarchy-pw-confirm"
                type={showConfirm ? 'text' : 'password'}
                className="status-password-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="status-password-toggle"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div className="exposure-limit-field exposure-limit-password-block">
            <label htmlFor="hierarchy-pw-admin">Admin password</label>
            <div className="status-password-wrapper">
              <input
                id="hierarchy-pw-admin"
                type={showAdmin ? 'text' : 'password'}
                className="status-password-input"
                placeholder="Your password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                autoComplete="off"
              />
              <button
                type="button"
                className="status-password-toggle"
                onClick={() => setShowAdmin((v) => !v)}
                aria-label={showAdmin ? 'Hide password' : 'Show password'}
              >
                {showAdmin ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div className="exposure-limit-actions">
            <button
              type="button"
              className="exposure-limit-btn exposure-limit-btn-cancel"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="exposure-limit-btn exposure-limit-btn-submit"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HierarchyUserPasswordModal
