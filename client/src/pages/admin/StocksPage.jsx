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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Stocks</h1>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="text-sm border px-3 py-1.5 rounded hover:bg-gray-100 disabled:opacity-50"
        >
          {isFetching ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <input
          placeholder="Search by pattern or color..."
          value={search}
          onChange={handleSearch}
          className="border rounded px-3 py-2 text-sm w-72 focus:outline-none focus:ring-1 focus:ring-vaya-primary"
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

          <div className="flex items-center gap-2 mt-4">
            <button
              disabled={safePage <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-gray-100"
            >
              ← Prev
            </button>
            <span className="text-sm text-gray-600">
              Page {safePage} of {totalPages}
            </span>
            <button
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-gray-100"
            >
              Next →
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Stock data is cached for 1 hour. Click Refresh to fetch latest.
          </p>
        </>
      )}
    </div>
  );
}
