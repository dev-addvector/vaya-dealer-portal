import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getErpStatus, getErpStatusHistory } from '@/api/erp.api';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

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
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[1]);

  const { data, isLoading, isFetching, dataUpdatedAt, refetch } = useQuery({
    queryKey: ['erp-status'],
    queryFn: getErpStatus,
    staleTime: 0,
  });

  const { data: histData, isLoading: histLoading, isFetching: histFetching } = useQuery({
    queryKey: ['erp-status-history', page, pageSize],
    queryFn: () => getErpStatusHistory(page, pageSize),
    staleTime: 0,
    placeholderData: keepPreviousData,
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

  const records    = histData?.records ?? [];
  const total      = histData?.total ?? 0;
  const totalPages = histData?.totalPages ?? 1;

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
          The <strong>Service History</strong> shows ERP server status captured every 15 minutes. Use <strong>Check Now</strong> for an immediate check.
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
                    {(page - 1) * pageSize + i + 1}
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
        {total > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 flex flex-wrap items-center justify-center lg:justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-gray-500">Rows per page:</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="text-sm border rounded px-1.5 py-1 bg-white text-gray-600 outline-none cursor-pointer"
              >
                {PAGE_SIZE_OPTIONS.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1 justify-center">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(1)}
                  className="px-2.5 py-1.5 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
                >«</button>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
                >Previous</button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                  .reduce((acc, n, idx, arr) => {
                    if (idx > 0 && n - arr[idx - 1] > 1) acc.push('…');
                    acc.push(n);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === '…' ? (
                      <span key={`e-${idx}`} className="px-2 py-1.5 text-sm text-gray-400">…</span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setPage(item)}
                        className={`px-3 py-1.5 text-sm border rounded ${
                          item === page
                            ? 'bg-vaya-primary text-white border-vaya-primary'
                            : 'hover:bg-gray-50'
                        }`}
                      >{item}</button>
                    )
                  )}

                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
                >Next</button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(totalPages)}
                  className="px-2.5 py-1.5 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
                >»</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
