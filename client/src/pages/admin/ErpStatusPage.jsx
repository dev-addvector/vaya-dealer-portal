import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getErpStatus, getErpStatusHistory } from '@/api/erp.api';

const PAGE_SIZE = 20;

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: true,
  });
}

export default function ErpStatusPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, dataUpdatedAt, refetch } = useQuery({
    queryKey: ['erp-status'],
    queryFn: getErpStatus,
    refetchInterval: 30 * 1000,
    staleTime: 30 * 1000,
  });

  const { data: histData, isLoading: histLoading, isFetching: histFetching } = useQuery({
    queryKey: ['erp-status-history', page],
    queryFn: () => getErpStatusHistory(page, PAGE_SIZE),
    staleTime: 60 * 1000,
    keepPreviousData: true,
  });

  const online = isLoading ? null : (data?.online ?? false);

  const statusColor  = online === null ? '#9ca3af' : online ? '#22c55e' : '#ef4444';
  const statusBg     = online === null ? '#f3f4f6' : online ? '#f0fdf4' : '#fef2f2';
  const statusBorder = online === null ? '#e5e7eb' : online ? '#bbf7d0' : '#fecaca';
  const statusLabel  = online === null ? 'Checking…' : online ? 'Online' : 'Offline';
  const statusDesc   = online === null
    ? 'Checking ERP server status…'
    : online
    ? 'ERP server is reachable and responding.'
    : 'ERP server is not responding. Orders and stock data may be unavailable.';

  const lastChecked = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    : null;

  const records    = histData?.data?.records ?? [];
  const total      = histData?.data?.total ?? 0;
  const totalPages = histData?.data?.totalPages ?? 1;

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold mb-6 text-gray-800">ERP Server Status</h1>

      {/* Current status card */}
      <div className="rounded-lg p-6 border" style={{ backgroundColor: statusBg, borderColor: statusBorder }}>
        <div className="flex items-center gap-4 mb-4">
          <span style={{
            display: 'inline-block', width: 20, height: 20, borderRadius: '50%',
            backgroundColor: statusColor,
            boxShadow: online ? `0 0 0 5px ${statusColor}33` : 'none',
            flexShrink: 0,
          }} />
          <span className="text-2xl font-bold" style={{ color: statusColor }}>{statusLabel}</span>
          {isFetching && !isLoading && (
            <span className="text-xs text-gray-400 ml-auto">Refreshing…</span>
          )}
        </div>

        <p className="text-sm text-gray-600 mb-5">{statusDesc}</p>

        <div className="flex items-center justify-between">
          {lastChecked ? (
            <span className="text-xs text-gray-400">Last checked: {lastChecked}</span>
          ) : (
            <span />
          )}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-sm px-4 py-1.5 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {isFetching ? 'Checking…' : 'Check Now'}
          </button>
        </div>
      </div>

      <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <p className="text-xs text-gray-500">
          Status refreshes automatically every 30 seconds. Use <strong>Check Now</strong> for an immediate check.
        </p>
      </div>

      {/* History table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Status History
            {total > 0 && <span className="ml-2 text-xs text-gray-400 font-normal">({total} records)</span>}
          </span>
          {histFetching && !histLoading && (
            <span className="text-xs text-gray-400">Loading…</span>
          )}
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 w-12">#</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Checked At</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 w-24">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {histLoading ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-xs text-gray-400">Loading…</td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-xs text-gray-400">No records found.</td>
              </tr>
            ) : (
              records.map((log, i) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5 text-xs text-gray-400">
                    {(page - 1) * PAGE_SIZE + i + 1}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-600">{fmt(log.checkedAt)}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5">
                      <span style={{
                        display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
                        backgroundColor: log.online ? '#22c55e' : '#ef4444', flexShrink: 0,
                      }} />
                      <span className="text-xs font-medium" style={{ color: log.online ? '#16a34a' : '#dc2626' }}>
                        {log.online ? 'Online' : 'Offline'}
                      </span>
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || histFetching}
                className="text-xs px-3 py-1.5 rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              {/* page number pills — show a sliding window */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === '…' ? (
                      <span key={`ellipsis-${idx}`} className="text-xs text-gray-400 px-1">…</span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setPage(item)}
                        disabled={histFetching}
                        className={`text-xs w-7 h-7 rounded border transition-colors ${
                          item === page
                            ? 'border-gray-800 bg-gray-800 text-white'
                            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || histFetching}
                className="text-xs px-3 py-1.5 rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
