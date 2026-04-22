import api from './axios';
export const getAddresses = () => api.get('/addresses');
export const addAddress = (data) => api.post('/addresses', data);
export const updateAddress = (data) => api.put('/addresses', data);
export const deleteAddress = (id) => api.delete(`/addresses/${id}`);
export const setDefaultAddress = (id) => api.post('/addresses/set-default', { id });
