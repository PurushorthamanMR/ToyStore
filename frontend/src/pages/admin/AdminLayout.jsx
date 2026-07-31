import { Outlet } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black">
      <AdminNavbar />
      <div className="max-w-6xl mx-auto px-4 py-8 w-full flex-1">
        <Outlet />
      </div>
    </div>
  );
}
