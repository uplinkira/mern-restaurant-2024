import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
 fetchUserProfile,
 updateUserProfile,
 setIsEditing,
 cancelEditing,
 selectUserProfile,
 selectUserStatus,
 selectUserError,
 selectIsEditing,
 selectValidationErrors,
 selectIsDirty
} from '../redux/slices/userSlice';

const useProfile = () => {
 const dispatch = useDispatch();
 
 const profile = useSelector(selectUserProfile);
 const status = useSelector(selectUserStatus);
 const error = useSelector(selectUserError);
 const isEditing = useSelector(selectIsEditing);
 const validationErrors = useSelector(selectValidationErrors);
 const isDirty = useSelector(selectIsDirty);

 const [formData, setFormData] = useState({
   firstName: '',
   lastName: '',
   phoneNumber: '',
   email: '',
   password: '',
   confirmPassword: '',
   bio: '',
   address: ''
 });
 const [localErrors, setLocalErrors] = useState({});
 const [successMessage, setSuccessMessage] = useState('');

 useEffect(() => {
   if (profile) {
     setFormData(current => ({
       ...current,
       firstName: profile.firstName || '',
       lastName: profile.lastName || '',
       phoneNumber: profile.phoneNumber || '',
       email: profile.email || '',
       bio: profile.bio || '',
       address: profile.address || '',
       password: current.password || '',
       confirmPassword: current.confirmPassword || ''
     }));
   }
 }, [profile]);

 const handleInputChange = useCallback((name, value) => {
   setFormData(prev => ({ ...prev, [name]: value }));
   setLocalErrors(prev => ({ ...prev, [name]: null }));
   setSuccessMessage('');
 }, []);

 const startEditing = useCallback(() => {
   if (profile) {
     setFormData({
       firstName: profile.firstName || '',
       lastName: profile.lastName || '',
       phoneNumber: profile.phoneNumber || '',
       email: profile.email || '',
       bio: profile.bio || '',
       address: profile.address || '',
       password: '',
       confirmPassword: ''
     });
   }
   dispatch(setIsEditing(true));
   setLocalErrors({});
   setSuccessMessage('');
 }, [dispatch, profile]);

 const cancelEdit = useCallback(() => {
   if (profile) {
     setFormData({
       firstName: profile.firstName || '',
       lastName: profile.lastName || '',
       phoneNumber: profile.phoneNumber || '',
       email: profile.email || '',
       bio: profile.bio || '',
       address: profile.address || '',
       password: '',
       confirmPassword: ''
     });
   }
   dispatch(cancelEditing());
   setLocalErrors({});
   setSuccessMessage('');
 }, [dispatch, profile]);

 const handleSubmit = useCallback(async (validationFn) => {
   if (!isEditing) return false;

   const errors = validationFn?.(formData) || {};
   if (Object.keys(errors).length > 0) {
     setLocalErrors(errors);
     return false;
   }

   const updateData = {
     ...formData,
     ...(formData.password ? {
       password: formData.password,
       confirmPassword: formData.confirmPassword
     } : {})
   };

   try {
     await dispatch(updateUserProfile(updateData)).unwrap();
     await dispatch(fetchUserProfile()).unwrap();
     dispatch(setIsEditing(false));
     setSuccessMessage('Profile updated successfully');
     return true;
   } catch (error) {
     console.error('Profile update error:', error);
     setLocalErrors({ submit: error.message || 'Update failed' });
     return false;
   }
 }, [dispatch, formData, isEditing]);

 const loadProfile = useCallback(async () => {
   try {
     const result = await dispatch(fetchUserProfile()).unwrap();
     if (result) {
       setFormData({
         firstName: result.firstName || '',
         lastName: result.lastName || '',
         phoneNumber: result.phoneNumber || '',
         email: result.email || '',
         bio: result.bio || '',
         address: result.address || '',
         password: '',
         confirmPassword: ''
       });
     }
     return true;
   } catch (error) {
     console.error('Profile load error:', error);
     setLocalErrors({ load: error.message || 'Failed to load profile' });
     return false;
   }
 }, [dispatch]);

 return {
   profile,
   formData,
   isEditing,
   isLoading: status === 'loading',
   error: error || localErrors.submit || localErrors.load,
   validationErrors: { ...validationErrors, ...localErrors },
   successMessage,
   isDirty,
   handleInputChange,
   startEditing,
   cancelEdit,
   handleSubmit,
   loadProfile
 };
};

export default useProfile;