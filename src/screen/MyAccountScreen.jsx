import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import Navbar from '../component/Navbar'
import './MyAccountScreen.css'
import { userSelector } from '../redux/slices/authReducer'
import AccountStatement from '../component/AccountStatement'
import ActivityLog from '../component/ActivityLog'

function MyAccountScreen() {
  const [activeTab, setActiveTab] = useState('profile');
  const user = useSelector(userSelector);

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <>
            <div className="account-details-header">Account Details</div>
            <div className="account-details-panel">
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
                <span className="detail-value">
                  {user?.rollingCommission ?? 0}
                  <span className="detail-icons">
                    <button className="icon-btn" title="Edit">✏️</button>
                    <button className="icon-btn" title="View">👁️</button>
                  </span>
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Agent Rolling Commission:</span>
                <span className="detail-value">
                  <span className="detail-icons">
                    <button className="icon-btn" title="View">👁️</button>
                  </span>
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Currency:</span>
                <span className="detail-value">{user?.currency || '-'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Partnership:</span>
                <span className="detail-value">{user?.role || '-'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Mobile Number:</span>
                <span className="detail-value">{user?.mobileNumber || 'Not found'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Password:</span>
                <span className="detail-value">
                  ********
                  <span className="detail-icons">
                    <button className="icon-btn" title="Edit">✏️</button>
                  </span>
                </span>
              </div>
            </div>
          </>
        );
      case 'statement':
        return <AccountStatement />;
      case 'activity':
        return <ActivityLog />;
      default:
        return null;
    }
  };

  return (
    <div className="my-account-container">
      <Navbar />
      <div className="my-account-content">
        {/* Left Sidebar */}
        <div className="account-sidebar">
          <div className="sidebar-header">My Account</div>
          <ul className="sidebar-nav">
            <li 
              className={`sidebar-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              My Profile
            </li>
            <li 
              className={`sidebar-nav-item ${activeTab === 'statement' ? 'active' : ''}`}
              onClick={() => setActiveTab('statement')}
            >
              Account Statement
            </li>
            <li 
              className={`sidebar-nav-item ${activeTab === 'activity' ? 'active' : ''}`}
              onClick={() => setActiveTab('activity')}
            >
              Activity Log
            </li>
          </ul>
        </div>

        {/* Right Main Content */}
        <div className="account-main">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export default MyAccountScreen
