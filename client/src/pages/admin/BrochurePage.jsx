import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { getBrochures, createBrochure, deleteBrochure } from '@/api/admin.api';
import toast from 'react-hot-toast';

export default function BrochurePage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-brochures'], queryFn: getBrochures });
  const [form, setForm] = useState({ title: '', patternName: '', file: null });
  const [showForm, setShowForm] = useState(false);
  const brochures = data?.data ?? [];

  const create = useMutation({
    mutationFn: () => {
      const f = new FormData();
      f.append('title', form.title);
      f.append('patternName', form.patternName);
      if (form.file) f.append('file', form.file);
      return createBrochure(f);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-brochures'] }); setShowForm(false); toast.success('Brochure created'); },
    onError: (err) => toast.error(err.message || 'Failed'),
  });

  const remove = useMutation({
    mutationFn: deleteBrochure,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-brochures'] }); toast.success('Deleted'); },
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-bold text-gray-800">Brochures</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-vaya-primary text-white px-4 py-1.5 rounded text-sm hover:bg-vaya-dark w-full sm:w-auto">
          + New Brochure
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-4 mb-4 space-y-3">
          <input placeholder="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full border rounded px-3 py-1.5 text-sm" />
          <input placeholder="Pattern Name" value={form.patternName} onChange={(e) => setForm((f) => ({ ...f, patternName: e.target.value }))} className="w-full border rounded px-3 py-1.5 text-sm" />
          <input type="file" accept=".pdf,image/*" onChange={(e) => setForm((f) => ({ ...f, file: e.target.files[0] }))} className="text-sm" />
          <button onClick={() => create.mutate()} disabled={create.isPending} className="bg-vaya-primary text-white px-4 py-1.5 rounded text-sm hover:bg-vaya-dark disabled:opacity-60 w-full sm:w-auto">
            {create.isPending ? 'Creating...' : 'Create'}
          </button>
        </div>
      )}

      {isLoading && <p className="text-gray-500 text-sm">Loading...</p>}
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="w-full text-sm border-collapse bg-white">
          <thead className="bg-vaya-light text-vaya-dark uppercase text-xs">
            <tr>
              {['Title', 'Pattern', 'Key', 'Status', 'Action'].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {brochures.map((b) => (
              <tr key={b.id} className="border-t hover:bg-vaya-light/30">
                <td className="px-4 py-3">{b.title}</td>
                <td className="px-4 py-3">{b.patternName || '—'}</td>
                <td className="px-4 py-3 font-mono text-xs">{b.brochureKey}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${b.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {b.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => remove.mutate(b.id)} className="text-red-500 text-xs hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
