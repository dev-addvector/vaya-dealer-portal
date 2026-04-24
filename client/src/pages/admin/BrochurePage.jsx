import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import { getBrochures, uploadBrochureCSV } from '@/api/admin.api';
// deleteBrochure — re-import when Action column is restored
import toast from 'react-hot-toast';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function BrochurePage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-brochures'], queryFn: getBrochures });
  const [showUpload, setShowUpload] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const fileRef = useRef(null);

  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const brochures = data?.data ?? [];
  const latestFile = data?.latestFile;
  const latestDate = data?.latestDate;

  const upload = useMutation({
    mutationFn: () => {
      const f = new FormData();
      f.append('csv_file', csvFile);
      return uploadBrochureCSV(f);
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin-brochures'] });
      setShowUpload(false);
      setCsvFile(null);
      if (fileRef.current) fileRef.current.value = '';
      toast.success(res.data?.message || 'CSV uploaded successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Upload failed'),
  });

  // const remove = useMutation({ ... }); // re-enable with deleteBrochure when Action column is restored

  const filtered = brochures.filter((b) =>
    (b.patternName ?? '').toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
  };

  const handlePageSize = (val) => {
    setPageSize(Number(val));
    setPage(1);
  };

  return (
    <div>
      {/* Header card */}
      <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Price List (Brochures)</h1>
          {latestFile && (
            <p className="text-xs text-gray-500 mt-0.5">
              Latest: <span className="font-medium text-gray-700">{latestFile}</span>
              {latestDate && (
                <span className="ml-2">
                  — {new Date(latestDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              )}
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {latestFile && (
            <a
              href={`/uploads/brochures/${latestFile}`}
              download={latestFile}
              className="border border-vaya-primary text-vaya-primary px-4 py-1.5 rounded text-sm hover:bg-vaya-light"
            >
              Download Sample CSV
            </a>
          )}
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="bg-vaya-primary text-white px-4 py-1.5 rounded text-sm hover:bg-vaya-dark"
          >
            Upload CSV
          </button>
        </div>
      </div>

      {/* Upload form */}
      {showUpload && (
        <div className="bg-white rounded-lg shadow p-4 mb-4 space-y-3">
          <p className="text-sm text-gray-600">
            Upload a CSV with a <strong>Collection</strong> column. Each unique collection becomes a brochure entry.
            Patterns not in the new CSV will be marked inactive.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={(e) => setCsvFile(e.target.files[0])}
            className="text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={() => upload.mutate()}
              disabled={!csvFile || upload.isPending}
              className="bg-vaya-primary text-white px-4 py-1.5 rounded text-sm hover:bg-vaya-dark disabled:opacity-60"
            >
              {upload.isPending ? 'Processing...' : 'Upload & Process'}
            </button>
            <button
              onClick={() => { setShowUpload(false); setCsvFile(null); if (fileRef.current) fileRef.current.value = ''; }}
              className="border border-gray-300 text-gray-600 px-4 py-1.5 rounded text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          Show
          <select
            value={pageSize}
            onChange={(e) => handlePageSize(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          entries
        </div>
        <input
          type="text"
          placeholder="Search catalog / pattern..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full sm:w-64"
        />
      </div>

      {isLoading && <p className="text-gray-500 text-sm">Loading...</p>}

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="w-full text-sm border-collapse bg-white">
          <thead className="bg-vaya-light text-vaya-dark uppercase text-xs">
            <tr>
              {['Catalog / Pattern', 'Price List QR', 'WOP QR' /*, 'CSV', 'Status', 'Action'*/].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && !isLoading && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-400 text-sm">
                  {search ? 'No matching entries found' : 'No brochures found'}
                </td>
              </tr>
            )}
            {paginated.map((b) => (
              <tr key={b.id} className="border-t hover:bg-vaya-light/30">
                <td className="px-4 py-3 font-medium">{b.patternName}</td>
                <td className="px-4 py-3">
                  {b.qrCode ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={`/uploads/qr/${b.qrCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-vaya-primary text-xs hover:underline"
                      >
                        {b.qrCode}
                      </a>
                      <a
                        href={`/uploads/qr/${b.qrCode}`}
                        download={b.qrCode}
                        title="Download"
                        className="text-gray-400 hover:text-vaya-primary text-xs"
                      >
                        ↓
                      </a>
                    </div>
                  ) : <span className="text-gray-400 text-xs">—</span>}
                </td>
                <td className="px-4 py-3">
                  {b.qrCode2 ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={`/uploads/qr/${b.qrCode2}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-vaya-primary text-xs hover:underline"
                      >
                        {b.qrCode2}
                      </a>
                      <a
                        href={`/uploads/qr/${b.qrCode2}`}
                        download={b.qrCode2}
                        title="Download"
                        className="text-gray-400 hover:text-vaya-primary text-xs"
                      >
                        ↓
                      </a>
                    </div>
                  ) : <span className="text-gray-400 text-xs">—</span>}
                </td>
                {/* <td className="px-4 py-3">
                  {b.fileName ? (
                    <button
                      onClick={() => handleDownload('csv', b.brochureKey, b.fileName)}
                      className="text-vaya-primary text-xs hover:underline"
                    >
                      {b.fileName}
                    </button>
                  ) : <span className="text-gray-400 text-xs">—</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${b.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {b.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => { if (confirm(`Delete "${b.patternName}"?`)) remove.mutate(b.id); }}
                    className="text-red-500 text-xs hover:underline"
                  >
                    Delete
                  </button>
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-3 text-sm text-gray-600">
        <span>
          Showing {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} of {filtered.length} entries
          {search && ` (filtered from ${brochures.length} total)`}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(1)}
            disabled={safePage === 1}
            className="px-2 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
          >
            «
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="px-2 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
            .reduce((acc, p, idx, arr) => {
              if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
              acc.push(p);
              return acc;
            }, [])
            .map((item, idx) =>
              item === '…' ? (
                <span key={`ellipsis-${idx}`} className="px-2 py-1 text-gray-400">…</span>
              ) : (
                <button
                  key={item}
                  onClick={() => setPage(item)}
                  className={`px-2.5 py-1 rounded border text-sm ${
                    item === safePage
                      ? 'bg-vaya-primary text-white border-vaya-primary'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {item}
                </button>
              )
            )}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="px-2 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
          >
            ›
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={safePage === totalPages}
            className="px-2 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}
