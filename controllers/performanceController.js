const db = require('../config/db');
const fs = require('fs');
const path = require('path');

const uploadPerformance = async (req, res) => {
  const { title, description, type, blog_content } = req.body;
  const user_id = req.user.id;

  if (!title || !type) {
    return res.status(400).json({ success: false, message: 'Title and performance type are required.' });
  }

  if (!['video', 'audio', 'blog'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Invalid performance type.' });
  }

  let file_path = null;

  // For audio/video, verify file was uploaded
  if (type === 'audio' || type === 'video') {
    if (!req.file) {
      return res.status(400).json({ success: false, message: `Please upload a file for the ${type} performance.` });
    }
    // Save relative path for easy frontend referencing
    file_path = `/uploads/${req.file.filename}`;
  }

  try {
    const [result] = await db.query(
      'INSERT INTO submissions (user_id, title, description, type, file_path, blog_content) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, title, description || null, type, file_path, blog_content || null]
    );

    return res.status(201).json({
      success: true,
      message: 'Performance uploaded successfully!',
      submissionId: result.insertId
    });
  } catch (error) {
    console.error('Upload error:', error);
    // Cleanup file if DB insert fails
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error cleaning up file:', err);
      });
    }
    return res.status(500).json({ success: false, message: 'Failed to upload performance.' });
  }
};

const getPerformances = async (req, res) => {
  const { type, search } = req.query;
  
  let query = `
    SELECT s.*, u.name AS performer_name, u.department, u.batch, COUNT(v.id) AS vote_count
    FROM submissions s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN votes v ON s.id = v.submission_id
  `;
  
  const queryParams = [];
  const whereClauses = [];

  if (type) {
    whereClauses.push('s.type = ?');
    queryParams.push(type);
  }

  if (search) {
    whereClauses.push('(s.title LIKE ? OR s.description LIKE ? OR u.name LIKE ?)');
    const searchVal = `%${search}%`;
    queryParams.push(searchVal, searchVal, searchVal);
  }

  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
  }

  query += ' GROUP BY s.id ORDER BY s.created_at DESC';

  try {
    const [performances] = await db.query(query, queryParams);
    return res.status(200).json({ success: true, performances });
  } catch (error) {
    console.error('Fetch performances error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch performances.' });
  }
};

const getTrendingPerformances = async (req, res) => {
  try {
    // Trending are sorted by vote count, then by date
    const [performances] = await db.query(`
      SELECT s.*, u.name AS performer_name, u.department, u.batch, COUNT(v.id) AS vote_count
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN votes v ON s.id = v.submission_id
      GROUP BY s.id
      ORDER BY vote_count DESC, s.created_at DESC
      LIMIT 10
    `);
    return res.status(200).json({ success: true, performances });
  } catch (error) {
    console.error('Fetch trending error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch trending performances.' });
  }
};

const getPerformanceById = async (req, res) => {
  const { id } = req.params;

  try {
    const [submissions] = await db.query(`
      SELECT s.*, u.name AS performer_name, u.email AS performer_email, u.department, u.batch, COUNT(v.id) AS vote_count
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN votes v ON s.id = v.submission_id
      WHERE s.id = ?
      GROUP BY s.id
    `, [id]);

    if (submissions.length === 0) {
      return res.status(404).json({ success: false, message: 'Performance not found.' });
    }

    // Get list of voters to see if current user voted
    const [voters] = await db.query('SELECT user_id FROM votes WHERE submission_id = ?', [id]);
    const voterIds = voters.map(v => v.user_id);

    return res.status(200).json({
      success: true,
      performance: submissions[0],
      voterIds
    });
  } catch (error) {
    console.error('Fetch performance detail error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch details.' });
  }
};

const getUserPerformances = async (req, res) => {
  const { userId } = req.params;

  try {
    const [performances] = await db.query(`
      SELECT s.*, u.name AS performer_name, u.department, u.batch, COUNT(v.id) AS vote_count
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN votes v ON s.id = v.submission_id
      WHERE s.user_id = ?
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `, [userId]);

    return res.status(200).json({ success: true, performances });
  } catch (error) {
    console.error('Fetch user performances error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch user performances.' });
  }
};

module.exports = {
  uploadPerformance,
  getPerformances,
  getTrendingPerformances,
  getPerformanceById,
  getUserPerformances
};
