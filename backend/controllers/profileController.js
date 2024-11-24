const User = require('../models/User');
const bcrypt = require('bcrypt');

// Get the logged-in user's profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password'); // Exclude password field
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update the logged-in user's profile
exports.updateProfile = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phoneNumber } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent OAuth users from updating passwords
    if (user.authProviderId && password) {
      return res.status(400).json({ message: "OAuth users cannot update their password" });
    }

    // Update email if provided and not already taken
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== req.userId) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }

    // Hash and update password if provided (only for non-OAuth users)
    if (password && !user.authProviderId) {
      if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' });
      }
      user.password = await bcrypt.hash(password, 12); // Hash the new password
    }

    // Update other optional fields if provided
    if (firstName !== undefined && firstName.trim() !== '') {
      user.firstName = firstName.trim();
    }
    if (lastName !== undefined && lastName.trim() !== '') {
      user.lastName = lastName.trim();
    }
    if (phoneNumber !== undefined && phoneNumber.trim() !== '') {
      user.phoneNumber = phoneNumber.trim();
    }

    // Save updated user data
    await user.save();

    const updatedUser = user.toSafeObject(); // Exclude sensitive data
    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
