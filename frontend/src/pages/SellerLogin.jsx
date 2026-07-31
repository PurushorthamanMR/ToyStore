import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStore, faChartLine, faBoxesStacked, faCircleDollarToSlot } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';
import api from '../api/client';
import { infoAlert } from '../lib/alert';

const SELLER_PERKS = [
  { icon: faBoxesStacked, text: 'Manage your listings' },
  { icon: faChartLine, text: 'Track sales in real time' },
  { icon: faCircleDollarToSlot, text: 'Get paid on time' },
];

export default function SellerLogin() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(identifier, password, remember);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    let number = null;
    try {
      const { data } = await api.get('/whatsapp/contact');
      number = data.number;
    } catch {
      number = null;
    }
    const waHref = number
      ? `https://wa.me/${number}?text=${encodeURIComponent(
          'Hi, I forgot my password for my City Cycle Stores seller account and need help resetting it.'
        )}`
      : null;
    infoAlert(
      'Forgot your password?',
      waHref
        ? `Self-service reset isn't available yet. <a href="${waHref}" target="_blank" rel="noopener noreferrer" class="text-wa-green-dark dark:text-wa-green font-semibold underline">Message us on WhatsApp</a> and our seller support team will help you regain access.`
        : "Self-service reset isn't available yet. Please contact our seller support team for help regaining access to your account."
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10 md:py-16">
      <div className="rounded-2xl overflow-hidden shadow-lg dark:shadow-none border border-gray-200 dark:border-neutral-800">
        <div className="bg-gradient-to-r from-neutral-900 to-wa-teal text-white text-center px-6 sm:px-10 py-8">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 mb-3">
            <FontAwesomeIcon icon={faStore} className="text-xl" />
          </span>
          <h1 className="text-xl font-bold">Seller Portal</h1>
          <p className="text-sm text-white/70 mt-1">Sign in to manage your listings, orders and payouts.</p>
          <div className="hidden sm:flex justify-center gap-8 mt-6 pt-6 border-t border-white/10">
            {SELLER_PERKS.map((perk) => (
              <div key={perk.text} className="flex flex-col items-center gap-2 max-w-[7rem]">
                <FontAwesomeIcon icon={perk.icon} className="text-lg text-white/80" />
                <span className="text-xs text-white/70 text-center leading-tight">{perk.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 sm:p-10">
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                WhatsApp Number
              </label>
              <input
                type="text"
                autoComplete="username"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Password</label>
              <PasswordInput
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2"
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-neutral-600 text-wa-teal focus:ring-wa-teal"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-wa-teal-light dark:text-wa-green font-semibold hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-wa-teal hover:bg-wa-teal-light disabled:bg-gray-300 dark:disabled:bg-neutral-700 text-white font-semibold py-2.5 rounded-md"
            >
              {loading ? 'Logging in...' : 'Login to Seller Portal'}
            </button>
          </form>
          <p className="text-sm text-center mt-4 text-gray-700 dark:text-gray-300">
            Not a seller yet?{' '}
            <Link to="/apply-seller" className="text-wa-teal-light dark:text-wa-green font-semibold hover:underline">
              Apply as a Seller
            </Link>
          </p>
          <p className="text-sm text-center mt-2 text-gray-700 dark:text-gray-300">
            Shopping instead?{' '}
            <Link to="/login" className="text-wa-teal-light dark:text-wa-green font-semibold hover:underline">
              Customer Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
