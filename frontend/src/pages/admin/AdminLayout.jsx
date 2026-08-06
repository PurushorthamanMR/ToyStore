import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import AdminSidebar from './AdminSidebar';
import SetupProgressBar from '../../components/SetupProgressBar';
import { SetupStatusProvider } from '../../context/SetupStatusContext';
import { UnsavedChangesProvider } from '../../context/UnsavedChangesContext';

export default function AdminLayout() {
  const location = useLocation();

  return (
    <SetupStatusProvider>
      <UnsavedChangesProvider>
        <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-black">
          {/* Deliberately outside the animated motion.div below - that wrapper's
              `transform` would become the containing block for this bar's
              `position: fixed`, trapping it so it scrolls with the page instead
              of staying pinned to the viewport (same issue solved via a portal
              for the Settings page's floating Save/Cancel bar). */}
          <SetupProgressBar />
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
      </UnsavedChangesProvider>
    </SetupStatusProvider>
  );
}
