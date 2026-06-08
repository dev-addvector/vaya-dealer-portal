import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getStocks } from '@/api/admin.api';

const PAGE_SIZE = 20;

export default function StocksPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin-stocks'],
    queryFn: getStocks,
    staleTime: 60 * 60 * 1000,
  });

  const allStocks = data?.data ?? [];

  const sorted = [...allStocks].sort((a, b) => {
    const p = (a.Pattern || '').localeCompare(b.Pattern || '');
    return p !== 0 ? p : (a.Color || '').localeCompare(b.Color || '');
  });

  const filtered = sorted.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (s.Pattern || '').toLowerCase().includes(q) ||
      (s.Color || '').toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-bold text-gray-800">Stocks</h1>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="text-sm border px-3 py-1.5 rounded hover:bg-gray-100 disabled:opacity-50 w-full sm:w-auto"
        >
          {isFetching ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <input
          placeholder="Search by pattern or color..."
          value={search}
          onChange={handleSearch}
          className="border rounded px-3 py-2 text-sm w-full sm:w-72 focus:outline-none focus:ring-1 focus:ring-vaya-primary"
        />
        {!isLoading && !isError && (
          <span className="text-sm text-gray-500">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {isLoading && <p className="text-sm text-gray-500">Loading stock data from ERP...</p>}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-sm text-red-700">
          Failed to load stock data. Make sure the ERP connection is configured.
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <div className="overflow-x-auto rounded-lg shadow">
            <table className="w-full text-sm border-collapse bg-white">
              <thead className="bg-vaya-light text-vaya-dark uppercase text-xs">
                <tr>
                  {['Pattern', 'Color', 'Available Rolls', 'Stock Available'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                      {search ? 'No matching stock found.' : 'No stock data available.'}
                    </td>
                  </tr>
                ) : (
                  paged.map((s, i) => (
                    <tr key={i} className="border-t hover:bg-vaya-light/30">
                      <td className="px-4 py-3 font-medium">{s.Pattern || '—'}</td>
                      <td className="px-4 py-3">{s.Color || '—'}</td>
                      <td className="px-4 py-3">{s['No Of Rolls Available'] ?? '—'}</td>
                      <td className="px-4 py-3">{s['Stock Available'] ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-xs text-gray-500">
              Showing {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={safePage === 1}
                  className="px-2 py-1 rounded border text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >«</button>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="px-2 py-1 rounded border text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
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
                          item === safePage
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >{item}</button>
                    )
                  )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="px-2 py-1 rounded border text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >›</button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={safePage === totalPages}
                  className="px-2 py-1 rounded border text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >»</button>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Stock data is cached for 1 hour. Click Refresh to fetch latest.
          </p>
        </>
      )}
    </div>
  );
}
