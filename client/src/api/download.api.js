import api from './axios';

export const getEbrochures = () => api.get('/downloads/ebrochures');

export const downloadPriceListCsv = () =>
  api.get('/downloads/price-list', { responseType: 'blob' });

export const downloadPriceListPdf = () =>
  api.get('/downloads/price-list-pdf', { responseType: 'blob' });
