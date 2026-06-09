import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getStocks } from '@/api/admin.api';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function StocksPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  function getPageNumbers() {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (safePage <= 4) return [1, 2, 3, 4, 5, '…', totalPages];
    if (safePage >= totalPages - 3) return [1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '…', safePage - 1, safePage, safePage + 1, '…', totalPages];
  }

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

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Show</span>
          <select
            value={perPage}
            onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-vaya-green"
          >
            {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <span>entries</span>
        </div>
        <input
          placeholder="Search by pattern or color..."
          value={search}
          onChange={handleSearch}
          className="border rounded px-3 py-2 text-sm w-full sm:w-72 focus:outline-none focus:ring-1 focus:ring-vaya-primary"
        />
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
                    <th key={h} className="px-4 py-3 text-center font-semibold">{h}</th>
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

          <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 gap-3">
            <p className="text-sm text-gray-500 text-center sm:text-left">
              {filtered.length === 0
                ? 'No entries found'
                : `Showing ${(safePage - 1) * perPage + 1} to ${Math.min(safePage * perPage, filtered.length)} of ${filtered.length} entries`}
            </p>

            <div className="flex items-center gap-1 justify-center">
              <button
                disabled={safePage <= 1}
                onClick={() => setPage(1)}
                className="px-2.5 py-1.5 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
              >«</button>
              <button
                disabled={safePage <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
              >Previous</button>

              {getPageNumbers().map((n, i) =>
                n === '…' ? (
                  <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-sm text-gray-400">…</span>
                ) : (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`px-3 py-1.5 text-sm border rounded ${
                      n === safePage
                        ? 'bg-vaya-primary text-white border-vaya-primary'
                        : 'hover:bg-gray-50'
                    }`}
                  >{n}</button>
                )
              )}

              <button
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
              >Next</button>
              <button
                disabled={safePage >= totalPages}
                onClick={() => setPage(totalPages)}
                className="px-2.5 py-1.5 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
              >»</button>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Stock data is cached for 1 hour. Click Refresh to fetch latest.
          </p>
        </>
      )}
    </div>
  );
}
