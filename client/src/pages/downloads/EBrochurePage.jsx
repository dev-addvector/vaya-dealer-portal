import { useQuery } from '@tanstack/react-query';
import { getEbrochures } from '@/api/download.api';

export default function EBrochurePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['ebrochures'],
    queryFn: getEbrochures,
  });

  const brochures = data?.data || [];

  return (
    <div className="min-h-[calc(100vh-90px)] bg-white">
      <div className="bg-[#f5f5ef] py-3">
        <div className="max-w-[1200px] mx-auto px-[30px]">
          <span className="text-[18px] text-vaya-primary font-medium">Download Brochures</span>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-[30px] py-10">
        {isLoading && <p className="text-vaya-gray text-sm">Loading brochures...</p>}
        {isError && <p className="text-red-700 text-sm">Failed to load brochures.</p>}
        {!isLoading && !isError && brochures.length === 0 && (
          <p className="text-vaya-gray text-sm">No brochures available.</p>
        )}
        {brochures.map((b) => (
          <div
            key={b.id ?? b.filename}
            className="flex items-center gap-4 py-3 border-b border-vaya-light"
          >
            <span className="font-normal text-vaya-green text-[15px]">{b.name}</span>
            <a
              href={b.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-vaya-green text-white px-[18px] py-[6px] rounded-[3px] no-underline text-[13px] font-medium"
            >
              Download
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
