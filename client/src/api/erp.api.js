import api from './axios';
export const getErpStatus = () => api.get('/erp-status');
export const getErpStatusHistory = (page = 1, pageSize = 20) =>
  api.get('/admin/erp-status-log/history', { params: { page, pageSize } });
