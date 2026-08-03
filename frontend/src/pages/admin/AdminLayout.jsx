import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-black">
      <AdminSidebar />
      <div className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto px-4 py-8 w-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
