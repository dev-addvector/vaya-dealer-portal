import api from './axios';
export const login = (data) => api.post('/auth/login', data);
export const logout = () => api.post('/auth/logout');
export const forgotPassword = (data) => api.post('/auth/forgot-password', data);
export const resetPassword = (data) => api.post('/auth/reset-password', data);
export const getRegisterInfo = (encryptedUnc, keyPhrase) =>
  api.get(`/auth/register/${encryptedUnc}/${keyPhrase}`);
export const checkEmail = (email) => api.post('/auth/register/check-email', { email });
export const register = (data) => api.post('/auth/register', data);
