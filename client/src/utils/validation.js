// client/src/utils/validation.js
// Profile form validation
export const validateProfileForm = (formData) => {
  const errors = {};

  // Validate email
  if (!validateEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Validate phone number (if provided)
  if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
    errors.phoneNumber = 'Please provide a valid international phone number';
  }

  // Validate first name and last name
  if (!formData.firstName || formData.firstName.trim() === '') {
    errors.firstName = 'First name is required';
  }
  if (!formData.lastName || formData.lastName.trim() === '') {
    errors.lastName = 'Last name is required';
  }

  // Validate password (only if editing)
  if (formData.password && !validatePassword(formData.password)) {
    errors.password = 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character';
  }

  // Confirm password (only if editing)
  if (formData.password && formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
};

// Existing exports
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

export const validatePassword = (password) => {
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
  return re.test(password);
};

export const validateUsername = (username) => {
  return username.trim().length > 0;
};

export const validatePhoneNumber = (phoneNumber) => {
  const re = /^\+?[1-9]\d{1,14}$/;
  return re.test(phoneNumber);
};

export const validateForm = (formData) => {
  const errors = {};

  if (!validateEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!validatePassword(formData.password)) {
    errors.password = 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character';
  }

  if (!validateUsername(formData.username)) {
    errors.username = 'Username is required';
  }

  if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
    errors.phoneNumber = 'Please provide a valid international phone number';
  }

  if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
};

export const validateLoginForm = (formData) => {
  const errors = {};

  if (!validateEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!formData.password) {
    errors.password = 'Password is required';
  }

  return errors;
};

export const validateRegisterForm = (formData) => {
  const errors = validateForm(formData);

  if (!formData.firstName) {
    errors.firstName = 'First name is required';
  }

  if (!formData.lastName) {
    errors.lastName = 'Last name is required';
  }

  return errors;
};
