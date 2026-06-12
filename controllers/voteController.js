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

    // Check if the user is voting for their own performance
    if (submissions[0].user_id === user_id) {
      return res.status(400).json({ success: false, message: 'You cannot vote for your own performance!' });
    }

    // Check if vote already exists (toggle behavior)
    const [existing] = await db.query(
      'SELECT id FROM votes WHERE user_id = ? AND submission_id = ?',
      [user_id, submission_id]
    );

    if (existing.length > 0) {
      // User has already voted -> remove the vote (Unvote)
      await db.query('DELETE FROM votes WHERE user_id = ? AND submission_id = ?', [user_id, submission_id]);
      return res.status(200).json({ success: true, voted: false, message: 'Vote retracted.' });
    } else {
      // User has not voted -> add the vote
      await db.query('INSERT INTO votes (user_id, submission_id) VALUES (?, ?)', [user_id, submission_id]);
      return res.status(201).json({ success: true, voted: true, message: 'Vote registered successfully!' });
    }
  } catch (error) {
    console.error('Cast vote error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process vote.' });
  }
};

const getUserVotes = async (req, res) => {
  const user_id = req.user.id;

  try {
    const [votes] = await db.query('SELECT submission_id FROM votes WHERE user_id = ?', [user_id]);
    const votedSubmissionIds = votes.map(v => v.submission_id);
    return res.status(200).json({ success: true, votedSubmissionIds });
  } catch (error) {
    console.error('Fetch user votes error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch your votes.' });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const [ranking] = await db.query(`
      SELECT 
        u.id AS user_id, 
        u.name AS creator_name, 
        u.department, 
        u.batch, 
        COUNT(DISTINCT s.id) AS total_submissions, 
        COUNT(v.id) AS total_votes
      FROM users u
      JOIN submissions s ON u.id = s.user_id
      LEFT JOIN votes v ON s.id = v.submission_id
      GROUP BY u.id
      ORDER BY total_votes DESC, total_submissions DESC, u.name ASC
    `);

    return res.status(200).json({ success: true, leaderboard: ranking });
  } catch (error) {
    console.error('Leaderboard query error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch leaderboard.' });
  }
};

module.exports = { castVote, getUserVotes, getLeaderboard };
