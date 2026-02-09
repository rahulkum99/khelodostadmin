import React, { useEffect, useState } from 'react'
import './StatusModal.css'

// Simple status mapping to keep styling consistent
const STATUS_OPTIONS = [
  { id: 'active', label: 'Active' },
  { id: 'suspended', label: 'Suspend' },
  { id: 'locked', label: 'Locked' },
]

function StatusModal({ isOpen, onClose, user, onSubmit }) {
  const [selectedStatus, setSelectedStatus] = useState('active')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (isOpen && user) {
      setSelectedStatus(user.status || 'active')
      setPassword('')
      setShowPassword(false)
    }
  }, [isOpen, user])

  if (!isOpen || !user) return null

  const handleChange = () => {
    if (!password) return
    onSubmit?.({
      user,
      newStatus: selectedStatus,
      password,
    })
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
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`status-option-card ${
                selectedStatus === opt.id ? 'selected' : ''
              } ${opt.id}`}
              onClick={() => setSelectedStatus(opt.id)}
            >
              <div className="status-option-icon" />
              <div className="status-option-label">{opt.label}</div>
            </button>
          ))}
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
          >
            Change
          </button>
        </div>
      </div>
    </div>
  )
}

export default StatusModal

