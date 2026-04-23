import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import * as orderApi from '@/api/order.api';
import toast from 'react-hot-toast';

export const useMyOrders = () =>
  useQuery({ queryKey: ['my-orders'], queryFn: orderApi.getMyOrders });

export const useOpenOrders = () =>
  useQuery({ queryKey: ['open-orders'], queryFn: orderApi.getOpenOrders });

export const useReservedOrders = () =>
  useQuery({ queryKey: ['reserved-orders'], queryFn: orderApi.getReservedOrders });

export const useCancelOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: orderApi.cancelOrder,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-orders'] }); toast.success('Order cancelled'); },
    onError: (err) => toast.error(err.message || 'Failed to cancel order'),
  });
};

export const useConvertReserved = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: orderApi.convertReserved,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Items added to cart');
      navigate('/cart', { state: { reserveDetails: res.data } });
    },
    onError: (err) => toast.error(err.message || 'Failed to convert order'),
  });
};
