import React, { useState } from 'react'
import { useCreateUserMutation } from '../redux/api/authApi'
import { toast } from 'react-toastify'
import './AddUserModal.css'

function AddUserModal({ isOpen, onClose, onSubmit }) {
  const [createUser, { isLoading }] = useCreateUserMutation();
  const [formData, setFormData] = useState({
    username: '',
    name: '',
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

    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Validate required fields
    if (!formData.username  || !formData.exposureLimit || 
        !formData.creditReference || !formData.password || 
        !formData.masterPassword) {
      toast.error('Please fill all required fields');
      return;
    }

    // Rolling commission is no longer configurable; always send zeros
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

    // Prepare request body
    const requestBody = {
      adminPassword: formData.masterPassword,
      username: formData.username,
      name: formData.name || formData.username,
      password: formData.password,
      commission: parseFloat(formData.commission) || 0,
      // Opening balance: avoid auto-crediting; default to 0 when invalid/empty
      openingBalance: parseFloat(formData.openingBalance) || 0,
      rollingCommission: zeroRollingCommission,
      agentRollingCommission: zeroRollingCommission,
      currency: 'INR',
      exposureLimit: parseFloat(formData.exposureLimit) || 0,
      role: 'user'
    };

    try {
      const result = await createUser(requestBody).unwrap();
      
      if (result.success) {
        toast.success(result.message || 'User created successfully');
        if (onSubmit) {
          onSubmit(result.data);
        }
        handleClose();
      } else {
        toast.error(result.message || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      const errorMessage = error?.data?.message || error?.message || 'Failed to create user';
      toast.error(errorMessage);
    }
  };

  const handleClose = () => {
    setFormData({
      username: '',
      name: '',
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
          <h2 className="modal-title">Add User</h2>
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
          </div>

          <div className="form-row">
            {/* <div className="form-group">
              <label className="form-label">
                Commission(%) <span className="required">*</span>
              </label>
              <input
                type="text"
                name="commission"
                className="form-input"
                placeholder="Commission.."
                value={formData.commission}
                onChange={handleInputChange}
                required
              />
            </div> */}
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

export default AddUserModal
