import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import AdminSidebar from './AdminSidebar';

export default function AdminLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-black">
      <AdminSidebar />
      <div className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto px-4 py-8 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
