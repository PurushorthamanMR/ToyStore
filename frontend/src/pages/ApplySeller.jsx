import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';

export default function ApplySeller() {
  const { applySeller } = useAuth();
  const [form, setForm] = useState({ full_name: '', email: '', mobile: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await applySeller(form);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-lg shadow dark:shadow-none p-6">
          <div className="text-4xl mb-3 text-wa-green"><FontAwesomeIcon icon={faCircleCheck} /></div>
          <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">Application sent to admin</h2>
          <p className="text-gray-600 dark:text-gray-400">
            After verification you will get a message, then you can use your Seller account.
          </p>
          <Link to="/" className="inline-block mt-4 text-wa-green-dark dark:text-wa-green font-semibold hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-lg shadow dark:shadow-none p-6">
        <h2 className="text-xl font-bold mb-2 text-center text-gray-900 dark:text-gray-100">Apply as a Seller</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
          Submit your details and our admin will review your application.
        </p>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Full Name</label>
            <input
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Mobile</label>
            <input
              required
              placeholder="e.g. 94771234567"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Password</label>
            <PasswordInput
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-wa-green hover:bg-wa-green-dark disabled:bg-gray-300 dark:disabled:bg-neutral-700 text-white font-semibold py-2.5 rounded-md"
          >
            {loading ? 'Submitting...' : 'Apply'}
          </button>
        </form>
        <p className="text-sm text-center mt-4 text-gray-700 dark:text-gray-300">
          <Link to="/register" className="text-wa-green-dark dark:text-wa-green font-semibold hover:underline">
            Register as a Customer instead
          </Link>
        </p>
      </div>
    </div>
  );
}
