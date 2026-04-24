import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { getSubadmins, createSubadmin, updateSubadmin, deleteSubadmin } from '@/api/admin.api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

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

const formatDate = (v) => {
  if (!v) return '-';
  try { return new Date(v).toISOString().replace('T', ' ').slice(0, 19); } catch { return '-'; }
};

export default function SubAdminPage() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const canEditDelete = user?.role === 'super_admin';
  const { data, isLoading } = useQuery({ queryKey: ['admin-subadmins'], queryFn: getSubadmins });
  const [modal, setModal] = useState(null); // null | { mode: 'create' | 'edit', data?: object }
  const subadmins = data?.data ?? [];

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
              subadmins.map((s) => (
                <tr key={s.id} className="border-t hover:bg-vaya-light/30">
                  <td className="px-4 py-3">{s.name}</td>
                  <td className="px-4 py-3">{s.email}</td>
                  <td className="px-4 py-3">{s.roleLabel || s.role}</td>
                  <td className="px-4 py-3">{s.zone || '-'}</td>
                  <td className="px-4 py-3 text-xs">{formatDate(s.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col sm:flex-row gap-1">
                      {canEditDelete && (
                        <>
                          <button
                            onClick={() => setModal({ mode: 'edit', data: { ...s, role: s.role === 'subadmin' ? 'sub_admin' : s.role } })}
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
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-2 text-xs text-gray-500">
        Showing {subadmins.length} entr{subadmins.length !== 1 ? 'ies' : 'y'}
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
