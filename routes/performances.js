const express = require('express');
const router = express.Router();
const {
  uploadPerformance,
  getPerformances,
  getTrendingPerformances,
  getPerformanceById,
  getUserPerformances,
  deletePerformance
} = require('../controllers/performanceController');
const { verifyToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.post('/upload', verifyToken, upload.single('media'), uploadPerformance);
router.get('/', getPerformances);
router.get('/trending', getTrendingPerformances);
router.get('/:id', getPerformanceById);
router.get('/user/:userId', getUserPerformances);
router.delete('/:id', verifyToken, deletePerformance);

module.exports = router;
