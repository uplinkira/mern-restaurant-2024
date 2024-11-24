// utils/validation.js

// 电子邮件验证
export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };
  
  // 密码验证
  export const validatePassword = (password) => {
    // 至少8个字符，包含至少一个大写字母，一个小写字母，一个数字和一个特殊字符
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    return re.test(password);
  };
  
  // 用户名验证
  export const validateUsername = (username) => {
    return username.trim().length > 0;
  };
  
  // 电话号码验证（国际格式）
  export const validatePhoneNumber = (phoneNumber) => {
    const re = /^\+?[1-9]\d{1,14}$/;
    return re.test(phoneNumber);
  };
  
  // 表单验证
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
  
  // 登录表单验证
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
  
  // 注册表单验证
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