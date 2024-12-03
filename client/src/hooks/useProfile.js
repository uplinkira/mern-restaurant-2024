import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchUserProfile,
  updateUserProfile,
  selectUserProfile,
  selectUserStatus,
  selectUserError,
  selectValidationErrors,
  setIsEditing,
  updateProfileField,
  cancelEditing,
} from '../redux/slices/userSlice';

const useProfile = () => {
  const dispatch = useDispatch();
  const profile = useSelector(selectUserProfile);
  const status = useSelector(selectUserStatus);
  const error = useSelector(selectUserError);
  const validationErrors = useSelector(selectValidationErrors);
  const isEditing = useSelector((state) => state.user.isEditing);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: '',
    bio: '',
    password: '',
    confirmPassword: '',
  });

  const [successMessage, setSuccessMessage] = useState('');
  const [validationErrorsLocal, setValidationErrors] = useState([]);

  // Define loadProfile before using it
  const loadProfile = useCallback(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  // Load profile data when the component mounts
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Update formData when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phoneNumber: profile.phoneNumber || '',
        address: profile.address || '',
        bio: profile.bio || '',
        password: '',
        confirmPassword: '',
      });
    }
  }, [profile]);

  const handleInputChange = (name, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    if (isEditing) {
      dispatch(updateProfileField({ [name]: value }));
    }
  };

  const startEditing = () => {
    dispatch(setIsEditing(true));
  };

  const cancelEdit = () => {
    dispatch(cancelEditing());
    setSuccessMessage('');
    setValidationErrors([]);
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phoneNumber: profile.phoneNumber || '',
        address: profile.address || '',
        bio: profile.bio || '',
        password: '',
        confirmPassword: '',
      });
    }
  };

  const handleSubmit = async (validate) => {
    const errors = validate(formData);
    if (errors && errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    const resultAction = await dispatch(updateUserProfile(formData));
    if (updateUserProfile.fulfilled.match(resultAction)) {
      // Success handling
      setSuccessMessage('Profile updated successfully');
      setValidationErrors([]);
      dispatch(setIsEditing(false));
    } else {
      // Error handling
      setSuccessMessage('');
      setValidationErrors(resultAction.payload.validationErrors || []);
    }
  };

  return {
    formData,
    isEditing,
    isLoading: status === 'loading',
    error,
    validationErrors: validationErrorsLocal.length > 0 ? validationErrorsLocal : validationErrors,
    successMessage,
    handleInputChange,
    startEditing,
    cancelEdit,
    handleSubmit,
    loadProfile,
  };
};

export default useProfile;
