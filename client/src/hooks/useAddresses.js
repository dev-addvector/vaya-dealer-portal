import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as addressApi from '@/api/address.api';
import toast from 'react-hot-toast';

export const useAddresses = () =>
  useQuery({ queryKey: ['addresses'], queryFn: addressApi.getAddresses });

export const useAddAddress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addressApi.addAddress,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['addresses'] }); toast.success('Address added'); },
    onError: (err) => toast.error(err.message || 'Failed'),
  });
};

export const useUpdateAddress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addressApi.updateAddress,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['addresses'] }); toast.success('Address updated'); },
  });
};

export const useDeleteAddress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addressApi.deleteAddress,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['addresses'] }); toast.success('Address deleted'); },
  });
};

export const useSetDefaultAddress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addressApi.setDefaultAddress,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] }),
  });
};
