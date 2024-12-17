// client/src/pages/UserProfile.js
import React from 'react';
import useProfile from '../hooks/useProfile';
import { Button, TextField, Paper, Typography, Box, CircularProgress } from '@mui/material';
import '../App.css';

const UserProfile = () => {
  const {
    profile,
    formData,
    handleInputChange,
    handleSubmit,
    isEditing,
    startEditing,
    cancelEditing,
    status,
    error,
    validationErrors
  } = useProfile();

  if (status === 'loading' && !profile) {
    return (
      <div className="profile-loading">
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-error">
        <Typography variant="h6">{error}</Typography>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <Typography variant="h4" component="h1">Profile Settings</Typography>
        <Typography variant="body1" color="textSecondary">
          Manage your personal information
        </Typography>
      </div>
      
      <Paper elevation={3} className="profile-section">
        <form onSubmit={handleSubmit} className="profile-form">
          <TextField
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            disabled={!isEditing}
            error={!!validationErrors?.firstName}
            helperText={validationErrors?.firstName}
            fullWidth
          />
          
          <TextField
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            disabled={!isEditing}
            error={!!validationErrors?.lastName}
            helperText={validationErrors?.lastName}
            fullWidth
          />
          
          <TextField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            disabled={!isEditing}
            error={!!validationErrors?.email}
            helperText={validationErrors?.email}
            fullWidth
          />
          
          <TextField
            label="Phone Number"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            disabled={!isEditing}
            error={!!validationErrors?.phoneNumber}
            helperText={validationErrors?.phoneNumber}
            fullWidth
          />
          
          <TextField
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            disabled={!isEditing}
            multiline
            rows={2}
            fullWidth
          />
          
          <TextField
            label="Bio"
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            disabled={!isEditing}
            multiline
            rows={3}
            fullWidth
          />

          <div className="profile-actions">
            {!isEditing ? (
              <Button
                variant="contained"
                color="primary"
                onClick={startEditing}
                className="edit-button"
              >
                Edit Profile
              </Button>
            ) : (
              <>
                <Button
                  variant="outlined"
                  onClick={cancelEditing}
                  className="cancel-button"
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={status === 'loading'}
                  className="save-button"
                >
                  {status === 'loading' ? <CircularProgress size={24} /> : 'Save Changes'}
                </Button>
              </>
            )}
          </div>
        </form>
      </Paper>
    </div>
  );
};

export default UserProfile;
