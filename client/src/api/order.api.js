import api from './axios';
export const getMyOrders = () => api.get('/orders/my-orders');
export const getOpenOrders = () => api.get('/orders/open-orders');
export const getReservedOrders = () => api.get('/orders/reserved-orders');
export const downloadOrder = (po) =>
  api.get(`/orders/download/${po}`, { responseType: 'blob' });
export const downloadOpenOrderPdf = (po) =>
  api.get('/orders/download-open-order', { params: { po }, responseType: 'blob' });
export const cancelOrder = (id) => api.post(`/orders/cancel/${id}`);
export const convertReserved = (po) => api.post(`/orders/convert-reserved/${po}`);
