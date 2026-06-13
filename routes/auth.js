const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { signup, signin, me, logout, updateProfile } = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');

const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, JPEG, PNG, GIF, and WEBP image formats are allowed.'), false);
  }
};

const uploadAvatar = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.post('/signup', signup);
router.post('/signin', signin);
router.get('/me', verifyToken, me);
router.post('/logout', logout);
router.post('/update-profile', verifyToken, uploadAvatar.single('profile_pic'), updateProfile);

module.exports = router;
