const express = require('express');
const router = express.Router();
const { castVote, getUserVotes, addComment, getComments, getLeaderboard } = require('../controllers/voteController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.post('/cast', verifyToken, castVote);
router.post('/like', verifyToken, castVote);
router.get('/my-votes', verifyToken, getUserVotes);
router.get('/my-likes', verifyToken, getUserVotes);
router.post('/comment', verifyToken, addComment);
router.get('/comments/:submissionId', getComments);
router.get('/leaderboard', getLeaderboard);

module.exports = router;
