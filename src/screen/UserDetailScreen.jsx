import React, { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import Navbar from '../component/Navbar'
import AccountStatement from '../component/AccountStatement'
import UserActivityLog from '../component/UserActivityLog'
import UserBetHistory from '../component/UserBetHistory'
import './MyAccountScreen.css'

const SIDE_MENU_TABS = [
  { id: 'profile', label: 'User Profile' },
  { id: 'bet-history', label: 'Bet History' },
  { id: 'profit-loss', label: 'Profit & Loss' },
  { id: 'statement', label: 'Account Statement' },
  { id: 'activity', label: 'Activity Log' },
]

function UserDetailScreen() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const user = location.state?.user
  const [activeTab, setActiveTab] = useState('profile')

  const formatRollingCommission = (rollingCommission) => {
    if (!rollingCommission || typeof rollingCommission !== 'object') {
      return 'Not set'
    }
    const entries = Object.entries(rollingCommission).filter(([_, value]) => value !== 0 && value !== '0')
    if (entries.length === 0) {
      return 'Not configured'
    }
    return `${entries.length} category${entries.length > 1 ? 'ies' : 'y'} configured`
  }

  if (!user) {
    return (
      <div className="my-account-container">
        <Navbar />
        <div className="my-account-content">
          <div className="account-main" style={{ padding: '40px' }}>
            <div className="account-details-header">User not found</div>
            <div className="account-details-panel">
              <p style={{ color: '#666', marginBottom: '16px' }}>
                No user data available. You may have arrived here directly without selecting a user.
              </p>
              <button
                type="button"
                className="password-modal-submit"
                onClick={() => navigate('/downline-userlist')}
              >
                Back to User List
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderProfileContent = () => (
    <>
      <div className="account-details-header">Account Details</div>
      <div className="account-details-panel">
        <div className="detail-row">
          <span className="detail-label">Username:</span>
          <span className="detail-value">{user?.username || '-'}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Name:</span>
          <span className="detail-value">{user?.name || user?.username || '-'}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Commission:</span>
          <span className="detail-value">{user?.commission ?? 0}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Rolling Commission:</span>
          <span className="detail-value">{formatRollingCommission(user?.rollingCommission)}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Agent Rolling Commission:</span>
          <span className="detail-value">{formatRollingCommission(user?.agentRollingCommission)}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Currency:</span>
          <span className="detail-value">{user?.currency || '-'}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Partnership / Role:</span>
          <span className="detail-value">{user?.role || '-'}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Mobile Number:</span>
          <span className="detail-value">{user?.mobileNumber || 'Not found'}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Status:</span>
          <span className="detail-value">
            <span className={`status-badge ${user?.isActive ? 'active' : ''}`} style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '4px', fontSize: '13px', backgroundColor: user?.isActive ? '#d4edda' : '#f8d7da', color: user?.isActive ? '#155724' : '#721c24' }}>
              {user?.isActive ? 'Active' : 'Inactive'}
            </span>
          </span>
        </div>
        {user?.exposureLimit != null && (
          <div className="detail-row">
            <span className="detail-label">Exposure Limit:</span>
            <span className="detail-value">{user.exposureLimit}</span>
          </div>
        )}
      </div>
    </>
  )

  const renderPlaceholderPanel = (title, description) => (
    <>
      <div className="account-details-header">{title}</div>
      <div className="account-details-panel">
        <p style={{ color: '#666', margin: 0 }}>
          {description}
        </p>
      </div>
    </>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileContent()
      case 'bet-history':
        return (
          <UserBetHistory
            userId={user?._id || userId}
            username={user?.username || user?.name}
          />
        )
      case 'profit-loss':
        return renderPlaceholderPanel('Profit & Loss', `Profit & loss report for ${user?.username || 'this user'} will be displayed here.`)
      case 'statement':
        return <AccountStatement userId={user?._id || userId} />
      case 'activity':
        return (
          <UserActivityLog
            userId={user?._id || userId}
            username={user?.username || user?.name}
          />
        )
      default:
        return renderProfileContent()
    }
  }

  return (
    <div className="my-account-container">
      <Navbar />
      <div className="my-account-content">
        <div className="account-sidebar">
          <div className="sidebar-header">User Detail</div>
          <ul className="sidebar-nav">
            {SIDE_MENU_TABS.map((tab) => (
              <li
                key={tab.id}
                className={`sidebar-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </li>
            ))}
          </ul>
          <div style={{ padding: '15px 20px', borderTop: '1px solid #e9ecef' }}>
            <button
              type="button"
              className="password-modal-cancel"
              style={{ width: '100%' }}
              onClick={() => navigate(-1)}
            >
              ← Back to List
            </button>
          </div>
        </div>

        <div className="account-main">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export default UserDetailScreen
