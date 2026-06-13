const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

const signup = async (req, res) => {
  const { name, student_id, email, department, batch, password } = req.body;

  if (!name || !student_id || !email || !department || !batch || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  // Validate email domain (*.uiu.ac.bd)
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]*uiu\.ac\.bd$/i;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Only UIU student emails are allowed (e.g., name@bscse.uiu.ac.bd).' });
  }

  // Validate Student ID format (e.g., "011 201 000" or "011201000")
  const studentIdRegex = /^\d{3}\s?\d{3}\s?\d{3}$/;
  if (!studentIdRegex.test(student_id)) {
    return res.status(400).json({ success: false, message: 'Invalid Student ID format. Must be like 011 201 000.' });
  }

  try {
    // Check if email or student ID already exists
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE email = ? OR student_id = ?',
      [email, student_id]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, message: 'User with this email or Student ID already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user (automatically verified, bypass OTP)
    await db.query(
      'INSERT INTO users (name, student_id, email, department, batch, password, otp, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, student_id, email, department, batch, hashedPassword, null, true]
    );

    return res.status(201).json({
      success: true,
      message: 'Signup successful! Your account has been created.',
      email
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const signin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    const [users] = await db.query(
      'SELECT id, NAME as name, email, student_id, department, batch, PASSWORD as password, is_verified, otp, created_at FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Generate JWT
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured on the server.');
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, student_id: user.student_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        student_id: user.student_id,
        department: user.department,
        batch: user.batch
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const me = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, NAME as name, email, student_id, department, batch, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({ success: true, user: users[0] });
  } catch (error) {
    console.error('Auth check error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const logout = (req, res) => {
  return res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

module.exports = { signup, signin, me, logout };
