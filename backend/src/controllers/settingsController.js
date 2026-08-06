const pool = require('../config/db');
const crypto = require('crypto');
const { sendSetupCompleteEmail } = require('../services/emailService');

// This endpoint is public (no login required, used to theme the site for every
// visitor) so wholesale_token must never be selected here - it's fetched only
// via the admin-only endpoints below.
const PUBLIC_SETTINGS_COLUMNS = `
  id, store_name, store_short_name, store_logo, store_icon, whatsapp_number, address, email,
  theme_color_light, theme_color_dark, active_font,
  terms_content, return_policy_content, privacy_policy_content, updated_at
`;

// Drives the admin panel's setup-progress bar. A section counts as complete
// once every one of its columns is non-null/non-empty - Wholesale is
// deliberately excluded (not part of initial store setup).
const SETUP_SECTIONS = [
  { key: 'general', label: 'General', columns: ['store_logo', 'store_icon'] },
  { key: 'contact', label: 'Contact', columns: ['whatsapp_number', 'address', 'email'] },
  { key: 'appearance', label: 'Appearance', columns: ['theme_color_light', 'theme_color_dark', 'active_font'] },
  { key: 'legal', label: 'Legal Pages', columns: ['terms_content', 'return_policy_content', 'privacy_policy_content'] },
  {
    key: 'email',
    label: 'Email (EmailJS)',
    columns: ['emailjs_service_id', 'emailjs_public_key', 'emailjs_private_key', 'emailjs_template_otp', 'emailjs_template_notify'],
  },
  { key: 'drive', label: 'Google Drive', columns: ['drive_client_email', 'drive_private_key', 'drive_folder_id'] },
];

