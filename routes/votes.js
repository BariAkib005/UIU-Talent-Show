const express = require('express');
const router = express.Router();
const { castVote, getUserVotes, getLeaderboard } = require('../controllers/voteController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.post('/cast', verifyToken, castVote);
router.get('/my-votes', verifyToken, getUserVotes);
router.get('/leaderboard', getLeaderboard);

module.exports = router;
