import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as contactApi from '@/api/contact.api';
import toast from 'react-hot-toast';

export const useContacts = () =>
  useQuery({ queryKey: ['contacts'], queryFn: contactApi.getContacts });

export const useAddContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: contactApi.addContact,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contacts'] }); toast.success('Contact added'); },
    onError: (err) => toast.error(err.message || 'Failed'),
  });
};

export const useUpdateContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: contactApi.updateContact,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contacts'] }); toast.success('Contact updated'); },
  });
};

export const useDeleteContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: contactApi.deleteContact,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contacts'] }); toast.success('Contact deleted'); },
  });
};

export const useSetDefaultContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: contactApi.setDefaultContact,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  });
};
