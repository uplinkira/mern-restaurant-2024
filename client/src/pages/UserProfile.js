import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserProfile, updateUserProfile } from '../redux/slices/userSlice';
import { validateForm } from '../utils/validation';
import './UserProfile.css'; // Optional CSS file for additional styling

const UserProfile = () => {
  const dispatch = useDispatch();
  const { userProfile, status, error } = useSelector((state) => state.user);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!userProfile) {
      dispatch(fetchUserProfile());
    } else {
      setFormData({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        phoneNumber: userProfile.phoneNumber || '',
        email: userProfile.email || '',
        password: '',
        confirmPassword: '',
      });
    }
  }, [dispatch, userProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrorMessage(Object.values(validationErrors).join('. '));
      setIsLoading(false);
      return;
    }

    try {
      const { password, confirmPassword, ...updateData } = formData;
      await dispatch(updateUserProfile(updateData)).unwrap();
      setIsEditing(false);
    } catch (updateError) {
      setErrorMessage(updateError || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return <p>Loading...</p>;
  }

  if (status === 'failed') {
    return <p className="error-message">{error || 'Failed to load user profile.'}</p>;
  }

  return (
    <div className="profile-container">
      <h2>User Profile</h2>
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      <form onSubmit={handleSubmit} className="profile-form">
        {['firstName', 'lastName', 'phoneNumber', 'email'].map((field) => (
          <div className="form-group" key={field}>
            <label htmlFor={field}>
              {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
            </label>
            <input
              type="text"
              id={field}
              name={field}
              value={formData[field]}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
          </div>
        ))}
        {isEditing && (
          <>
            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Leave blank to keep current password"
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
              />
            </div>
          </>
        )}
        <div className="form-actions">
          {isEditing ? (
            <>
              <button type="submit" className="btn-save" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setIsEditing(false)}
                disabled={isLoading}
              >
                Cancel
              </button>
            </>
          ) : (
            <button type="button" className="btn-edit" onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default UserProfile;
