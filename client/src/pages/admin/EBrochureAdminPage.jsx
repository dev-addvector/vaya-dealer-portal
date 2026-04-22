import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { getEBrochures, uploadEBrochure, deleteEBrochure } from '@/api/admin.api';
import toast from 'react-hot-toast';

export default function EBrochureAdminPage() {
  const qc = useQueryClient();
  const fileRef = useRef();
  const { data, isLoading } = useQuery({ queryKey: ['admin-ebrochures'], queryFn: getEBrochures });
  const brochures = data?.data ?? [];

  const upload = useMutation({
    mutationFn: (file) => {
      const f = new FormData();
      f.append('file', file);
      return uploadEBrochure(f);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-ebrochures'] });
      toast.success('E-Brochure uploaded');
      if (fileRef.current) fileRef.current.value = '';
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Upload failed'),
  });

  const remove = useMutation({
    mutationFn: deleteEBrochure,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-ebrochures'] }); toast.success('Deleted'); },
    onError: () => toast.error('Delete failed'),
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { toast.error('Only PDF files are allowed'); return; }
    upload.mutate(file);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">E-Brochure</h1>
        <label className="bg-vaya-primary text-white px-4 py-1.5 rounded text-sm hover:bg-vaya-dark cursor-pointer">
          {upload.isPending ? 'Uploading...' : '+ Upload PDF'}
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
            disabled={upload.isPending}
          />
        </label>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Upload PDF brochures here. Uploaded files are available for customers to download from the E-Brochure section.
      </p>

      {isLoading && <p className="text-sm text-gray-500">Loading...</p>}

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="w-full text-sm border-collapse bg-white">
          <thead className="bg-vaya-light text-vaya-dark uppercase text-xs">
            <tr>
              {['File Name', 'Uploaded', 'Download', 'Action'].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {brochures.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  No e-brochures uploaded yet. Click &ldquo;+ Upload PDF&rdquo; to add one.
                </td>
              </tr>
            ) : (
              brochures.map((b) => (
                <tr key={b.id} className="border-t hover:bg-vaya-light/30">
                  <td className="px-4 py-3 font-medium">{b.name || b.filename}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={b.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-vaya-primary text-xs hover:underline"
                    >
                      View PDF
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => remove.mutate(b.id)}
                      disabled={remove.isPending}
                      className="text-red-500 text-xs hover:underline disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
