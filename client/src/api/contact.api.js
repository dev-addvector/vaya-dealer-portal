import api from './axios';
export const getContacts = () => api.get('/contacts');
export const addContact = (data) => api.post('/contacts', data);
export const updateContact = (data) => api.put('/contacts', data);
export const deleteContact = (id) => api.delete(`/contacts/${id}`);
export const setDefaultContact = (id) => api.post('/contacts/set-default', { id });
