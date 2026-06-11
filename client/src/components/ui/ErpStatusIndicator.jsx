import { useQuery } from '@tanstack/react-query';
import { getErpStatus } from '@/api/erp.api';

export default function ErpStatusIndicator() {
  const { data, isLoading } = useQuery({
    queryKey: ['erp-status'],
    queryFn: getErpStatus,
    refetchInterval: 15 * 60 * 1000,
    staleTime: 15 * 60 * 1000,
  });

  const online = isLoading ? null : (data?.online ?? false);

  const color = online === null ? '#9ca3af' : online ? '#22c55e' : '#ef4444';
  const label = online === null ? 'Checking ERP…' : online ? 'ERP Online' : 'ERP Offline';

  return (
    <div title={label} className="flex items-center shrink-0" style={{ padding: '0 2px' }}>
      <span
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: color,
          boxShadow: online ? `0 0 0 2px ${color}33` : 'none',
        }}
      />
    </div>
  );
}
