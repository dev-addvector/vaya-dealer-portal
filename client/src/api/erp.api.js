import api from './axios';
export const getErpStatus = () => api.get('/erp-status');
