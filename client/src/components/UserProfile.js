import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserProfile, updateUserProfile } from '../redux/slices/userSlice';
import { googleLogin } from '../redux/slices/authSlice';
import { GoogleLogin } from '@react-oauth/google'; // Use GIS Google Login

const UserProfile = () => {
  const dispatch = useDispatch();
  const { userProfile = {}, status = 'idle', error = null } = useSelector((state) => state.user || {});
  const [formData, setFormData] = useState({ name: '', bio: '', address: '' });

  // Handle user profile fetch
  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  // Sync user profile data with form state
  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        bio: userProfile.bio || '',
        address: userProfile.address || '',
      });
    }
  }, [userProfile]);

  // Handle profile update submission
  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(updateUserProfile(formData));
  };

  // Handle Google login success
  const handleGoogleSuccess = (credentialResponse) => {
    const tokenId = credentialResponse.credential;
    dispatch(googleLogin(tokenId));  // Dispatch Google login with token
  };

  // Handle Google login failure
  const handleGoogleFailure = () => {
    console.error('Google login failed');
  };

  if (status === 'loading') return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="user-profile">
      <h2>User Profile</h2>

      {/* Google Sign-In Button */}
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleFailure}
        useOneTap
      />

      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div>
          <label>Bio:</label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          />
        </div>
        <div>
          <label>Address:</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>
        <button type="submit">Update Profile</button>
      </form>
    </div>
  );
};

export default UserProfile;
