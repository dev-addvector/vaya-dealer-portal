import { useQuery } from '@tanstack/react-query';
import { getEbrochures } from '@/api/download.api';

export default function EBrochurePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['ebrochures'],
    queryFn: getEbrochures,
  });

  const brochures = data?.data || [];

  return (
    <div style={{ minHeight: 'calc(100vh - 90px)', backgroundColor: '#fff' }}>
      {/* Breadcrumb */}
      <div style={{ backgroundColor: '#f5f5ef', padding: '12px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 30px' }}>
          <span style={{ fontSize: '18px', color: '#807A52', fontWeight: 500 }}>Download Brochures</span>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 30px' }}>
        {isLoading && (
          <p style={{ color: '#707070', fontSize: '14px' }}>Loading brochures...</p>
        )}
        {isError && (
          <p style={{ color: '#c00', fontSize: '14px' }}>Failed to load brochures.</p>
        )}
        {!isLoading && !isError && brochures.length === 0 && (
          <p style={{ color: '#707070', fontSize: '14px' }}>No brochures available.</p>
        )}
        {brochures.map((b) => (
          <div
            key={b.id ?? b.filename}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 0',
              borderBottom: '1px solid #E3E8CC',
            }}
          >
            <span style={{ fontWeight: 400, color: '#AEC148', fontSize: '15px' }}>{b.name}</span>
            <a
              href={b.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: '#AEC148',
                color: '#fff',
                padding: '6px 18px',
                borderRadius: '3px',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              Download
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
