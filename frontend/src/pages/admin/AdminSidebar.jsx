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
  faSitemap,
  faReceipt,
  faTriangleExclamation,
  faTags,
  faImages,
  faNewspaper,
  faUsers,
  faAddressBook,
  faHouse,
  faRightFromBracket,
  faGear,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

const DESKTOP_QUERY = '(min-width: 1024px)';

/** Drives desktop-sidebar vs mobile-hamburger as a single JS boolean instead
 *  of two independently-toggled CSS breakpoints on two different elements -
 *  that way there is no way for both to end up visible at once. */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(DESKTOP_QUERY).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    const handleChange = (e) => setIsDesktop(e.matches);
    setIsDesktop(mql.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  return isDesktop;
}

function buildSections({ pendingCount, lowStockCount, pendingUsersCount, canManageUsers }) {
  return [
    {
      items: [{ to: '/admin/dashboard', label: 'Dashboard', icon: faGauge }],
    },
    {
      label: 'Catalog',
      items: [
        { to: '/admin/products', label: 'Products', icon: faBox },
        { to: '/admin/low-stock', label: 'Low Stock', icon: faTriangleExclamation, badge: lowStockCount },
        { to: '/admin/categories', label: 'Categories', icon: faFolderTree },
        { to: '/admin/subcategories', label: 'Subcategories', icon: faSitemap },
      ],
    },
    {
      label: 'Sales',
      items: [{ to: '/admin/orders', label: 'Orders', icon: faReceipt, badge: pendingCount }],
    },
    {
      label: 'Content',
      items: [
        { to: '/admin/offers', label: 'Offers', icon: faTags },
        { to: '/admin/banners', label: 'Banners', icon: faImages },
        { to: '/admin/blogs', label: 'Blogs', icon: faNewspaper },
      ],
    },
    ...(canManageUsers
      ? [
          {
            label: 'Access',
            items: [
              { to: '/admin/customers', label: 'Customers', icon: faAddressBook },
              { to: '/admin/users', label: 'Users', icon: faUsers, badge: pendingUsersCount },
              { to: '/admin/settings', label: 'Settings', icon: faGear },
            ],
          },
        ]
      : []),
  ];
}

function SidebarLink({ to, label, icon, badge, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive ? 'bg-white/20' : 'hover:bg-white/10'
        }`
      }
    >
      <FontAwesomeIcon icon={icon} className="w-4 shrink-0" />
      <span className="truncate">{label}</span>
      {!!badge && (
        <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] leading-[18px] text-center px-1">
          {badge}
        </span>
      )}
    </NavLink>
  );
}

export default function AdminSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = useIsDesktop();
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

  function handleLogout() {
    logout();
    setMenuOpen(false);
    window.location.href = '/';
  }

  const sections = buildSections({ pendingCount, lowStockCount, pendingUsersCount, canManageUsers });

  const brand = (
    <Link to="/admin/dashboard" className="font-extrabold text-lg flex items-center gap-2">
      <FontAwesomeIcon icon={faToolbox} />
      Admin Panel
    </Link>
  );

  function navContent(onLinkClick) {
    return (
      <nav className="px-3 py-4 space-y-5">
        {sections.map((section, i) => (
          <div key={section.label || i}>
            {section.label && (
              <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/50">
                {section.label}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <SidebarLink key={item.to} {...item} onClick={onLinkClick} />
              ))}
            </div>
          </div>
        ))}
      </nav>
    );
  }

  function footerActions(onLinkClick) {
    return (
      <div className="px-3 py-4 space-y-1 border-t border-white/10 shrink-0">
        <button
          onClick={() => {
            onLinkClick?.();
            navigate('/');
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10"
        >
          <FontAwesomeIcon icon={faHouse} className="w-4" />
          Back to Home
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-wa-green hover:bg-wa-green-dark"
        >
          <FontAwesomeIcon icon={faRightFromBracket} className="w-4" />
          Logout
        </button>
      </div>
    );
  }

  if (isDesktop) {
    return (
      <aside className="flex flex-col w-64 shrink-0 h-screen sticky top-0 bg-wa-teal dark:bg-black text-white dark:border-r dark:border-wa-green/30">
        <div className="px-4 py-5 border-b border-white/10 shrink-0">{brand}</div>
        <div className="sidebar-scroll flex-1 overflow-y-auto">{navContent()}</div>
        {footerActions()}
      </aside>
    );
  }

  return (
    <>
      {/* Mobile hamburger navbar */}
      <header className="bg-wa-teal dark:bg-black text-white shadow-md sticky top-0 z-40 dark:border-b dark:border-wa-green/30">
        <div className="px-3 sm:px-4 py-3 flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMenuOpen(true)}
            aria-label="Open admin menu"
            className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-md shrink-0"
          >
            <FontAwesomeIcon icon={faBars} />
          </motion.button>
          {brand}
        </div>
      </header>

      {/* Mobile menu: slide-in overlay, closed by default, doesn't affect page layout */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed top-0 left-0 h-full w-[78%] max-w-xs z-50 bg-wa-teal dark:bg-black text-white shadow-2xl flex flex-col"
            >
              <div className="px-4 py-5 border-b border-white/10 shrink-0 flex items-center justify-between">
                {brand}
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                  className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center shrink-0"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </motion.button>
              </div>
              <p className="px-4 pt-3 pb-1 text-xs opacity-70 shrink-0">{user?.name} · {user?.role}</p>
              <div className="sidebar-scroll flex-1 overflow-y-auto">{navContent(() => setMenuOpen(false))}</div>
              {footerActions(() => setMenuOpen(false))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
