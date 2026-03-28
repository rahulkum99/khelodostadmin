import React, { useEffect, useState } from 'react'
import { useUpdateUserExposureMutation } from '../redux/api/authApi'
import './StatusModal.css'
import './ExposureLimitModal.css'

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN').format(Number(value) || 0)
}

function ExposureLimitModal({ isOpen, onClose, user, onSubmit }) {
  const [currentLimit, setCurrentLimit] = useState(0)
  const [newExposureLimit, setNewExposureLimit] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const [updateExposure, { isLoading }] = useUpdateUserExposureMutation()

  useEffect(() => {
    if (isOpen && user) {
      const cur = Number(user.exposureLimit ?? 0)
      setCurrentLimit(cur)
      setNewExposureLimit('')
      setPassword('')
      setShowPassword(false)
      setError('')
    }
  }, [isOpen, user])

  if (!isOpen || !user) return null

  const handleCancel = () => {
    setError('')
    onClose?.()
  }

  const handleSave = async () => {
    setError('')
    const adminPassword = (password || '').trim()
    if (!adminPassword) {
      setError('Please enter your password.')
      return
    }
    const limitNum = Number(newExposureLimit)
    if (newExposureLimit === '' || Number.isNaN(limitNum) || limitNum < 0) {
      setError('Enter a valid exposure limit (0 or greater).')
      return
    }
    const userId = user.id || user._id
    if (!userId) {
      setError('User ID missing.')
      return
    }
    try {
      const response = await updateExposure({
        userId,
        adminPassword,
        exposureLimit: limitNum,
      }).unwrap()
      onSubmit?.({ user, exposureLimit: limitNum, response })
      onClose?.()
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Failed to update exposure limit.')
    }
  }

  return (
    <div className="status-modal-overlay">
      <div className="status-modal">
        <div className="status-modal-header">
          <div className="status-modal-title">Exposure limit</div>
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
            <span className="exposure-limit-label">Current exposure limit</span>
            <div className="exposure-limit-readonly" aria-readonly="true">
              {formatCurrency(currentLimit)}
            </div>
          </div>

          <div className="exposure-limit-field">
            <label htmlFor="exposure-limit-new-input">New</label>
            <input
              id="exposure-limit-new-input"
              type="number"
              min={0}
              step="any"
              className="exposure-limit-input"
              value={newExposureLimit}
              onChange={(e) => setNewExposureLimit(e.target.value)}
            />
          </div>

          <div className="exposure-limit-field exposure-limit-password-block">
            <label htmlFor="exposure-limit-admin-password">Admin password</label>
            <div className="status-password-wrapper">
              <input
                id="exposure-limit-admin-password"
                type={showPassword ? 'text' : 'password'}
                className="status-password-input"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="off"
              />
              <button
                type="button"
                className="status-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
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
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExposureLimitModal
