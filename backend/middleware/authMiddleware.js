const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // Extract token from 'Authorization' header
  const authHeader = req.header('Authorization');
  
  // Check if Authorization header is present and starts with Bearer
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization header missing or malformed' });
  }

  // Extract the token from the Bearer scheme
  const token = authHeader.split(' ')[1];

  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ensure the token has a userId
    if (!decoded.userId) {
      return res.status(401).json({ message: 'Invalid token, user information missing' });
    }

    // Attach the user ID to the request object
    req.userId = decoded.userId;

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Token verification failed:', error);

    // Check if the error is related to token expiration
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ message: 'Token expired, please login again' });
    }

    // Handle other types of token verification errors
    return res.status(403).json({ message: 'Token is not valid' });
  }
};

module.exports = authMiddleware;
