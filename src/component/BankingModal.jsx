import React, { useState, useEffect } from 'react'
import { useWalletHierarchyDepositMutation, useWalletHierarchyWithdrawMutation } from '../redux/api/authApi'
import './BankingModal.css'

function BankingModal({ isOpen, onClose, user, masterBalance = 0, onSubmit }) {
  const [amount, setAmount] = useState('')
  const [remark, setRemark] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const [deposit, { isLoading: isDepositing }] = useWalletHierarchyDepositMutation()
  const [withdraw, { isLoading: isWithdrawing }] = useWalletHierarchyWithdrawMutation()

  const isSubmitting = isDepositing || isWithdrawing

  useEffect(() => {
    if (isOpen) {
      setAmount('')
      setPassword('')
      setRemark('')
      setError('')
    }
  }, [isOpen])

  if (!isOpen || !user) return null

  const handleSubmit = async (type) => {
    setError('')
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid amount.')
      return
    }
    if (!password) {
      setError('Please enter your password.')
      return
    }
    const userId = user.id
    const payload = {
      userId,
      amount: Number(amount),
      description: remark || '',
      adminPassword: password,
    }
    try {
      let response
      if (type === 'deposit') {
        response = await deposit(payload).unwrap()
      } else {
        response = await withdraw(payload).unwrap()
      }
      onSubmit?.({
        user,
        amount: Number(amount),
        remark,
        password,
        action: type,
        response,
      })
      onClose?.()
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Operation failed.')
    }
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

        {error && (
          <div className="banking-modal-error">{error}</div>
        )}
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
            disabled={isSubmitting}
          >
            {isDepositing ? 'Depositing...' : 'Deposit'}
          </button>
          <button
            className="banking-action-btn withdraw"
            onClick={() => handleSubmit('withdraw')}
            disabled={isSubmitting}
          >
            {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default BankingModal

