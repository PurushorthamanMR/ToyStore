const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { uploadImage } = require('../controllers/uploadController');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = express.Router();

router.post('/', authenticate, requireAdmin, upload.single('image'), uploadImage);

router.use((err, req, res, next) => {
  res.status(400).json({ message: err.message || 'Upload failed' });
});

module.exports = router;
