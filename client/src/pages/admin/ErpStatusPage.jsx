import { useQuery } from '@tanstack/react-query';
import { getErpStatus } from '@/api/erp.api';

export default function ErpStatusPage() {
  const { data, isLoading, isFetching, dataUpdatedAt, refetch } = useQuery({
    queryKey: ['erp-status'],
    queryFn: getErpStatus,
    refetchInterval: 30 * 1000,
    staleTime: 30 * 1000,
  });

  const online = isLoading ? null : (data?.online ?? false);

  const statusColor = online === null ? '#9ca3af' : online ? '#22c55e' : '#ef4444';
  const statusBg = online === null ? '#f3f4f6' : online ? '#f0fdf4' : '#fef2f2';
  const statusBorder = online === null ? '#e5e7eb' : online ? '#bbf7d0' : '#fecaca';
  const statusLabel = online === null ? 'Checking…' : online ? 'Online' : 'Offline';
  const statusDesc = online === null
    ? 'Checking ERP server status…'
    : online
    ? 'ERP server is reachable and responding.'
    : 'ERP server is not responding. Orders and stock data may be unavailable.';

  const lastChecked = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    : null;

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold mb-6 text-gray-800">ERP Server Status</h1>

      <div
        className="rounded-lg p-6 border"
        style={{ backgroundColor: statusBg, borderColor: statusBorder }}
      >
        <div className="flex items-center gap-4 mb-4">
          <span
            style={{
              display: 'inline-block',
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: statusColor,
              boxShadow: online ? `0 0 0 5px ${statusColor}33` : 'none',
              flexShrink: 0,
            }}
          />
          <span className="text-2xl font-bold" style={{ color: statusColor }}>
            {statusLabel}
          </span>
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

      <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-xs text-gray-500">
          Status refreshes automatically every 30 seconds. Use <strong>Check Now</strong> for an immediate check.
        </p>
      </div>
    </div>
  );
}
