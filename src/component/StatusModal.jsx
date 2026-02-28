import React, { useEffect, useState } from 'react'
import { useUpdateUserStatusMutation } from '../redux/api/authApi'
import './StatusModal.css'

// Simple status mapping to keep styling consistent; values match API: active | suspended | locked
const STATUS_OPTIONS = [
  { id: 'active', label: 'Active' },
  { id: 'suspended', label: 'Suspend' },
  { id: 'locked', label: 'Locked' },
]

function StatusModal({ isOpen, onClose, user, onSubmit }) {
  const [selectedStatus, setSelectedStatus] = useState('suspended')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const [updateStatus, { isLoading }] = useUpdateUserStatusMutation()

  useEffect(() => {
    if (isOpen && user) {
      const current = (user.status || 'active').toLowerCase()
      setSelectedStatus(current === 'suspended' || current === 'locked' ? current : 'suspended')
      setPassword('')
      setShowPassword(false)
      setError('')
    }
  }, [isOpen, user])

  if (!isOpen || !user) return null

  const handleChange = async () => {
    setError('')
    if (!password) {
      setError('Please enter your password.')
      return
    }
    const userId = user.id || user._id
    if (!userId) {
      setError('User ID missing.')
      return
    }
    try {
      const response = await updateStatus({
        userId,
        status: selectedStatus,
        adminPassword: password,
      }).unwrap()
      onSubmit?.({
        user,
        newStatus: selectedStatus,
        password,
        response,
      })
      onClose?.()
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Failed to update status.')
    }
  }

  const currentStatusLabel =
    STATUS_OPTIONS.find((s) => s.id === (user.status || 'active'))?.label ||
    user.status ||
    'active'

  return (
    <div className="status-modal-overlay">
      <div className="status-modal">
        <div className="status-modal-header">
          <div className="status-modal-title">Change Status</div>
          <button className="status-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {error && (
          <div className="status-modal-error">{error}</div>
        )}
        <div className="status-modal-user-row">
          <div className="status-user-badge">
            {user.userType === 'MASTER' ? 'MASTER' : 'USER'}
          </div>
          <div className="status-user-name">{user.username}</div>
          <div className={`status-current-badge ${user.status || 'active'}`}>
            {currentStatusLabel}
          </div>
        </div>

        <div className="status-options-row">
          {STATUS_OPTIONS.map((opt) => {
            const isActiveOption = opt.id === 'active'
            return (
              <button
                key={opt.id}
                type="button"
                className={`status-option-card ${
                  selectedStatus === opt.id ? 'selected' : ''
                } ${opt.id} ${isActiveOption ? 'disabled' : ''}`}
                onClick={() => !isActiveOption && setSelectedStatus(opt.id)}
                disabled={isActiveOption}
              >
                {selectedStatus === opt.id && (
                  <span className="status-option-tick" aria-hidden>✓</span>
                )}
                <div className="status-option-icon" />
                <div className="status-option-label">{opt.label}</div>
              </button>
            )
          })}
        </div>

        <div className="status-modal-footer">
          <div className="status-password-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              className="status-password-input"
              placeholder="Password.."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="status-password-toggle"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          <button
            type="button"
            className="status-change-btn"
            onClick={handleChange}
            disabled={isLoading}
          >
            {isLoading ? 'Updating...' : 'Change'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default StatusModal

