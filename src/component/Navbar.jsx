import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { userSelector, clearCredentials } from '../redux/slices/authReducer'
import { useGetWalletBalanceQuery, useAddAmountToWalletMutation } from '../redux/api/authApi'
import { toast } from 'react-toastify'
import './Navbar.css'

function Navbar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(userSelector)
  const [logoImageError, setLogoImageError] = useState(false)
  const [showAddBalanceModal, setShowAddBalanceModal] = useState(false)
  const [addBalanceForm, setAddBalanceForm] = useState({
    amount: '',
    description: ''
  })
  const [openDropdowns, setOpenDropdowns] = useState({
    downlineList: false,
    myReports: false,
    banking: false,
    commission: false
  })

  const { data: walletData, refetch: refetchWallet } = useGetWalletBalanceQuery(undefined, { skip: !user })
  const walletBalance = walletData?.data?.balance
  const [addAmountToWallet, { isLoading: isAddingBalance }] = useAddAmountToWalletMutation()

  const handleDropdownToggle = (dropdownName, isOpen) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [dropdownName]: isOpen
    }))
  }

  const handleDropdownClick = (dropdownName) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [dropdownName]: !prev[dropdownName]
    }))
  }

  const handleRefresh = () => {
    refetchWallet()
  }

  const displayBalance = (walletBalance != null ? Number(walletBalance) : (user?.balance != null ? Number(user.balance) : 0)).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  const displayUsername = user?.username || user?.name || 'User'

  // Map API role to display label (from login response user.role)
  const roleLabel = (() => {
    const role = (user?.role || '').toLowerCase()
    if (role === 'super_admin') return 'SUPER'
    if (role === 'admin') return 'ADMIN'
    if (role === 'agent') return 'AGENT'
    if (role === 'user') return 'USER'
    return (user?.role || 'USER').toUpperCase()
  })()

  const isSuperAdmin = (user?.role || '').toLowerCase() === 'super_admin'

  const handleLogout = (e) => {
    e.preventDefault()
    dispatch(clearCredentials())
    navigate('/')
  }

  const openAddBalanceModal = () => setShowAddBalanceModal(true)
  const closeAddBalanceModal = () => {
    setShowAddBalanceModal(false)
    setAddBalanceForm({ amount: '', description: '' })
  }

  const handleAddBalanceSubmit = async (e) => {
    e.preventDefault()
    const amount = parseFloat(addBalanceForm.amount)
    if (!Number.isFinite(amount) || amount < 0.01 || amount > 9999999999) {
      toast.error('Amount must be between 0.01 and 9999999999')
      return
    }
    if (addBalanceForm.description?.length > 500) {
      toast.error('Description must be 500 characters or less')
      return
    }
    try {
      const result = await addAmountToWallet({
        amount,
        description: addBalanceForm.description?.trim() || undefined
      }).unwrap()
      if (result.success) {
        toast.success(result.message || 'Amount added successfully')
        closeAddBalanceModal()
      } else {
        toast.error(result.message || 'Failed to add amount')
      }
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Failed to add amount'
      toast.error(msg)
    }
  }

  return (
    <>
      {/* Top bar - dark green, logo left / user info right */}
      <nav className="navbar-top py-2">
        <Link className="navbar-brand" to="/dashboard">
          {!logoImageError ? (
            <img src="/images/logo.png" alt="Logo" width={150} height={50} onError={() => setLogoImageError(true)} />
          ) : (
            <span className="navbar-brand-logo-text">Kung</span>
          )}
        </Link>
        <div className="navbar-user-section">
          <div className="navbar-user-row navbar-user-row-1">
            <span className="user-pill">{roleLabel}</span>
            <span className="user-username">{displayUsername}</span>
          </div>
          <div className="navbar-user-row navbar-user-row-2">
            <span className="user-balance">{displayBalance}</span>
            {isSuperAdmin && (
              <button
                type="button"
                className="user-add-balance-btn"
                onClick={openAddBalanceModal}
                title="Add balance"
                aria-label="Add balance"
              >
                <span className="user-add-balance-text">Add balance</span>
                <span className="user-add-balance-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </span>
              </button>
            )}
            <button
              type="button"
              className="user-refresh-btn"
              onClick={handleRefresh}
              title="Refresh"
              aria-label="Refresh"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Links bar - horizontally scrollable on mobile */}
      <nav className="navbar navbarlink py-0 px-3">
        <div className="navbarlink-scroll container-fluid">
          <ul className="navbar-nav me-auto mb-0 flex-nowrap">
              <li className="nav-item">
                <Link className="nav-link active" to="/dashboard">Dashboard</Link>
              </li>
              <li
                className={`nav-item dropdown ${openDropdowns.downlineList ? 'show' : ''}`}
                onMouseEnter={() => handleDropdownToggle('downlineList', true)}
                onMouseLeave={() => handleDropdownToggle('downlineList', false)}
              >
                <span
                  className="nav-link dropdown-toggle"
                  role="button"
                  aria-expanded={openDropdowns.downlineList}
                  onClick={(e) => { e.preventDefault(); handleDropdownClick('downlineList') }}
                >
                  Downline List
                </span>
                <ul className={`dropdown-menu ${openDropdowns.downlineList ? 'show' : ''}`}>
                  <li><Link className="dropdown-item" to="/downline-userlist">User Downline List</Link></li>
                  <li><Link className="dropdown-item" to="/downline-masterlist">Master Downline List</Link></li>
                </ul>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/my-account">My Account</Link>
              </li>
              <li
                className={`nav-item dropdown ${openDropdowns.myReports ? 'show' : ''}`}
                onMouseEnter={() => handleDropdownToggle('myReports', true)}
                onMouseLeave={() => handleDropdownToggle('myReports', false)}
              >
                <span
                  className="nav-link dropdown-toggle"
                  role="button"
                  aria-expanded={openDropdowns.myReports}
                  onClick={(e) => { e.preventDefault(); handleDropdownClick('myReports') }}
                >
                  My Reports
                </span>
                <ul className={`dropdown-menu ${openDropdowns.myReports ? 'show' : ''}`}>
                  <li><Link className="dropdown-item" to="/report-event">User Profit/Loss Report</Link></li>
                  <li><Link className="dropdown-item" to="/report-downline">Downline Profit/Loss Report</Link></li>
                </ul>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/betlist">Betlist</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/market-analysis">Market Analysis</Link>
              </li>
              <li
                className={`nav-item dropdown ${openDropdowns.banking ? 'show' : ''}`}
                onMouseEnter={() => handleDropdownToggle('banking', true)}
                onMouseLeave={() => handleDropdownToggle('banking', false)}
              >
                <span
                  className="nav-link dropdown-toggle"
                  role="button"
                  aria-expanded={openDropdowns.banking}
                  onClick={(e) => { e.preventDefault(); handleDropdownClick('banking') }}
                >
                  Banking
                </span>
                <ul className={`dropdown-menu ${openDropdowns.banking ? 'show' : ''}`}>
                  <li><Link className="dropdown-item" to="/banking-user">User banking</Link></li>
                  <li><Link className="dropdown-item" to="/banking-master">Master Banking</Link></li>
                </ul>
              </li>
              <li
                className={`nav-item dropdown ${openDropdowns.commission ? 'show' : ''}`}
                onMouseEnter={() => handleDropdownToggle('commission', true)}
                onMouseLeave={() => handleDropdownToggle('commission', false)}
              >
                <span
                  className="nav-link dropdown-toggle"
                  role="button"
                  aria-expanded={openDropdowns.commission}
                  onClick={(e) => { e.preventDefault(); handleDropdownClick('commission') }}
                >
                  Commission
                </span>
                <ul className={`dropdown-menu ${openDropdowns.commission ? 'show' : ''}`}>
                  <li><Link className="dropdown-item" to="/commission-user">User Commission</Link></li>
                  <li><Link className="dropdown-item" to="/commission-agent">Agent Commission</Link></li>
                </ul>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/wallet-history">Wallet History</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/password-history">Password History</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/restore-user">Restore User</Link>
              </li>
            </ul>
            <ul className="navbar-nav ms-auto mb-0 flex-nowrap navbarlink-logout">
              <li className="nav-item">
                <Link className="nav-link" to="/" onClick={handleLogout}>
                  Logout
                </Link>
              </li>
            </ul>
        </div>
      </nav>

      {/* Add Balance Modal - Super Admin only */}
      {showAddBalanceModal && (
        <div className="add-balance-modal-overlay" onClick={closeAddBalanceModal}>
          <div className="add-balance-modal" onClick={(e) => e.stopPropagation()}>
            <div className="add-balance-modal-header">
              <h2>Add amount to wallet</h2>
              <button type="button" className="add-balance-modal-close" onClick={closeAddBalanceModal} aria-label="Close">
                ×
              </button>
            </div>
            <form onSubmit={handleAddBalanceSubmit} className="add-balance-modal-form">
              <div className="add-balance-form-group">
                <label className="add-balance-label">Amount</label>
                <input
                  type="number"
                  className="add-balance-input"
                  min="0.01"
                  max="9999999999"
                  step="0.01"
                  placeholder="0.00"
                  value={addBalanceForm.amount}
                  onChange={(e) => setAddBalanceForm((p) => ({ ...p, amount: e.target.value }))}
                  required
                />
              </div>
              <div className="add-balance-form-group">
                <label className="add-balance-label">Description (optional, max 500)</label>
                <textarea
                  className="add-balance-input add-balance-textarea"
                  placeholder="e.g. Bonus credit"
                  maxLength={500}
                  value={addBalanceForm.description}
                  onChange={(e) => setAddBalanceForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="add-balance-modal-actions">
                <button type="button" className="add-balance-btn-cancel" onClick={closeAddBalanceModal}>
                  Cancel
                </button>
                <button type="submit" className="add-balance-btn-submit" disabled={isAddingBalance}>
                  {isAddingBalance ? 'Adding...' : 'Add amount'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar
