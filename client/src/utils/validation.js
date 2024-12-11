// client/src/utils/validation.js
// Profile form validation
export const validateProfileForm = (formData) => {
  const errors = {};

  // Validate required fields
  if (!formData.firstName?.trim()) {
    errors.firstName = 'First name is required';
  }
  if (!formData.lastName?.trim()) {
    errors.lastName = 'Last name is required';
  }
  if (!formData.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Validate optional fields
  if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
    errors.phoneNumber = 'Please provide a valid phone number';
  }

  // Password validation
  if (formData.password) {
    if (!validatePassword(formData.password)) {
      errors.password = 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character';
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
  }

  return Object.keys(errors).length > 0 ? errors : null;
};

// Email validation
export const validateEmail = (email) => {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

// Password validation
export const validatePassword = (password) => {
  if (!password) return false;
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
  return re.test(password);
};

// Username validation
export const validateUsername = (username) => {
  return username?.trim().length > 0;
};

// Phone number validation
export const validatePhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return false;
  const re = /^\+?[1-9]\d{1,14}$/;
  return re.test(phoneNumber.trim());
};

// Login form validation
export const validateLoginForm = (formData) => {
  const errors = {};

  if (!formData.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!formData.password?.trim()) {
    errors.password = 'Password is required';
  }

  return Object.keys(errors).length > 0 ? errors : null;
};

// Registration form validation
export const validateRegisterForm = (formData) => {
  const errors = {};

  if (!formData.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!formData.password?.trim()) {
    errors.password = 'Password is required';
  } else if (!validatePassword(formData.password)) {
    errors.password = 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character';
  }

  if (!formData.username?.trim()) {
    errors.username = 'Username is required';
  }

  if (!formData.firstName?.trim()) {
    errors.firstName = 'First name is required';
  }

  if (!formData.lastName?.trim()) {
    errors.lastName = 'Last name is required';
  }

  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
    errors.phoneNumber = 'Please provide a valid phone number';
  }

  return Object.keys(errors).length > 0 ? errors : null;
};
