const express = require('express');
const {
  getSettings,
  updateSettings,
  getEmailSettings,
  getDriveSettings,
  getSetupStatus,
  getWholesaleToken,
  regenerateWholesaleToken,
} = require('../controllers/settingsController');
const { authenticateOptional, authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateOptional, getSettings);
router.put('/', authenticate, requireAdmin, updateSettings);
router.get('/email', authenticate, requireAdmin, getEmailSettings);
router.get('/drive', authenticate, requireAdmin, getDriveSettings);
router.get('/setup-status', authenticate, requireAdmin, getSetupStatus);
router.get('/wholesale-token', authenticate, requireAdmin, getWholesaleToken);
router.post('/wholesale-token/regenerate', authenticate, requireAdmin, regenerateWholesaleToken);

module.exports = router;
