import api from './axios';
export const loadProducts = (data) => api.post('/products/load', data);
export const getCart = () => api.get('/products/cart');
export const addToCart = (data) => api.post('/products/cart/add', data);
export const editCartItem = (data) => api.put('/products/cart/edit', data);
export const deleteCartItem = (id) => api.delete(`/products/cart/${id}`);
export const getShippingModes = () => api.get('/products/shipping-modes');
export const placeOrder = (data) => api.post('/products/place-order', data);
export const getProductFilters = () => api.get('/products/filters');
