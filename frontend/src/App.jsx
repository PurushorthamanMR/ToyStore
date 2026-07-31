import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FloatingOrderBar from './components/FloatingOrderBar';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import MobileFooterNav from './components/MobileFooterNav';
import Home from './pages/Home';
import ProductList from './pages/ProductList';
import Categories from './pages/Categories';
import Blogs from './pages/Blogs';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import SellerLogin from './pages/SellerLogin';
import Register from './pages/Register';
import ApplySeller from './pages/ApplySeller';
import MyOrders from './pages/MyOrders';
import Profile from './pages/Profile';
import Wishlist from './pages/Wishlist';
import { PrivateRoute, AdminRoute } from './components/RouteGuards';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminOrders from './pages/admin/AdminOrders';
import AdminLowStock from './pages/admin/AdminLowStock';
import AdminBlogs from './pages/admin/AdminBlogs';
import AdminOffers from './pages/admin/AdminOffers';
import AdminBanners from './pages/admin/AdminBanners';
import AdminUsers from './pages/admin/AdminUsers';
import SellerSalesAnalysis from './pages/admin/SellerSalesAnalysis';

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isHomeRoute = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black transition-colors">
      {!isAdminRoute && <Navbar />}
      <main className={isAdminRoute ? 'flex-1' : 'flex-1 pb-32 lg:pb-24'}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<ProductList />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/blogs" element={<Blogs />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/login" element={<Login />} />
              <Route path="/seller-login" element={<SellerLogin />} />
              <Route path="/register" element={<Register />} />
              <Route path="/apply-seller" element={<ApplySeller />} />
              <Route
                path="/checkout"
                element={
                  <PrivateRoute>
                    <Checkout />
                  </PrivateRoute>
                }
              />
              <Route
                path="/my-orders"
                element={
                  <PrivateRoute>
                    <MyOrders />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/wishlist"
                element={
                  <PrivateRoute>
                    <Wishlist />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="low-stock" element={<AdminLowStock />} />
                <Route path="blogs" element={<AdminBlogs />} />
                <Route path="offers" element={<AdminOffers />} />
                <Route path="banners" element={<AdminBanners />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="sales-analysis" element={<SellerSalesAnalysis />} />
              </Route>
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
      {!isAdminRoute && <FloatingOrderBar />}
      {isHomeRoute && <FloatingWhatsApp />}
      {!isAdminRoute && <MobileFooterNav />}
      {!isAdminRoute && <Footer />}
    </div>
  );
}

export default App;
