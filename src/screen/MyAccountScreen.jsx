import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import Navbar from '../component/Navbar'
import './MyAccountScreen.css'
import { userSelector } from '../redux/slices/authReducer'
import AccountStatement from '../component/AccountStatement'
import ActivityLog from '../component/ActivityLog'
import { useChangePasswordMutation } from '../redux/api/authApi'
import { toast } from 'react-toastify'
import { FaRegEdit } from "react-icons/fa";
import { FaEye } from "react-icons/fa";
import { FaEyeSlash } from "react-icons/fa";

function MyAccountScreen() {
  const [activeTab, setActiveTab] = useState('profile');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const user = useSelector(userSelector);
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();

  // Helper function to format rolling commission object
  const formatRollingCommission = (rollingCommission) => {
    if (!rollingCommission || typeof rollingCommission !== 'object') {
      return 'Not set';
    }
    // Count non-zero values or show summary
    const entries = Object.entries(rollingCommission).filter(([_, value]) => value !== 0 && value !== '0');
    if (entries.length === 0) {
      return 'Not configured';
    }
    // Show first few entries as summary
    return `${entries.length} category${entries.length > 1 ? 'ies' : 'y'} configured`;
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Please fill all fields');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    try {
      const result = await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      }).unwrap();

      if (result.success) {
        toast.success(result.message || 'Password changed successfully');
        setShowPasswordModal(false);
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        toast.error(result.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      const errorMessage = error?.data?.message || error?.message || 'Failed to change password';
      toast.error(errorMessage);
    }
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

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
              {/* <div className="detail-row">
                <span className="detail-label">Commission:</span>
                <span className="detail-value">{user?.commission ?? 0}</span>
              </div> */}
              {/* <div className="detail-row">
                <span className="detail-label">Rolling Commission:</span>
                <span className="detail-value">
                  {formatRollingCommission(user?.rollingCommission)}
                  <span className="detail-icons">
                    <button className="icon-btn" title="Edit">
                      <FaRegEdit size={16} />
                    </button>
                    <button className="icon-btn" title="View">
                      <FaEye size={16} />
                    </button>
                  </span>
                </span>
              </div> */}
              {/* <div className="detail-row">
                <span className="detail-label">Agent Rolling Commission:</span>
                <span className="detail-value">
                  {formatRollingCommission(user?.agentRollingCommission)}
                  <span className="detail-icons">
                    <button className="icon-btn" title="View">
                      <FaEye size={16} />
                    </button>
                  </span>
                </span>
              </div> */}
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
                    <button 
                      className="icon-btn" 
                      title="Change Password"
                      onClick={() => setShowPasswordModal(true)}
                    >
                      <FaRegEdit size={16} />
                    </button>
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

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="password-modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="password-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="password-modal-header">
              <h2>Change Password</h2>
              <button 
                className="password-modal-close"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handlePasswordChange} className="password-modal-form">
              <div className="password-form-group">
                <label className="password-form-label">Current Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    name="currentPassword"
                    className="password-form-input"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                  >
                    {showPasswords.current ? <FaEye size={16} /> : <FaEyeSlash size={16} />}
                  </button>
                </div>
              </div>

              <div className="password-form-group">
                <label className="password-form-label">New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    name="newPassword"
                    className="password-form-input"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  >
                    {showPasswords.new ? <FaEye size={16} /> : <FaEyeSlash size={16} />}
                  </button>
                </div>
              </div>

              <div className="password-form-group">
                <label className="password-form-label">Confirm New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    name="confirmPassword"
                    className="password-form-input"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  >
                    {showPasswords.confirm ? <FaEye size={16} /> : <FaEyeSlash size={16} />}
                  </button>
                </div>
              </div>

              <div className="password-modal-actions">
                <button
                  type="button"
                  className="password-modal-cancel"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordForm({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="password-modal-submit"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyAccountScreen
