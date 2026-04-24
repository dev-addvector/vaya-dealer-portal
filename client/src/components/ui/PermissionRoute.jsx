import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { canAccessAdminRoute, getDefaultAdminRoute } from '@/utils/permissions';

export default function PermissionRoute({ children }) {
  const { user } = useAuthStore();
  const { pathname } = useLocation();
  if (!canAccessAdminRoute(user?.role, pathname)) {
    return <Navigate to={getDefaultAdminRoute(user?.role)} replace />;
  }
  return children;
}
