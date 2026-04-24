import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { getAds, createAd, deleteAd } from '@/api/admin.api';
import toast from 'react-hot-toast';

export default function AdsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-ads'], queryFn: getAds });
  const [form, setForm] = useState({ title: '', startDate: '', endDate: '', image: null });
  const [showForm, setShowForm] = useState(false);
  const ads = data?.data ?? [];

  const create = useMutation({
    mutationFn: () => {
      const f = new FormData();
      f.append('title', form.title);
      f.append('startDate', form.startDate);
      f.append('endDate', form.endDate);
      if (form.image) f.append('image', form.image);
      return createAd(f);
    },
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
          <input type="file" accept="image/*" onChange={(e) => setForm((f) => ({ ...f, image: e.target.files[0] }))} className="text-sm" />
          <button onClick={() => create.mutate()} disabled={create.isPending} className="bg-vaya-primary text-white px-4 py-1.5 rounded text-sm hover:bg-vaya-dark disabled:opacity-60 w-full sm:w-auto">
            {create.isPending ? 'Creating...' : 'Create Ad'}
          </button>
        </div>
      )}

      {isLoading && <p className="text-gray-500 text-sm">Loading...</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ads.map((ad) => (
          <div key={ad.id} className="bg-white rounded-lg shadow p-4 flex flex-col justify-between">
            <div>
              <p className="font-medium text-sm break-words">{ad.title}</p>
              <p className="text-xs text-gray-500 mt-1">
                {ad.startDate?.slice(0, 10)} → {ad.endDate?.slice(0, 10)}
              </p>
            </div>
            <button onClick={() => remove.mutate(ad.id)} className="text-red-500 text-xs hover:underline mt-2 self-start">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
