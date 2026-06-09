import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { getAds, createAd, deleteAd } from '@/api/admin.api';
import toast from 'react-hot-toast';

const toIST = (utcStr) => {
  if (!utcStr) return '—';
  return new Date(utcStr).toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const toISTWithTime = (utcStr) => {
  if (!utcStr) return '—';
  const d = new Date(utcStr);
  const date = d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
  return `${date} - ${time}`;
};

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm mx-4">
        <p className="text-sm text-gray-700 mb-5">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-1.5 text-sm rounded bg-red-500 text-white hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-ads'], queryFn: getAds });
  const [form, setForm] = useState({ title: '', startDate: '', endDate: '' });
  const [showForm, setShowForm] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const ads = data?.data ?? [];

  const create = useMutation({
    mutationFn: () => createAd({ title: form.title, startDate: form.startDate, endDate: form.endDate }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-ads'] }); setShowForm(false); toast.success('Ad created'); },
    onError: (err) => toast.error(err.message || 'Failed'),
  });

  const remove = useMutation({
    mutationFn: deleteAd,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-ads'] }); toast.success('Ad deleted'); },
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-bold text-gray-800">Ads</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-vaya-primary text-white px-4 py-1.5 rounded text-sm hover:bg-vaya-dark w-full sm:w-auto">
          + New Ad
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-4 mb-4 space-y-3">
          <input placeholder="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full border rounded px-3 py-1.5 text-sm" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500 block mb-1">Start Date</label><input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} className="w-full border rounded px-3 py-1.5 text-sm" /></div>
            <div><label className="text-xs text-gray-500 block mb-1">End Date</label><input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} className="w-full border rounded px-3 py-1.5 text-sm" /></div>
          </div>
          <button onClick={() => create.mutate()} disabled={create.isPending} className="bg-vaya-primary text-white px-4 py-1.5 rounded text-sm hover:bg-vaya-dark disabled:opacity-60 w-full sm:w-auto">
            {create.isPending ? 'Creating...' : 'Create Ad'}
          </button>
        </div>
      )}

      {isLoading && <p className="text-gray-500 text-sm">Loading...</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ads.map((ad) => (
          <div key={ad.id} className="bg-white rounded-lg shadow p-4 flex flex-col justify-between">
            <div className="space-y-1.5">
              <p className="font-medium text-sm break-words">{ad.title}</p>
              <p className="text-xs text-gray-500">
                <span className="text-gray-400">Start Date: </span>{toIST(ad.startDate)}
              </p>
              <p className="text-xs text-gray-500">
                <span className="text-gray-400">End Date: </span>{toIST(ad.endDate)}
              </p>
              <p className="text-xs text-gray-500">
                <span className="text-gray-400">Created At: </span>{toISTWithTime(ad.createdAt)}
              </p>
            </div>
            <button
              onClick={() => setConfirmId(ad.id)}
              className="text-red-500 text-xs hover:underline mt-3 self-start"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {confirmId && (
        <ConfirmDialog
          message="Are you sure you want to delete this ad? This action cannot be undone."
          onConfirm={() => { remove.mutate(confirmId); setConfirmId(null); }}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
