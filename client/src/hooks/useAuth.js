import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import * as authApi from '@/api/auth.api';
import toast from 'react-hot-toast';

export const useLogin = () => {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      navigate(data.user.role === 'user' ? '/products' : '/admin/dashboard');
    },
    onError: (err) => toast.error(err.message || 'Login failed'),
  });
};

export const useLogout = () => {
  const { clearAuth } = useAuthStore();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => { clearAuth(); navigate('/login'); },
  });
};

export const useForgotPassword = () =>
  useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: () => toast.success('Reset link sent to your email'),
    onError: (err) => toast.error(err.message || 'Failed to send reset link'),
  });

export const useResetPassword = () => {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: () => { toast.success('Password reset successfully'); navigate('/login'); },
    onError: (err) => toast.error(err.message || 'Reset failed'),
  });
};

export const useRegister = () => {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: () => { toast.success('Account set up successfully'); navigate('/login'); },
    onError: (err) => toast.error(err.message || 'Registration failed'),
  });
};
