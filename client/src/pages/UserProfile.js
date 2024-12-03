// client/src/pages/UserProfile.js
import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useProfile from '../hooks/useProfile';
import { validateProfileForm } from '../utils/validation';
import '../App.css';

const UserProfile = () => {
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const {
    formData,
    isEditing,
    isLoading,
    error,
    validationErrors,
    handleInputChange,
    startEditing,
    cancelEdit,
    handleSubmit,
    loadProfile,
  } = useProfile();

  const initProfile = useCallback(async () => {
    if (!checkAuth()) {
      navigate('/login');
      return;
    }
    loadProfile();
  }, [checkAuth, navigate, loadProfile]);

  useEffect(() => {
    initProfile();
  }, [initProfile]);

  const formFields = [
    { name: 'firstName', label: 'First Name', type: 'text', required: true },
    { name: 'lastName', label: 'Last Name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'phoneNumber', label: 'Phone Number', type: 'tel' },
    { name: 'address', label: 'Address', type: 'text' },
  ];

  const onSubmit = async (e) => {
    e.preventDefault();
    await handleSubmit(validateProfileForm);
  };

  if (isLoading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-content">
        <h2>Profile Settings</h2>

        {error && <div className="error-message">{error}</div>}
        {validationErrors && (
          <div className="error-message">
            {validationErrors.map((err, index) => (
              <div key={index}>{err}</div>
            ))}
          </div>
        )}

        <form onSubmit={onSubmit} className="profile-form">
          <div className="form-section">
            <h3>Personal Information</h3>
            {formFields.map(({ name, label, type, required }) => (
              <div className="form-group" key={name}>
                <label htmlFor={name}>
                  {label}
                  {required && <span className="required">*</span>}
                </label>
                <input
                  type={type}
                  id={name}
                  name={name}
                  value={formData[name]}
                  onChange={(e) => handleInputChange(e.target.name, e.target.value)}
                  disabled={!isEditing}
                  className={`form-input ${!isEditing ? 'disabled' : ''}`}
                  required={required}
                />
              </div>
            ))}
          </div>

          <div className="form-section">
            <h3>Additional Information</h3>
            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange(e.target.name, e.target.value)}
                disabled={!isEditing}
                className={`form-input ${!isEditing ? 'disabled' : ''}`}
                rows="4"
              />
            </div>
          </div>

          {isEditing && (
            <div className="form-section">
              <h3>Change Password</h3>
              <p className="form-note">Leave blank to keep current password</p>
              <div className="form-group">
                <label htmlFor="password">New Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange(e.target.name, e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange(e.target.name, e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          )}

          <div className="form-actions">
            {isEditing ? (
              <>
                <button type="submit" className="btn-save" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={cancelEdit}
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn-edit"
                onClick={startEditing}
              >
                Edit Profile
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfile;
