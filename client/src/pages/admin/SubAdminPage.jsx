import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { getSubadmins, createSubadmin, updateSubadmin, deleteSubadmin, sendPasswordResetLink } from '@/api/admin.api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { formatDateTimeIST } from '@/utils/dateUtils';

const PAGE_SIZE = 10;

const ROLES = [
  { value: 'sub_admin', label: 'Sub admin' },
  { value: 'zone_admin', label: 'Zone admin' },
  { value: 'qr_admin', label: 'Qr admin' },
];
const ZONES = ['North', 'South', 'East', 'West'];

function SubadminModal({ initial, onClose, onSave, isPending }) {
  const isEdit = !!initial;
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: initial || { name: '', email: '', password: '', role: 'sub_admin', zone: '' },
  });
  const selectedRole = watch('role');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-4 sm:p-6">
        <h2 className="text-lg font-bold mb-4 text-gray-800">{isEdit ? 'Edit Subadmin' : 'Create Subadmin'}</h2>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div>
            <label className="text-xs text-gray-600 block mb-1">Role <span className="text-red-500">*</span></label>
            <select {...register('role', { required: true })} className="w-full border rounded px-3 py-2 text-sm">
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          {selectedRole === 'zone_admin' && (
            <div>
              <label className="text-xs text-gray-600 block mb-1">Zone <span className="text-red-500">*</span></label>
              <select {...register('zone', { required: selectedRole === 'zone_admin' })} className="w-full border rounded px-3 py-2 text-sm">
                <option value="">Select Zone</option>
                {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
              </select>
              {errors.zone && <p className="text-red-500 text-xs mt-1">Zone is required</p>}
            </div>
          )}

          <div>
            <label className="text-xs text-gray-600 block mb-1">Name <span className="text-red-500">*</span></label>
            <input {...register('name', { required: true })} type="text" className="w-full border rounded px-3 py-2 text-sm" />
            {errors.name && <p className="text-red-500 text-xs mt-1">Name is required</p>}
          </div>

          <div>
            <label className="text-xs text-gray-600 block mb-1">Email <span className="text-red-500">*</span></label>
            <input {...register('email', { required: !isEdit })} type="email" disabled={isEdit}
              className={`w-full border rounded px-3 py-2 text-sm ${isEdit ? 'bg-gray-100 text-gray-500' : ''}`} />
            {errors.email && <p className="text-red-500 text-xs mt-1">Email is required</p>}
          </div>

          <div>
            <label className="text-xs text-gray-600 block mb-1">
              Password {isEdit && <span className="text-gray-400">(leave blank to keep current)</span>}
              {!isEdit && <span className="text-red-500"> *</span>}
            </label>
            <input {...register('password', { required: !isEdit })} type="password" className="w-full border rounded px-3 py-2 text-sm" />
            {errors.password && <p className="text-red-500 text-xs mt-1">Password is required</p>}
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={isPending}
              className="bg-blue-500 text-white px-5 py-2 rounded text-sm hover:bg-blue-600 disabled:opacity-60">
              {isPending ? 'Saving...' : (isEdit ? 'Update' : 'Create')}
            </button>
            <button type="button" onClick={onClose} className="border px-5 py-2 rounded text-sm hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}


export default function SubAdminPage() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const canEditDelete = user?.role === 'super_admin';
  const { data, isLoading } = useQuery({ queryKey: ['admin-subadmins'], queryFn: getSubadmins });
  const [modal, setModal] = useState(null); // null | { mode: 'create' | 'edit', data?: object }
  const [page, setPage] = useState(1);
  const subadmins = data?.data ?? [];
  const totalPages = Math.max(1, Math.ceil(subadmins.length / PAGE_SIZE));
  const pagedSubadmins = subadmins.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const create = useMutation({
    mutationFn: createSubadmin,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-subadmins'] }); setModal(null); toast.success('Subadmin created'); },
    onError: (err) => toast.error(err.message || 'Failed to create'),
  });

  const update = useMutation({
    mutationFn: ({ id, ...d }) => updateSubadmin(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-subadmins'] }); setModal(null); toast.success('Subadmin updated'); },
    onError: (err) => toast.error(err.message || 'Failed to update'),
  });

  const remove = useMutation({
    mutationFn: deleteSubadmin,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-subadmins'] }); toast.success('Deleted'); },
    onError: () => toast.error('Failed to delete'),
  });

  const resetPassword = useMutation({
    mutationFn: (id) => sendPasswordResetLink({ userId: id }),
    onSuccess: () => toast.success('Password reset link sent'),
    onError: (err) => toast.error(err.message || 'Failed to send reset link'),
  });

  const handleSave = (formData) => {
    if (modal?.mode === 'edit') {
      update.mutate({ id: modal.data.id, ...formData });
    } else {
      create.mutate(formData);
    }
  };

  const handleDelete = (s) => {
    if (window.confirm(`Delete "${s.name}"? This cannot be undone.`)) {
      remove.mutate(s.id);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-bold text-gray-800">Subadmin</h1>
        <button onClick={() => setModal({ mode: 'create' })}
          className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600 w-full sm:w-auto">
          Create Subadmin
        </button>
      </div>

      {isLoading && <p className="text-gray-500 text-sm">Loading...</p>}

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="w-full text-sm border-collapse bg-white">
          <thead className="bg-vaya-light text-vaya-dark uppercase text-xs">
            <tr>
              {['Name', 'Email', 'Role', 'Zone', 'Created At', 'Action'].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subadmins.length === 0 && !isLoading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No subadmins found.</td></tr>
            ) : (
              pagedSubadmins.map((s) => (
                <tr key={s.id} className="border-t hover:bg-vaya-light/30">
                  <td className="px-4 py-3">{s.name}</td>
                  <td className="px-4 py-3">{s.email}</td>
                  <td className="px-4 py-3">{s.roleLabel || s.role}</td>
                  <td className="px-4 py-3">{s.zone || '-'}</td>
                  <td className="px-4 py-3 text-xs">{formatDateTimeIST(s.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col sm:flex-row gap-1">
                      {canEditDelete && (
                        <>
                          <button
                            onClick={() => setModal({ mode: 'edit', data: s })}
                            className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600">
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(s)}
                            disabled={remove.isPending}
                            className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 disabled:opacity-60">
                            Delete
                          </button>
                        </>
                      )}
                      <button
                        title="Send password reset link"
                        onClick={() => resetPassword.mutate(s.id)}
                        disabled={resetPassword.isPending}
                        className="inline-flex items-center justify-center w-[28px] h-[28px] rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-60 text-gray-600"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1m0 13A6 6 0 1 1 8 2a6 6 0 0 1 0 12"/>
                          <path d="M7.5 4.5a.5.5 0 0 1 1 0v3.25l2.25 1.3a.5.5 0 0 1-.5.866L7.75 8.5A.5.5 0 0 1 7.5 8z"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <p className="text-xs text-gray-500">
          Showing {subadmins.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, subadmins.length)} of {subadmins.length} entr{subadmins.length !== 1 ? 'ies' : 'y'}
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="px-2 py-1 rounded border text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >«</button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2 py-1 rounded border text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === '…' ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-xs text-gray-400">…</span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPage(item)}
                    className={`px-2.5 py-1 rounded border text-xs transition-colors ${
                      item === page
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >{item}</button>
                )
              )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2 py-1 rounded border text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >›</button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="px-2 py-1 rounded border text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >»</button>
          </div>
        )}
      </div>

      {modal && (
        <SubadminModal
          initial={modal.mode === 'edit' ? modal.data : null}
          onClose={() => setModal(null)}
          onSave={handleSave}
          isPending={create.isPending || update.isPending}
        />
      )}
    </div>
  );
}
