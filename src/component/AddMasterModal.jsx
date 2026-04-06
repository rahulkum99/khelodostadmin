import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useCreateUserMutation } from '../redux/api/authApi'
import { toast } from 'react-toastify'
import './AddUserModal.css'
import { userSelector } from '../redux/slices/authReducer'

const ROLES = {
  AGENT: 'agent',
  MASTER: 'master',
  SUPER_MASTER: 'super_master',
  ADMIN: 'admin'
};

const ROLE_HIERARCHY = {
  [ROLES.AGENT]: 2,
  [ROLES.MASTER]: 3,
  [ROLES.SUPER_MASTER]: 4,
  [ROLES.ADMIN]: 5
};

const ROLE_OPTIONS = [
  { value: ROLES.AGENT, label: 'Agent' },
  { value: ROLES.MASTER, label: 'Master' },
  { value: ROLES.SUPER_MASTER, label: 'Super Master' },
  { value: ROLES.ADMIN, label: 'Admin' }
];

function AddMasterModal({ isOpen, onClose, onSubmit }) {
  const user = useSelector(userSelector);
  const [createUser, { isLoading }] = useCreateUserMutation();
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    role: ROLES.MASTER,
    commission: '',
    openingBalance: '',
    exposureLimit: '',
    creditReference: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
    masterPassword: ''
  });

  const [passwordVisible, setPasswordVisible] = useState({
    password: false,
    confirmPassword: false,
    masterPassword: false
  });

  const getRoleLevel = (role) => ROLE_HIERARCHY[role] || 0;

  // Map current logged-in user's role to hierarchy level
  const currentUserRoleKey = (() => {
    const role = (user?.role || '').toLowerCase();
    if (role === 'agent') return ROLES.AGENT;
    if (role === 'master') return ROLES.MASTER;
    if (role === 'super_master') return ROLES.SUPER_MASTER;
    if (role === 'admin') return ROLES.ADMIN;
    return null;
  })();

  const currentUserLevel =
    currentUserRoleKey != null ? getRoleLevel(currentUserRoleKey) : Number.POSITIVE_INFINITY;

  // Only allow creating accounts strictly below the current user's hierarchy level
  const allowedRoleValues = ROLE_OPTIONS
    .map((opt) => opt.value)
    .filter((role) => {
      const level = getRoleLevel(role);
      return level > 0 && level < currentUserLevel;
    });

  // Ensure the selected role is always within the allowed options
  useEffect(() => {
    if (!allowedRoleValues.length) return;
    if (!allowedRoleValues.includes(formData.role)) {
      setFormData((prev) => ({
        ...prev,
        role: allowedRoleValues[0]
      }));
    }
  }, [allowedRoleValues, formData.role]);

  const togglePasswordVisibility = (field) => {
    setPasswordVisible(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!formData.username || !formData.exposureLimit ||
        !formData.creditReference  || !formData.password ||
        !formData.masterPassword) {
      toast.error('Please fill all required fields');
      return;
    }

    const zeroRollingCommission = {
      fancy: 0,
      matka: 0,
      casino: 0,
      binary: 0,
      sportbook: 0,
      line: 0,
      bookmaker: 0,
      virtualSports: 0,
      cricket: 0,
      tennis: 0,
      soccer: 0
    };

    const requestBody = {
      adminPassword: formData.masterPassword,
      username: formData.username,
      name: formData.name || formData.username,
      password: formData.password,
      commission: parseFloat(formData.commission) || 0,
      openingBalance: parseFloat(formData.openingBalance) || 0,
      rollingCommission: zeroRollingCommission,
      agentRollingCommission: zeroRollingCommission,
      currency: 'INR',
      exposureLimit: parseFloat(formData.exposureLimit) || 0,
      role: formData.role || ROLES.MASTER
    };

    try {
      const result = await createUser(requestBody).unwrap();

      if (result.success) {
        toast.success(result.message || 'Master created successfully');
        if (onSubmit) {
          onSubmit(result.data);
        }
        handleClose();
      } else {
        toast.error(result.message || 'Failed to create master');
      }
    } catch (error) {
      console.error('Error creating master:', error);
      const errorMessage = error?.data?.message || error?.message || 'Failed to create master';
      toast.error(errorMessage);
    }
  };

  const handleClose = () => {
    setFormData({
      username: '',
      name: '',
      role: ROLES.MASTER,
      commission: '',
      openingBalance: '',
      exposureLimit: '',
      creditReference: '',
      mobileNumber: '',
      password: '',
      confirmPassword: '',
      masterPassword: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-backdrop" onClick={handleClose}></div>
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="modal-title">Add Master</h2>
          <button className="modal-close-btn" onClick={handleClose}>×</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Username <span className="required">*</span>
              </label>
              <input
                type="text"
                name="username"
                className="form-input"
                placeholder="Username.."
                value={formData.username}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                type="text"
                name="name"
                className="form-input"
                placeholder="Name.."
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Account Type
              </label>
              <select
                name="role"
                className="form-input"
                value={formData.role}
                onChange={handleInputChange}
              >
                {allowedRoleValues.map((role) => {
                  const option = ROLE_OPTIONS.find((opt) => opt.value === role);
                  if (!option) return null;
                  return (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Mobile Number 
              </label>
              <input
                type="text"
                name="mobileNumber"
                className="form-input"
                placeholder="Mobile Number.."
                value={formData.mobileNumber}
                onChange={handleInputChange}
                optional
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Opening Balance <span className="required">*</span>
              </label>
              <input
                type="text"
                name="openingBalance"
                className="form-input"
                placeholder="Opening Balance.."
                value={formData.openingBalance}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Exposure Limit <span className="required">*</span>
              </label>
              <input
                type="text"
                name="exposureLimit"
                className="form-input"
                placeholder="Exposure Limit"
                value={formData.exposureLimit}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Credit Reference <span className="required">*</span>
              </label>
              <input
                type="text"
                name="creditReference"
                className="form-input"
                placeholder="Credit Reference.."
                value={formData.creditReference}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Password <span className="required">*</span>
              </label>
              <div className="password-input-wrapper">
                <input
                  type={passwordVisible.password ? 'text' : 'password'}
                  name="password"
                  className="form-input"
                  placeholder="Password.."
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => togglePasswordVisibility('password')}
                >
                  {passwordVisible.password ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">
                Confirm Password <span className="required">*</span>
              </label>
              <div className="password-input-wrapper">
                <input
                  type={passwordVisible.confirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  className="form-input"
                  placeholder="Confirm Password.."
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                >
                  {passwordVisible.confirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          </div>

          <div className="form-divider"></div>

          <div className="form-row master-password-row">
            <div className="form-group">
              <label className="form-label">
                Master Password <span className="required">*</span>
              </label>
              <div className="password-input-wrapper">
                <input
                  type={passwordVisible.masterPassword ? 'text' : 'password'}
                  name="masterPassword"
                  className="form-input"
                  placeholder="Master Password.."
                  value={formData.masterPassword}
                  onChange={handleInputChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => togglePasswordVisibility('masterPassword')}
                >
                  {passwordVisible.masterPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="submit" className="create-btn" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

export default AddMasterModal

