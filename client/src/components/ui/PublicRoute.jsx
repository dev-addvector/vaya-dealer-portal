import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { getDefaultAdminRoute } from '@/utils/permissions';

export default function PublicRoute({ children }) {
  const { token, user } = useAuthStore();
  if (token) {
    return <Navigate to={user?.role === 'user' ? '/products' : getDefaultAdminRoute(user?.role)} replace />;
  }
  return children;
}
