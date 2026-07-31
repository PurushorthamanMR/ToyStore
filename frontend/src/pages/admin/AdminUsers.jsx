import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faXmark, faPen, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import api from '../../api/client';
import Modal from '../../components/Modal';
import { confirmAction } from '../../lib/alert';

const ROLES = ['Customer', 'Seller', 'Admin'];

const ROLE_LABELS = {
  Customer: 'Customer',
  Seller: 'Seller',
  Admin: 'Admin',
  SuperAdmin: 'Super Admin',
};

const STATUS_TABS = ['pending', 'approved', 'rejected'];

const STATUS_STYLES = {
  approved: 'bg-wa-green/10 text-wa-green-dark dark:text-wa-green',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
};

function StatusTabs({ status, onChange }) {
  return (
    <div className="flex gap-2 mb-4">
      {STATUS_TABS.map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={`px-4 py-1.5 rounded-md text-sm font-semibold capitalize ${
            status === s
              ? 'bg-wa-green text-white'
              : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300'
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusTab, setStatusTab] = useState('pending');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });
  const [editError, setEditError] = useState('');

  function load() {
    setLoading(true);
    api
      .get(`/users?status=${statusTab}`)
      .then((res) => setUsers(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load users'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [statusTab]);

  async function changeRole(id, role) {
    await api.put(`/users/${id}/role`, { role });
    load();
  }

  async function approve(id) {
    await api.put(`/users/${id}/approve`);
    load();
  }

  async function reject(id) {
    await api.put(`/users/${id}/reject`);
    load();
  }

  async function handleReject(id) {
    const ok = await confirmAction({ title: 'Reject this user?', text: 'They will no longer be able to log in until approved again.' });
    if (!ok) return;
    await reject(id);
  }

  function startEdit(u) {
    setEditingUser(u);
    setEditForm({ name: u.name, email: u.email, phone: u.phone || '' });
    setEditError('');
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setEditError('');
    try {
      await api.put(`/users/${editingUser.id}`, editForm);
      setEditingUser(null);
      load();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update user');
    }
  }

  if (loading) return <p className="text-gray-700 dark:text-gray-300">Loading...</p>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Users</h2>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <StatusTabs status={statusTab} onChange={setStatusTab} />

      <Modal open={!!editingUser} onClose={() => setEditingUser(null)} title="Edit User">
        <form onSubmit={handleEditSubmit} className="space-y-3">
          {editError && <p className="text-red-600 text-sm">{editError}</p>}
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Name</label>
            <input
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Email</label>
            <input
              type="email"
              required
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Phone</label>
            <input
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-wa-green hover:bg-wa-green-dark text-white font-semibold px-4 py-2 rounded-md">
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-lg shadow dark:shadow-none overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-neutral-800 text-left text-gray-700 dark:text-gray-300">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
              <th className="p-3">Joined</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-gray-200 dark:border-neutral-800 text-gray-800 dark:text-gray-200">
                <td className="p-3 font-medium">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3 text-gray-500 dark:text-gray-400">{u.phone || '-'}</td>
                <td className="p-3">
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u.id, e.target.value)}
                    className="border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-2 py-1"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                </td>
                <td className="p-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[u.status]}`}>
                    {u.status}
                  </span>
                </td>
                <td className="p-3 text-gray-500 dark:text-gray-400">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="p-3">
                  {statusTab === 'pending' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => approve(u.id)}
                        aria-label="Approve"
                        title="Approve"
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-wa-green/10 text-wa-green-dark dark:text-wa-green hover:bg-wa-green/20"
                      >
                        <FontAwesomeIcon icon={faCheck} size="xs" />
                      </button>
                      <button
                        onClick={() => reject(u.id)}
                        aria-label="Reject"
                        title="Reject"
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                      >
                        <FontAwesomeIcon icon={faXmark} size="xs" />
                      </button>
                    </div>
                  ) : statusTab === 'rejected' ? (
                    <button
                      onClick={() => approve(u.id)}
                      aria-label="Restore"
                      title="Restore to approved"
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-wa-green/10 text-wa-green-dark dark:text-wa-green hover:bg-wa-green/20"
                    >
                      <FontAwesomeIcon icon={faRotateRight} size="xs" />
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(u)}
                        aria-label="Edit"
                        title="Edit"
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20"
                      >
                        <FontAwesomeIcon icon={faPen} size="xs" />
                      </button>
                      <button
                        onClick={() => handleReject(u.id)}
                        aria-label="Reject"
                        title="Reject"
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                      >
                        <FontAwesomeIcon icon={faXmark} size="xs" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-gray-500 dark:text-gray-400">No {statusTab} users.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
