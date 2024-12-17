import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchUserProfile,
  updateUserProfile,
  setIsEditing
} from '../redux/slices/userSlice';
import { validateProfileForm } from '../utils/validation';
import api from '../utils/config';

const useProfile = () => {
  const dispatch = useDispatch();
  const {
    profile,
    status,
    error,
    validationErrors,
    isEditing
  } = useSelector((state) => state.user);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: '',
    bio: ''
  });

  // Load profile data only once when component mounts
  useEffect(() => {
    if (!profile && status !== 'loading') {
      dispatch(fetchUserProfile());
    }
  }, [dispatch, profile, status]);

  // Update form data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phoneNumber: profile.phoneNumber || '',
        address: profile.address || '',
        bio: profile.bio || ''
      });
    }
  }, [profile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const startEditing = () => {
    dispatch(setIsEditing(true));
  };

  const cancelEditing = () => {
    dispatch(setIsEditing(false));
    // Reset form data to current profile
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phoneNumber: profile.phoneNumber || '',
        address: profile.address || '',
        bio: profile.bio || ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateProfileForm(formData);
    if (errors) {
      // Handle validation errors
      return;
    }

    try {
      await dispatch(updateUserProfile(formData)).unwrap();
      dispatch(setIsEditing(false));
      // No need to fetch profile again as we already have the updated data
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  // 获取用户信息
  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  };

  // 更新用户信息
  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  return {
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
  };
};

export default useProfile;