function isFilled(value) {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

function computeSetupStatus(row) {
  const sections = SETUP_SECTIONS.map(({ key, label, columns }) => ({
    key,
    label,
    complete: columns.every((col) => isFilled(row?.[col])),
  }));
  const completedCount = sections.filter((s) => s.complete).length;
  const totalCount = sections.length;
  return { sections, completedCount, totalCount, percent: Math.round((completedCount / totalCount) * 100) };
}

async function getSetupStatus(req, res) {
  try {
    const [[row]] = await pool.query('SELECT * FROM settings WHERE id = 1');
    res.json(computeSetupStatus(row));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch setup status' });
  }
}

async function getSettings(req, res) {
  try {
    const [[settings]] = await pool.query(`SELECT ${PUBLIC_SETTINGS_COLUMNS} FROM settings WHERE id = 1`);
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
}

// Admin-only - emailjs_private_key must never reach the public /settings endpoint.
async function getEmailSettings(req, res) {
  try {
    const [[row]] = await pool.query(
      `SELECT emailjs_service_id, emailjs_public_key, emailjs_private_key, emailjs_reply_to,
              emailjs_template_otp, emailjs_template_notify
       FROM settings WHERE id = 1`
    );
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch email settings' });
  }
}

// Admin-only - drive_private_key must never reach the public /settings endpoint.
async function getDriveSettings(req, res) {
  try {
    const [[row]] = await pool.query(
      'SELECT drive_client_email, drive_private_key, drive_folder_id FROM settings WHERE id = 1'
    );
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch Google Drive settings' });
  }
}

async function getWholesaleToken(req, res) {
  try {
    const [[row]] = await pool.query('SELECT wholesale_token FROM settings WHERE id = 1');
    res.json({ wholesale_token: row?.wholesale_token || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch wholesale link' });
  }
}

async function regenerateWholesaleToken(req, res) {
  try {
    const token = crypto.randomBytes(24).toString('hex');
    await pool.query('UPDATE settings SET wholesale_token = ? WHERE id = 1', [token]);
    res.json({ wholesale_token: token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to regenerate wholesale link' });
  }
}

async function updateSettings(req, res) {
  try {
    const {
      store_name, store_short_name, store_logo, store_icon, whatsapp_number, address, email,
      theme_color_light, theme_color_dark,
      terms_content, return_policy_content, privacy_policy_content,
      emailjs_service_id, emailjs_public_key, emailjs_private_key, emailjs_reply_to,
      emailjs_template_otp, emailjs_template_notify,
      drive_client_email, drive_private_key, drive_folder_id,
      active_font,
    } = req.body;
    const fields = [];
    const values = [];
    if (store_name !== undefined) { fields.push('store_name = ?'); values.push(store_name); }
    if (store_short_name !== undefined) { fields.push('store_short_name = ?'); values.push(store_short_name); }
    if (store_logo !== undefined) { fields.push('store_logo = ?'); values.push(store_logo || null); }
    if (store_icon !== undefined) { fields.push('store_icon = ?'); values.push(store_icon || null); }
    if (whatsapp_number !== undefined) { fields.push('whatsapp_number = ?'); values.push(whatsapp_number || null); }
    if (address !== undefined) { fields.push('address = ?'); values.push(address || null); }
    if (email !== undefined) { fields.push('email = ?'); values.push(email || null); }
    if (theme_color_light !== undefined) { fields.push('theme_color_light = ?'); values.push(theme_color_light); }
    if (theme_color_dark !== undefined) { fields.push('theme_color_dark = ?'); values.push(theme_color_dark); }
    if (terms_content !== undefined) { fields.push('terms_content = ?'); values.push(terms_content || null); }
    if (return_policy_content !== undefined) { fields.push('return_policy_content = ?'); values.push(return_policy_content || null); }
    if (privacy_policy_content !== undefined) { fields.push('privacy_policy_content = ?'); values.push(privacy_policy_content || null); }
    if (emailjs_service_id !== undefined) { fields.push('emailjs_service_id = ?'); values.push(emailjs_service_id || null); }
    if (emailjs_public_key !== undefined) { fields.push('emailjs_public_key = ?'); values.push(emailjs_public_key || null); }
    if (emailjs_private_key !== undefined) { fields.push('emailjs_private_key = ?'); values.push(emailjs_private_key || null); }
    if (emailjs_reply_to !== undefined) { fields.push('emailjs_reply_to = ?'); values.push(emailjs_reply_to || null); }
    if (emailjs_template_otp !== undefined) { fields.push('emailjs_template_otp = ?'); values.push(emailjs_template_otp || null); }
    if (emailjs_template_notify !== undefined) { fields.push('emailjs_template_notify = ?'); values.push(emailjs_template_notify || null); }
    if (drive_client_email !== undefined) { fields.push('drive_client_email = ?'); values.push(drive_client_email || null); }
    if (drive_private_key !== undefined) { fields.push('drive_private_key = ?'); values.push(drive_private_key || null); }
    if (drive_folder_id !== undefined) { fields.push('drive_folder_id = ?'); values.push(drive_folder_id || null); }
    if (active_font !== undefined) { fields.push('active_font = ?'); values.push(active_font); }
    if (fields.length === 0) return res.status(400).json({ message: 'Nothing to update' });

    const [[beforeRow]] = await pool.query('SELECT * FROM settings WHERE id = 1');
    const beforeStatus = computeSetupStatus(beforeRow);

    await pool.query(`UPDATE settings SET ${fields.join(', ')} WHERE id = 1`, values);

    const [[afterRow]] = await pool.query('SELECT * FROM settings WHERE id = 1');
    if (beforeStatus.percent < 100 && computeSetupStatus(afterRow).percent === 100) {
      await sendSetupCompleteEmail(afterRow.email);
    }

    const [[settings]] = await pool.query(`SELECT ${PUBLIC_SETTINGS_COLUMNS} FROM settings WHERE id = 1`);
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update settings' });
  }
}

module.exports = {
  getSettings,
  updateSettings,
  getEmailSettings,
  getDriveSettings,
  getSetupStatus,
  getWholesaleToken,
  regenerateWholesaleToken,
};
