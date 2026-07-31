const pool = require('../config/db');

const ASSIGNABLE_ROLES = ['Customer', 'Seller', 'Admin'];

const VALID_STATUSES = ['pending', 'approved', 'rejected'];

async function listUsers(req, res) {
  try {
    const { status } = req.query;
    const filterStatus = VALID_STATUSES.includes(status) ? status : 'approved';
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, r.name AS role, u.status, u.is_active, u.created_at
       FROM users u JOIN user_roles r ON r.id = u.role_id
       WHERE u.status = ? AND r.name IN ('SuperAdmin', 'Admin', 'Seller')
       ORDER BY u.created_at DESC`,
      [filterStatus]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
}

async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!ASSIGNABLE_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const [[roleRow]] = await pool.query('SELECT id FROM user_roles WHERE name = ?', [role]);
    if (!roleRow) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    await pool.query('UPDATE users SET role_id = ? WHERE id = ?', [roleRow.id, id]);
    res.json({ message: 'User role updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update user role' });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;
    const fields = [];
    const values = [];
    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (email !== undefined) { fields.push('email = ?'); values.push(email); }
    if (phone !== undefined) { fields.push('phone = ?'); values.push(phone || null); }
    if (fields.length === 0) return res.status(400).json({ message: 'Nothing to update' });
    values.push(id);
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ message: 'User updated' });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'That email is already in use' });
    }
    res.status(500).json({ message: 'Failed to update user' });
  }
}

async function approveUser(req, res) {
  try {
    const { id } = req.params;
    await pool.query(`UPDATE users SET status = 'approved', is_active = 1 WHERE id = ?`, [id]);
    res.json({ message: 'User approved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to approve user' });
  }
}

async function rejectUser(req, res) {
  try {
    const { id } = req.params;
    await pool.query(`UPDATE users SET status = 'rejected', is_active = 0 WHERE id = ?`, [id]);
    res.json({ message: 'User rejected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to reject user' });
  }
}

module.exports = {
  listUsers,
  updateUserRole,
  updateUser,
  approveUser,
  rejectUser,
};
