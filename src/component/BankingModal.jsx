import React, { useState, useEffect } from 'react'
import './BankingModal.css'

function BankingModal({ isOpen, onClose, user, masterBalance = 0, onSubmit }) {
  const [amount, setAmount] = useState('')
  const [remark, setRemark] = useState('')
  const [password, setPassword] = useState('')
  const [action, setAction] = useState('deposit') // 'deposit' | 'withdraw'

  useEffect(() => {
    if (isOpen) {
      setAmount('')
      setPassword('')
      setRemark('')
      setAction('deposit')
    }
  }, [isOpen])

  if (!isOpen || !user) return null

  const handleSubmit = (type) => {
    const chosenAction = type || action
    if (!amount || Number(amount) <= 0) {
      // basic guard, actual validation can be enhanced
      return
    }
    if (!password) {
      return
    }
    onSubmit?.({
      user,
      amount: Number(amount),
      remark,
      password,
      action: chosenAction,
    })
  }

  const formattedMasterBal = masterBalance?.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  const clientBalance = user.balance ?? 0
  const formattedClientBal = clientBalance.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  return (
    <div className="banking-modal-overlay">
      <div className="banking-modal">
        <div className="banking-modal-header">
          <div className="banking-modal-title">
            Banking - Master Balance: {formattedMasterBal}
          </div>
          <button className="banking-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="banking-modal-user-row">
          <div className="banking-user-badge">
            {user.userType === 'MASTER' ? 'MASTER' : 'USER'}
          </div>
          <div className="banking-user-name">{user.username}</div>
          <div className="banking-client-balance">
            Client Bal : <span>{formattedClientBal}</span>
          </div>
        </div>

        <div className="banking-modal-body">
          <div className="banking-form-group">
            <label>Balance</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="banking-input"
              placeholder=""
            />
          </div>

          <div className="banking-form-group">
            <label>Remark</label>
            <input
              type="text"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="banking-input"
              placeholder=""
            />
          </div>

          <div className="banking-form-group">
            <label>Your Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="banking-input"
              placeholder=""
            />
          </div>
        </div>

        <div className="banking-modal-footer">
          <button
            className="banking-action-btn deposit"
            onClick={() => handleSubmit('deposit')}
          >
            Deposite
          </button>
          <button
            className="banking-action-btn withdraw"
            onClick={() => handleSubmit('withdraw')}
          >
            Withdraw
          </button>
        </div>
      </div>
    </div>
  )
}

export default BankingModal

