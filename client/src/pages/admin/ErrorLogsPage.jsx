import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { getErrorLogs } from '@/api/admin.api';
import DateRangeFilter from '@/components/DateRangeFilter';
import { todayIST, formatDateTimeIST } from '@/utils/dateUtils';

const LOGS_EMAIL = 'saurabh@addvector.com';
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function ErrorLogsPage() {
  const { user } = useAuthStore();

  if (user?.email !== LOGS_EMAIL) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <ErrorLogsContent />;
}

function last7DaysIST() {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function ErrorLogsContent() {
  const today = todayIST();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [from, setFrom] = useState(last7DaysIST);
  const [to, setTo] = useState(today);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-error-logs', page, perPage, from, to],
    queryFn: () => getErrorLogs({ page, perPage, from, to }),
  });

  const logs = data?.data?.data ?? [];
  const total = data?.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const fromEntry = total === 0 ? 0 : (page - 1) * perPage + 1;
  const toEntry = Math.min(page * perPage, total);

  function getPageNumbers() {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, '…', totalPages];
    if (page >= totalPages - 3) return [1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '…', page - 1, page, page + 1, '…', totalPages];
  }

  function handleDateChange({ from: f, to: t }) {
    setFrom(f);
    setTo(t);
    setPage(1);
  }

  function clearFilters() {
    setFrom(last7DaysIST());
    setTo(todayIST());
    setPage(1);
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4 text-gray-800">Error Logs</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
          <span className="text-sm text-gray-600 shrink-0">Date Range</span>
          <DateRangeFilter
            from={from}
            to={to}
            onChange={handleDateChange}
            onClear={clearFilters}
          />
        </div>
      </div>

      {/* Show entries + count row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Show</span>
          <select
            value={perPage}
            onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-vaya-green"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span>entries</span>
        </div>
      </div>

      {isLoading && <p className="text-gray-500 text-sm">Loading…</p>}

      {!isLoading && (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="w-full text-sm border-collapse bg-white">
            <thead className="bg-vaya-light text-vaya-dark uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Date &amp; Time</th>
                <th className="px-4 py-3 text-left font-semibold">Origin</th>
                <th className="px-4 py-3 text-left font-semibold">Request Path</th>
                <th className="px-4 py-3 text-left font-semibold">Error Message</th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Response Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">
                    No error logs found
                  </td>
                </tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="border-t hover:bg-vaya-light/30">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600 text-xs">
                    {formatDateTimeIST(log.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      log.origin === 'ERP'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {log.origin}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-mono text-xs max-w-[200px] truncate" title={log.requestPath}>
                    {log.requestPath || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-xs max-w-[360px]">
                    <span className="line-clamp-2" title={log.errorMessage}>
                      {log.errorMessage || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                    {log.responseTime != null ? `${log.responseTime} ms` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 gap-3">
          <p className="text-sm text-gray-500 text-center sm:text-left">
            {total === 0
              ? 'No entries found'
              : `Showing ${fromEntry} to ${toEntry} of ${total} entries`}
          </p>

          <div className="flex items-center gap-1 justify-center">
            <button
              disabled={page <= 1}
              onClick={() => setPage(1)}
              className="px-2.5 py-1.5 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
            >
              «
            </button>
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
            >
              Previous
            </button>

            {getPageNumbers().map((n, i) =>
              n === '…' ? (
                <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-sm text-gray-400">…</span>
              ) : (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`px-3 py-1.5 text-sm border rounded ${
                    n === page
                      ? 'bg-vaya-primary text-white border-vaya-primary'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {n}
                </button>
              )
            )}

            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
            >
              Next
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
              className="px-2.5 py-1.5 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
