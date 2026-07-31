import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTruckFast, faShieldHalved, faGift, faHeadset } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';
import api from '../api/client';
import { infoAlert } from '../lib/alert';

const PERKS = [
  { icon: faGift, text: 'Handpicked toys for every age' },
  { icon: faTruckFast, text: 'Fast, reliable delivery' },
  { icon: faShieldHalved, text: 'Secure checkout, every order' },
  { icon: faHeadset, text: 'Friendly support on WhatsApp' },
];

export default function Login() {
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
          'Hi, I forgot my password for my City Cycle Stores account and need help resetting it.'
        )}`
      : null;
    infoAlert(
      'Forgot your password?',
      waHref
        ? `Self-service reset isn't available yet. <a href="${waHref}" target="_blank" rel="noopener noreferrer" class="text-wa-green-dark dark:text-wa-green font-semibold underline">Message us on WhatsApp</a> and our team will help you regain access.`
        : "Self-service reset isn't available yet. Please contact our support team for help regaining access to your account."
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 md:py-16">
      <div className="grid md:grid-cols-2 bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-2xl shadow-lg dark:shadow-none overflow-hidden">
        <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-wa-teal to-wa-green-dark text-white p-10">
          <div>
            <h1 className="text-2xl font-bold">City Cycle Stores</h1>
            <p className="mt-2 text-white/80">Welcome back! Sign in to track orders, manage your wishlist and check out faster.</p>
          </div>
          <ul className="space-y-4 mt-10">
            {PERKS.map((perk) => (
              <li key={perk.text} className="flex items-center gap-3 text-sm">
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-white/15">
                  <FontAwesomeIcon icon={perk.icon} className="text-base" />
                </span>
                <span className="text-white/90">{perk.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-6 sm:p-10">
          <h2 className="text-xl font-bold mb-1 text-gray-900 dark:text-gray-100">Login</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Enter your details to access your account.</p>
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
                  className="w-4 h-4 rounded border-gray-300 dark:border-neutral-600 text-wa-green focus:ring-wa-green"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-wa-green-dark dark:text-wa-green font-semibold hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-wa-green hover:bg-wa-green-dark disabled:bg-gray-300 dark:disabled:bg-neutral-700 text-white font-semibold py-2.5 rounded-md"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <p className="text-sm text-center mt-4 text-gray-700 dark:text-gray-300">
            Don't have an account?{' '}
            <Link to="/register" className="text-wa-green-dark dark:text-wa-green font-semibold hover:underline">
              Register
            </Link>
          </p>
          <p className="text-sm text-center mt-2 text-gray-700 dark:text-gray-300">
            Want to sell on our store?{' '}
            <Link to="/apply-seller" className="text-wa-green-dark dark:text-wa-green font-semibold hover:underline">
              Apply as a Seller
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
