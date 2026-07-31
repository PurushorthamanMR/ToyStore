import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faToolbox,
  faXmark,
  faBars,
  faGauge,
  faBox,
  faFolderTree,
  faReceipt,
  faTriangleExclamation,
  faTags,
  faImages,
  faNewspaper,
  faUsers,
  faHouse,
  faRightFromBracket,
  faChartLine,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

const desktopLinkClass = ({ isActive }) =>
  `relative px-2.5 py-1.5 rounded-md text-sm font-medium whitespace-nowrap ${
    isActive ? 'bg-white/20' : 'hover:bg-white/10'
  }`;

function NavBadge({ count }) {
  if (!count) return null;
  return (
    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] leading-[16px] text-center px-1">
      {count}
    </span>
  );
}

export default function AdminNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);
  const canManageUsers = ['Admin', 'SuperAdmin'].includes(user?.role);

  useEffect(() => {
    api.get('/orders').then((res) => {
      setPendingCount(res.data.filter((o) => o.status === 'pending').length);
    }).catch(() => {});
    api.get('/products?lowStock=true').then((res) => {
      setLowStockCount(res.data.length);
    }).catch(() => {});
    if (canManageUsers) {
      api.get('/users?status=pending').then((res) => {
        setPendingUsersCount(res.data.length);
      }).catch(() => {});
    }
  }, [location.pathname, canManageUsers]);

  function go(path) {
    navigate(path);
    setMenuOpen(false);
  }

  function handleLogout() {
    logout();
    navigate('/');
    setMenuOpen(false);
  }

  return (
    <header className="bg-wa-teal dark:bg-black text-white shadow-md sticky top-0 z-50 dark:border-b dark:border-wa-green/30">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setMenuOpen(true)}
          aria-label="Open admin menu"
          className="xl:hidden w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-md shrink-0"
        >
          <FontAwesomeIcon icon={faBars} />
        </motion.button>

        <Link to="/admin/dashboard" className="font-extrabold text-lg whitespace-nowrap flex items-center gap-2 shrink-0">
          <FontAwesomeIcon icon={faToolbox} />
          Admin Panel
        </Link>

        <nav className="hidden xl:flex items-center gap-1 text-sm font-medium ml-auto">
          <NavLink to="/admin/dashboard" className={desktopLinkClass}>Dashboard</NavLink>
          <NavLink to="/admin/products" className={desktopLinkClass}>Products</NavLink>
          <NavLink to="/admin/categories" className={desktopLinkClass}>Categories</NavLink>
          <NavLink to="/admin/orders" className={desktopLinkClass}>
            Orders
            <NavBadge count={pendingCount} />
          </NavLink>
          <NavLink to="/admin/low-stock" className={desktopLinkClass}>
            Low Stock
            <NavBadge count={lowStockCount} />
          </NavLink>
          <NavLink to="/admin/offers" className={desktopLinkClass}>Offers</NavLink>
          <NavLink to="/admin/banners" className={desktopLinkClass}>Banners</NavLink>
          <NavLink to="/admin/blogs" className={desktopLinkClass}>Blogs</NavLink>
          <NavLink to="/admin/sales-analysis" className={desktopLinkClass}>Sales Analysis</NavLink>
          {canManageUsers && (
            <NavLink to="/admin/users" className={desktopLinkClass}>
              Users
              <NavBadge count={pendingUsersCount} />
            </NavLink>
          )}
          <Link to="/" className="px-2.5 py-1.5 rounded-md hover:bg-white/10 whitespace-nowrap">Back to Home</Link>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="bg-wa-green hover:bg-wa-green-dark px-3 py-1.5 rounded-md whitespace-nowrap"
          >
            Logout
          </motion.button>
        </nav>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMenuOpen(false)}
              className="xl:hidden fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="xl:hidden fixed top-0 left-0 h-full w-[78%] max-w-xs bg-white dark:bg-neutral-950 z-50 shadow-2xl flex flex-col text-gray-900 dark:text-gray-100"
            >
              <div className="bg-gradient-to-br from-wa-teal to-wa-green dark:from-black dark:to-neutral-900 text-white px-5 pt-6 pb-5 relative">
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </motion.button>
                <p className="font-bold text-lg flex items-center gap-2">
                  <FontAwesomeIcon icon={faToolbox} />
                  Admin Panel
                </p>
                <p className="text-sm opacity-80">{user?.name} · {user?.role}</p>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
                <button
                  onClick={() => go('/admin/dashboard')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-800"
                >
                  <span className="w-5 text-lg flex items-center justify-center"><FontAwesomeIcon icon={faGauge} /></span>
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={() => go('/admin/products')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-800"
                >
                  <span className="w-5 text-lg flex items-center justify-center"><FontAwesomeIcon icon={faBox} /></span>
                  <span>Products</span>
                </button>
                <button
                  onClick={() => go('/admin/categories')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-800"
                >
                  <span className="w-5 text-lg flex items-center justify-center"><FontAwesomeIcon icon={faFolderTree} /></span>
                  <span>Categories</span>
                </button>
                <button
                  onClick={() => go('/admin/orders')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-800"
                >
                  <span className="w-5 text-lg flex items-center justify-center"><FontAwesomeIcon icon={faReceipt} /></span>
                  <span>Orders</span>
                  {pendingCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] leading-[18px] text-center px-1">
                      {pendingCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => go('/admin/low-stock')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-800"
                >
                  <span className="w-5 text-lg flex items-center justify-center"><FontAwesomeIcon icon={faTriangleExclamation} /></span>
                  <span>Low Stock</span>
                  {lowStockCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] leading-[18px] text-center px-1">
                      {lowStockCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => go('/admin/offers')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-800"
                >
                  <span className="w-5 text-lg flex items-center justify-center"><FontAwesomeIcon icon={faTags} /></span>
                  <span>Offers</span>
                </button>
                <button
                  onClick={() => go('/admin/banners')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-800"
                >
                  <span className="w-5 text-lg flex items-center justify-center"><FontAwesomeIcon icon={faImages} /></span>
                  <span>Banners</span>
                </button>
                <button
                  onClick={() => go('/admin/blogs')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-800"
                >
                  <span className="w-5 text-lg flex items-center justify-center"><FontAwesomeIcon icon={faNewspaper} /></span>
                  <span>Blogs</span>
                </button>
                <button
                  onClick={() => go('/admin/sales-analysis')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-800"
                >
                  <span className="w-5 text-lg flex items-center justify-center"><FontAwesomeIcon icon={faChartLine} /></span>
                  <span>Sales Analysis</span>
                </button>
                {canManageUsers && (
                  <button
                    onClick={() => go('/admin/users')}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-800"
                  >
                    <span className="w-5 text-lg flex items-center justify-center"><FontAwesomeIcon icon={faUsers} /></span>
                    <span>Users</span>
                    {pendingUsersCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] leading-[18px] text-center px-1">
                        {pendingUsersCount}
                      </span>
                    )}
                  </button>
                )}

                <div className="my-2 border-t border-gray-100 dark:border-neutral-800" />

                <button
                  onClick={() => go('/')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-800"
                >
                  <span className="w-5 text-lg flex items-center justify-center"><FontAwesomeIcon icon={faHouse} /></span>
                  <span>Back to Home</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <span className="w-5 text-lg flex items-center justify-center"><FontAwesomeIcon icon={faRightFromBracket} /></span>
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
