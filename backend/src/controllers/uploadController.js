const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const pool = require('../config/db');
const driveService = require('../services/driveService');

async function getDriveConfig() {
  const [[row]] = await pool.query(
    'SELECT drive_client_email, drive_private_key, drive_folder_id FROM settings WHERE id = 1'
  );
  return row;
}

async function uploadImage(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file provided' });
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;

  try {
    const config = await getDriveConfig();
    if (config?.drive_client_email && config?.drive_private_key && config?.drive_folder_id) {
      const url = await driveService.uploadFile(config, req.file.buffer, filename, req.file.mimetype);
      return res.status(201).json({ url });
    }

    // Google Drive not configured in Admin Settings yet - fall back to local disk.
    await fs.writeFile(path.join(__dirname, '../../uploads', filename), req.file.buffer);
    res.status(201).json({ url: `/uploads/${filename}` });
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || 'Upload failed' });
  }
}

module.exports = { uploadImage };
