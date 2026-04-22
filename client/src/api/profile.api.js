import api from './axios';
export const getProfile = () => api.get('/profile');
export const resetLoginPassword = (data) => api.post('/profile/reset-password', data);
export const resetAuthPassword = (data) => api.post('/profile/reset-auth-password', data);
export const validateAuthPassword = (data) => api.post('/profile/validate-auth-password', data);
