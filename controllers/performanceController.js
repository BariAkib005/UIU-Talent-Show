const jwt = require('jsonwebtoken');
const db = require('../config/db');
const fs = require('fs');
const path = require('path');

const uploadPerformance = async (req, res) => {
  const { title, description, type, blog_content, category, tags } = req.body;
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
  } else if (type === 'blog' && req.file) {
    // Save optional cover image path for blogs
    file_path = `/uploads/${req.file.filename}`;
  }

  try {
    const [result] = await db.query(
      'INSERT INTO submissions (user_id, title, description, type, category, tags, file_path, blog_content) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [user_id, title, description || null, type, category || null, tags || null, file_path, blog_content || null]
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
  const { type, search, limit, offset } = req.query;
  const pageSize = parseInt(limit) || 10;
  const pageOffset = parseInt(offset) || 0;
  
  let query = `
    SELECT s.id, s.user_id, s.title, s.description, s.type, s.file_path, s.created_at,
           LEFT(s.blog_content, 200) AS blog_excerpt,
           u.NAME AS performer_name, u.department, u.batch,
           COALESCE(like_counts.cnt, 0) AS like_count,
           COALESCE(comment_counts.cnt, 0) AS comment_count,
           (COALESCE(like_counts.cnt, 0) * 1 + COALESCE(comment_counts.cnt, 0) * 2) AS points,
           (COALESCE(like_counts.cnt, 0) * 1 + COALESCE(comment_counts.cnt, 0) * 2) AS vote_count
    FROM submissions s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN (
      SELECT submission_id, COUNT(*) as cnt FROM likes GROUP BY submission_id
    ) like_counts ON s.id = like_counts.submission_id
    LEFT JOIN (
      SELECT submission_id, COUNT(*) as cnt FROM comments GROUP BY submission_id
    ) comment_counts ON s.id = comment_counts.submission_id
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

  query += ' GROUP BY s.id ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
  queryParams.push(pageSize, pageOffset);

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
    const [performances] = await db.query(`
      SELECT s.id, s.user_id, s.title, s.description, s.type, s.file_path, s.created_at,
             LEFT(s.blog_content, 200) AS blog_excerpt,
             u.NAME AS performer_name, u.department, u.batch,
             COALESCE(like_counts.cnt, 0) AS like_count,
             COALESCE(comment_counts.cnt, 0) AS comment_count,
             (COALESCE(like_counts.cnt, 0) * 1 + COALESCE(comment_counts.cnt, 0) * 2) AS points,
             (COALESCE(like_counts.cnt, 0) * 1 + COALESCE(comment_counts.cnt, 0) * 2) AS vote_count
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN (
        SELECT submission_id, COUNT(*) as cnt FROM likes GROUP BY submission_id
      ) like_counts ON s.id = like_counts.submission_id
      LEFT JOIN (
        SELECT submission_id, COUNT(*) as cnt FROM comments GROUP BY submission_id
      ) comment_counts ON s.id = comment_counts.submission_id
      GROUP BY s.id
      ORDER BY points DESC, s.created_at DESC
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
      SELECT s.*, u.NAME AS performer_name, u.email AS performer_email, u.department, u.batch,
             COALESCE(like_counts.cnt, 0) AS like_count,
             COALESCE(comment_counts.cnt, 0) AS comment_count,
             (COALESCE(like_counts.cnt, 0) * 1 + COALESCE(comment_counts.cnt, 0) * 2) AS points,
             (COALESCE(like_counts.cnt, 0) * 1 + COALESCE(comment_counts.cnt, 0) * 2) AS vote_count
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN (
        SELECT submission_id, COUNT(*) as cnt FROM likes GROUP BY submission_id
      ) like_counts ON s.id = like_counts.submission_id
      LEFT JOIN (
        SELECT submission_id, COUNT(*) as cnt FROM comments GROUP BY submission_id
      ) comment_counts ON s.id = comment_counts.submission_id
      WHERE s.id = ?
      GROUP BY s.id
    `, [id]);

    if (submissions.length === 0) {
      return res.status(404).json({ success: false, message: 'Performance not found.' });
    }

    // Check if the current requesting user has liked using an EXISTS query
    let hasVoted = false;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const [voteCheck] = await db.query(
          'SELECT EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND submission_id = ?) as has_voted',
          [decoded.id, id]
        );
        hasVoted = !!voteCheck[0].has_voted;
      } catch (err) {
        // Ignore token decode errors
      }
    }

    return res.status(200).json({
      success: true,
      performance: submissions[0],
      hasVoted
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
      SELECT s.*, u.NAME AS performer_name, u.department, u.batch,
             COALESCE(like_counts.cnt, 0) AS like_count,
             COALESCE(comment_counts.cnt, 0) AS comment_count,
             (COALESCE(like_counts.cnt, 0) * 1 + COALESCE(comment_counts.cnt, 0) * 2) AS points,
             (COALESCE(like_counts.cnt, 0) * 1 + COALESCE(comment_counts.cnt, 0) * 2) AS vote_count
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN (
        SELECT submission_id, COUNT(*) as cnt FROM likes GROUP BY submission_id
      ) like_counts ON s.id = like_counts.submission_id
      LEFT JOIN (
        SELECT submission_id, COUNT(*) as cnt FROM comments GROUP BY submission_id
      ) comment_counts ON s.id = comment_counts.submission_id
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
