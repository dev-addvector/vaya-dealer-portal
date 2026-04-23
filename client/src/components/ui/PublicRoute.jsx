import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function PublicRoute({ children }) {
  const { token, user } = useAuthStore();
  if (token) {
    return <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/products'} replace />;
  }
  return children;
}
