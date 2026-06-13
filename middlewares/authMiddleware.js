const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ success: false, message: 'Server configuration error.' });
  }

  let token = null;
  if (req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Contains id, email, name, student_id
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

module.exports = { verifyToken };
