const express = require('express');
const { sendOrderRequest } = require('../controllers/whatsappController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/contact', (req, res) => {
  res.json({ number: process.env.ADMIN_WHATSAPP_NUMBER || null });
});
router.post('/send', authenticate, sendOrderRequest);

module.exports = router;
