const db = require('../config/db');

const castVote = async (req, res) => {
  const { submission_id } = req.body;
  const user_id = req.user.id;

  if (!submission_id) {
    return res.status(400).json({ success: false, message: 'Submission ID is required.' });
  }

  try {
    // Check if the submission exists
    const [submissions] = await db.query('SELECT id, user_id FROM submissions WHERE id = ?', [submission_id]);
    if (submissions.length === 0) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    // Check if the user is liking their own performance
    if (submissions[0].user_id === user_id) {
      return res.status(400).json({ success: false, message: 'You cannot like your own performance!' });
    }

    // Check if like already exists (toggle behavior)
    const [existing] = await db.query(
      'SELECT id FROM likes WHERE user_id = ? AND submission_id = ?',
      [user_id, submission_id]
    );

    let voted = false;
    let message = '';

    if (existing.length > 0) {
      // User has already liked -> remove the like
      await db.query('DELETE FROM likes WHERE user_id = ? AND submission_id = ?', [user_id, submission_id]);
      voted = false;
      message = 'Like removed.';
    } else {
      // User has not liked -> add the like
      try {
        await db.query('INSERT INTO likes (user_id, submission_id) VALUES (?, ?)', [user_id, submission_id]);
        voted = true;
        message = 'Performance liked successfully!';
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          voted = true;
          message = 'Performance liked successfully!';
        } else {
          throw err;
        }
      }
    }

    // Fetch updated like count
    const [countResult] = await db.query(
      'SELECT COUNT(*) as vote_count FROM likes WHERE submission_id = ?',
      [submission_id]
    );
    const vote_count = countResult[0].vote_count;

    return res.status(200).json({ success: true, voted, vote_count, message });
  } catch (error) {
    console.error('Like toggle error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process like.' });
  }
};

const getUserVotes = async (req, res) => {
  const user_id = req.user.id;

  try {
    const [likes] = await db.query('SELECT submission_id FROM likes WHERE user_id = ?', [user_id]);
    const votedSubmissionIds = likes.map(v => v.submission_id);
    return res.status(200).json({ success: true, votedSubmissionIds });
  } catch (error) {
    console.error('Fetch user likes error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch your likes.' });
  }
};

const addComment = async (req, res) => {
  const { submission_id, comment_text } = req.body;
  const user_id = req.user.id;

  if (!submission_id || !comment_text || !comment_text.trim()) {
    return res.status(400).json({ success: false, message: 'Submission ID and comment text are required.' });
  }

  try {
    // Check if the submission exists
    const [submissions] = await db.query('SELECT id FROM submissions WHERE id = ?', [submission_id]);
    if (submissions.length === 0) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    // Insert comment
    await db.query(
      'INSERT INTO comments (user_id, submission_id, comment_text) VALUES (?, ?, ?)',
      [user_id, submission_id, comment_text.trim()]
    );

    // Fetch updated counts
    const [likesCount] = await db.query('SELECT COUNT(*) as cnt FROM likes WHERE submission_id = ?', [submission_id]);
    const [commentsCount] = await db.query('SELECT COUNT(*) as cnt FROM comments WHERE submission_id = ?', [submission_id]);

    const like_count = likesCount[0].cnt;
    const comment_count = commentsCount[0].cnt;

    return res.status(201).json({
      success: true,
      message: 'Comment posted successfully!',
      like_count,
      comment_count
    });
  } catch (error) {
    console.error('Add comment error:', error);
    return res.status(500).json({ success: false, message: 'Failed to post comment.' });
  }
};

const getComments = async (req, res) => {
  const { submissionId } = req.params;

  try {
    // Fetch comments with user details
    const [comments] = await db.query(
      `SELECT c.id, c.comment_text, c.created_at, u.id as user_id, u.NAME as commentator_name, u.department 
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.submission_id = ?
       ORDER BY c.created_at ASC`,
      [submissionId]
    );

    return res.status(200).json({ success: true, comments });
  } catch (error) {
    console.error('Fetch comments error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch comments.' });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const [ranking] = await db.query(`
      SELECT 
        u.id AS user_id, 
        u.NAME AS creator_name, 
        u.department, 
        u.batch, 
        COUNT(DISTINCT s.id) AS total_submissions, 
        COALESCE(SUM(like_counts.cnt), 0) AS total_likes,
        COALESCE(SUM(comment_counts.cnt), 0) AS total_comments,
        (COALESCE(SUM(like_counts.cnt), 0) * 1 + COALESCE(SUM(comment_counts.cnt), 0) * 2) AS total_points
      FROM users u
      JOIN submissions s ON u.id = s.user_id
      LEFT JOIN (
        SELECT submission_id, COUNT(*) as cnt FROM likes GROUP BY submission_id
      ) like_counts ON s.id = like_counts.submission_id
      LEFT JOIN (
        -- Only count comments made by users other than the submission author to prevent self-spamming
        SELECT c.submission_id, COUNT(*) as cnt 
        FROM comments c
        JOIN submissions sub ON c.submission_id = sub.id
        WHERE c.user_id != sub.user_id
        GROUP BY c.submission_id
      ) comment_counts ON s.id = comment_counts.submission_id
      GROUP BY u.id
      ORDER BY total_points DESC, total_likes DESC, total_submissions DESC, u.NAME ASC
    `);

    return res.status(200).json({ success: true, leaderboard: ranking });
  } catch (error) {
    console.error('Leaderboard query error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch leaderboard.' });
  }
};

module.exports = { castVote, getUserVotes, addComment, getComments, getLeaderboard };
