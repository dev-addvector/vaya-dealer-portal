import api from './axios';

// Dashboard
export const getDashboardFilters = () => api.get('/admin/dashboard');
export const getChartData = (data) => api.post('/admin/dashboard/chart-data', data);
export const downloadChartData = async (data) => {
  const response = await api.post('/admin/dashboard/download', data, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = `vaya_dashboard_data_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

// Settings (read all)
export const getSettings = () => api.get('/admin/settings');

// Settings (write individual)
export const saveSMTP = (data) => api.post('/admin/settings/smtp', data);
export const saveMaxReserveDays = (data) => api.post('/admin/settings/max-reserve-days', data);
export const saveGst = (data) => api.post('/admin/settings/gst', data);
export const saveQrLink = (data) => api.post('/admin/settings/qr-link', data);
export const downloadQr = async () => {
  const blob = await api.get('/admin/settings/qr/download', { responseType: 'blob' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'qr.png';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};
export const uploadLoginImage = (form) =>
  api.post('/admin/settings/upload-login-image', form, { headers: { 'Content-Type': 'multipart/form-data' } });

// Users
export const getUsers = (params) => api.get('/admin/settings/users', { params });
export const disableUser = (data) => api.post('/admin/settings/users/disable', data);

// Ads
export const getAds = () => api.get('/admin/ads');
export const getActiveAd = () => api.get('/admin/ads/active');
export const createAd = (form) =>
  api.post('/admin/ads', form, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateAd = (id, form) =>
  api.put(`/admin/ads/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteAd = (id) => api.delete(`/admin/ads/${id}`);

// QR Brochures (pattern-based with QR codes)
export const getBrochures = () => api.get('/admin/brochures');
export const createBrochure = (form) =>
  api.post('/admin/brochures', form, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateBrochure = (id, form) =>
  api.put(`/admin/brochures/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteBrochure = (id) => api.delete(`/admin/brochures/${id}`);

// E-Brochures (simple PDF uploads)
export const getEBrochures = () => api.get('/admin/ebrochures');
export const uploadEBrochure = (form) =>
  api.post('/admin/ebrochures', form, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteEBrochure = (id) => api.delete(`/admin/ebrochures/${id}`);

// Sub-Admins
export const getSubadmins = () => api.get('/admin/subadmins');
export const createSubadmin = (data) => api.post('/admin/subadmins', data);
export const updateSubadmin = (id, data) => api.put(`/admin/subadmins/${id}`, data);
export const deleteSubadmin = (id) => api.delete(`/admin/subadmins/${id}`);

// Stocks
export const getStocks = () => api.get('/admin/stocks');

// Admin Orders (view any user's orders by UNC)
export const getOrdersByUnc = (unc) => api.get(`/admin/orders/${encodeURIComponent(unc)}`);

// Admin Create Order
export const getOrderCustomers = () => api.get('/admin/orders/customers');
export const getOrderProducts = (unc, params) => api.get(`/admin/orders/products/${encodeURIComponent(unc)}`, { params });
export const getOrderAddresses = (unc) => api.get(`/admin/orders/addresses/${encodeURIComponent(unc)}`);
export const getOrderShippingModes = (unc) => api.get(`/admin/orders/shipping/${encodeURIComponent(unc)}`);
export const placeAdminOrder = (data) => api.post('/admin/orders/place', data);
