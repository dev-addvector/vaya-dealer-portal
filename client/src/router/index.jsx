import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '@/layouts/AppLayout';
import AdminLayout from '@/layouts/AdminLayout';
import ProtectedRoute from '@/components/ui/ProtectedRoute';
import AdminRoute from '@/components/ui/AdminRoute';
import PublicRoute from '@/components/ui/PublicRoute';
import { useAuthStore } from '@/store/authStore';

function CatchAll() {
  const user = useAuthStore(s => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'user') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/products" replace />;
}
import LoginPage from '@/pages/auth/LoginPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ProductsPage from '@/pages/products/ProductsPage';
import MyOrdersPage from '@/pages/orders/MyOrdersPage';
import OpenOrdersPage from '@/pages/orders/OpenOrdersPage';
import ReservedOrdersPage from '@/pages/orders/ReservedOrdersPage';
import AddressPage from '@/pages/address/AddressPage';
import ContactPage from '@/pages/contact/ContactPage';
import ProfilePage from '@/pages/profile/ProfilePage';
import ProfileResetPasswordPage from '@/pages/profile/ResetPasswordPage';
import ResetAuthPasswordPage from '@/pages/profile/ResetAuthPasswordPage';
import CartPage from '@/pages/cart/CartPage';
import EBrochurePage from '@/pages/downloads/EBrochurePage';
import DashboardPage from '@/pages/admin/DashboardPage';
import LoginImagePage from '@/pages/admin/LoginImagePage';
import SmtpSettingPage from '@/pages/admin/SmtpSettingPage';
import MaxReserveDaysPage from '@/pages/admin/MaxReserveDaysPage';
import GSTSettingPage from '@/pages/admin/GSTSettingPage';
import QRSettingPage from '@/pages/admin/QRSettingPage';
import AdsPage from '@/pages/admin/AdsPage';
import EBrochureAdminPage from '@/pages/admin/EBrochureAdminPage';
import SubAdminPage from '@/pages/admin/SubAdminPage';
import StocksPage from '@/pages/admin/StocksPage';
import UsersPage from '@/pages/admin/UsersPage';
import UserOrdersPage from '@/pages/admin/UserOrdersPage';
import CreateOrderPage from '@/pages/admin/CreateOrderPage';
import BrochurePage from '@/pages/admin/BrochurePage';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <PublicRoute><LoginPage /></PublicRoute> },
  { path: '/forgot-password', element: <PublicRoute><ForgotPasswordPage /></PublicRoute> },
  { path: '/reset-password/:token', element: <ResetPasswordPage /> },
  { path: '/register/:encrypted_unc/:key_phrase', element: <RegisterPage /> },
  {
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [
      { path: '/products', element: <ProductsPage /> },
      { path: '/cart', element: <CartPage /> },
      { path: '/orders/my-orders', element: <MyOrdersPage /> },
      { path: '/orders/open-orders', element: <OpenOrdersPage /> },
      { path: '/orders/reserved-orders', element: <ReservedOrdersPage /> },
      { path: '/addresses', element: <AddressPage /> },
      { path: '/contacts', element: <ContactPage /> },
      { path: '/profile', element: <ProfilePage /> },
      { path: '/profile/reset-password', element: <ProfileResetPasswordPage /> },
      { path: '/profile/reset-auth-password', element: <ResetAuthPasswordPage /> },
      { path: '/downloads/ebrochures', element: <EBrochurePage /> },
    ],
  },
  {
    element: <AdminRoute><AdminLayout /></AdminRoute>,
    children: [
      { path: '/admin/dashboard', element: <DashboardPage /> },
      { path: '/admin/login-image', element: <LoginImagePage /> },
      { path: '/admin/smtp-setting', element: <SmtpSettingPage /> },
      { path: '/admin/max-reserve-days', element: <MaxReserveDaysPage /> },
      { path: '/admin/gst-setting', element: <GSTSettingPage /> },
      { path: '/admin/qr-setting', element: <QRSettingPage /> },
      { path: '/admin/ads', element: <AdsPage /> },
      { path: '/admin/ebrochures', element: <EBrochureAdminPage /> },
      { path: '/admin/subadmins', element: <SubAdminPage /> },
      { path: '/admin/stocks', element: <StocksPage /> },
      { path: '/admin/users', element: <UsersPage /> },
      { path: '/admin/users/:unc/orders', element: <UserOrdersPage /> },
      { path: '/admin/create-order', element: <CreateOrderPage /> },
      { path: '/admin/brochures', element: <BrochurePage /> },
    ],
  },
  { path: '*', element: <CatchAll /> },
]);
