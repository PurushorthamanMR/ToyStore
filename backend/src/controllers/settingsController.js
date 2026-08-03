const pool = require('../config/db');
const crypto = require('crypto');

// This endpoint is public (no login required, used to theme the site for every
// visitor) so wholesale_token must never be selected here - it's fetched only
// via the admin-only endpoints below.
const PUBLIC_SETTINGS_COLUMNS = `
  id, store_name, store_short_name, store_logo, whatsapp_number, address, email,
  theme_color_light, theme_color_dark,
  terms_content, return_policy_content, privacy_policy_content, updated_at
`;

async function getSettings(req, res) {
  try {
    const [[settings]] = await pool.query(`SELECT ${PUBLIC_SETTINGS_COLUMNS} FROM settings WHERE id = 1`);
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch settings' });
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
      store_name, store_short_name, store_logo, whatsapp_number, address, email,
      theme_color_light, theme_color_dark,
      terms_content, return_policy_content, privacy_policy_content,
    } = req.body;
    const fields = [];
    const values = [];
    if (store_name !== undefined) { fields.push('store_name = ?'); values.push(store_name); }
    if (store_short_name !== undefined) { fields.push('store_short_name = ?'); values.push(store_short_name); }
    if (store_logo !== undefined) { fields.push('store_logo = ?'); values.push(store_logo || null); }
    if (whatsapp_number !== undefined) { fields.push('whatsapp_number = ?'); values.push(whatsapp_number || null); }
    if (address !== undefined) { fields.push('address = ?'); values.push(address || null); }
    if (email !== undefined) { fields.push('email = ?'); values.push(email || null); }
    if (theme_color_light !== undefined) { fields.push('theme_color_light = ?'); values.push(theme_color_light); }
    if (theme_color_dark !== undefined) { fields.push('theme_color_dark = ?'); values.push(theme_color_dark); }
    if (terms_content !== undefined) { fields.push('terms_content = ?'); values.push(terms_content || null); }
    if (return_policy_content !== undefined) { fields.push('return_policy_content = ?'); values.push(return_policy_content || null); }
    if (privacy_policy_content !== undefined) { fields.push('privacy_policy_content = ?'); values.push(privacy_policy_content || null); }
    if (fields.length === 0) return res.status(400).json({ message: 'Nothing to update' });

    await pool.query(`UPDATE settings SET ${fields.join(', ')} WHERE id = 1`, values);
    const [[settings]] = await pool.query(`SELECT ${PUBLIC_SETTINGS_COLUMNS} FROM settings WHERE id = 1`);
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update settings' });
  }
}

module.exports = { getSettings, updateSettings, getWholesaleToken, regenerateWholesaleToken };
