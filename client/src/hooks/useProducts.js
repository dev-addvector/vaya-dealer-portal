import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as productApi from '@/api/product.api';
import toast from 'react-hot-toast';

export const useShippingModes = () =>
  useQuery({ queryKey: ['shipping-modes'], queryFn: productApi.getShippingModes });

export const useLoadProducts = (filters) =>
  useQuery({
    queryKey: ['products', filters],
    queryFn: () => productApi.loadProducts(filters),
    enabled: !!filters,
  });

export const useCart = () =>
  useQuery({ queryKey: ['cart'], queryFn: productApi.getCart });

export const useAddToCart = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: productApi.addToCart,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cart'] }); toast.success('Added to cart'); },
    onError: (err) => toast.error(err.message || 'Failed to add to cart'),
  });
};

export const useEditCartItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: productApi.editCartItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });
};

export const useDeleteCartItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: productApi.deleteCartItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });
};

export const usePlaceOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: productApi.placeOrder,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cart'] });
      qc.invalidateQueries({ queryKey: ['my-orders'] });
      toast.success('Order placed successfully!');
    },
    onError: (err) => toast.error(err.message || 'Failed to place order'),
  });
};
