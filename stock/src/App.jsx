import { useEffect, useMemo, useState } from 'react';

function useDebounce(value, delay = 200) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const MAX_PAGE_BUTTONS = 3;

async function fetchStocks() {
  const res = await fetch('/api/stocks');
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  let start = Math.max(1, page - Math.floor(MAX_PAGE_BUTTONS / 2));
  let end = Math.min(totalPages, start + MAX_PAGE_BUTTONS - 1);
  if (end - start < MAX_PAGE_BUTTONS - 1) {
    start = Math.max(1, end - MAX_PAGE_BUTTONS + 1);
  }
  for (let i = start; i <= end; i++) pages.push(i);

  const btnBase = 'min-w-[36px] h-9 px-2 border rounded text-sm transition-colors';
  const btnActive = 'bg-vaya-black text-white border-vaya-black font-semibold';
  const btnInactive = 'bg-white text-gray-700 hover:bg-gray-100';
  const btnDisabled = 'opacity-40 cursor-not-allowed';

  return (
    <div className="flex items-center gap-1 flex-wrap">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={`${btnBase} ${page <= 1 ? btnDisabled : btnInactive}`}
      >
        ‹
      </button>

      {start > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className={`${btnBase} ${btnInactive}`}>1</button>
          {start > 2 && <span className="px-1 text-gray-400 text-sm">…</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`${btnBase} ${p === page ? btnActive : btnInactive}`}
        >
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-gray-400 text-sm">…</span>}
          <button onClick={() => onPageChange(totalPages)} className={`${btnBase} ${btnInactive}`}>
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className={`${btnBase} ${page >= totalPages ? btnDisabled : btnInactive}`}
      >
        ›
      </button>
    </div>
  );
}

const columns = [
  { key: 'pattern', label: 'Pattern' },
  { key: 'color', label: 'Color' },
  { key: 'rollLength', label: 'Roll Length (in mtr)' },
];

export default function App() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState({ pattern: '', color: '', rollLength: '' });
  const [globalSearch, setGlobalSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);
  const debouncedGlobalSearch = useDebounce(globalSearch, 200);
  const [sortCol, setSortCol] = useState('pattern');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const header = document.querySelector('.header');
    if (!header) return;
    const observer = new IntersectionObserver(([entry]) => {
      setShowScrollTop(!entry.isIntersecting);
    });
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetchStocks()
      .then((res) => setStocks(res.data || []))
      .catch(() => setError('Failed to load stock data. Please try again later.'))
      .finally(() => setLoading(false));
  }, []);

  const globalFiltered = useMemo(() => {
    const q = debouncedGlobalSearch.toLowerCase();
    if (!q) return stocks;
    return stocks.filter((s) =>
      (s.pattern || '').toLowerCase().includes(q) ||
      (s.color || '').toLowerCase().includes(q) ||
      (s.rollLength || '').toLowerCase().includes(q)
    );
  }, [stocks, debouncedGlobalSearch]);

  const filtered = useMemo(() => {
    return globalFiltered.filter((s) =>
      (s.pattern || '').toLowerCase().includes(debouncedSearch.pattern.toLowerCase()) &&
      (s.color || '').toLowerCase().includes(debouncedSearch.color.toLowerCase()) &&
      (s.rollLength || '').toLowerCase().includes(debouncedSearch.rollLength.toLowerCase())
    );
  }, [globalFiltered, debouncedSearch]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = (a[sortCol] || '').toString().toLowerCase();
      const bv = (b[sortCol] || '').toString().toLowerCase();
      const cmp = av.localeCompare(bv, undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  function handleSort(col) {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
    setPage(1);
  }

  function handleSearch(col, val) {
    setSearch((prev) => ({ ...prev, [col]: val }));
    setPage(1);
  }

  function handleGlobalSearch(val) {
    setGlobalSearch(val);
    setPage(1);
  }

  function handlePageSize(e) {
    setPageSize(Number(e.target.value));
    setPage(1);
  }

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <span className="ml-1 opacity-40">↕</span>;
    return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="header border-b border-gray-200 bg-white px-4 sm:px-6 py-4 sm:py-5">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-lg sm:text-xl font-bold text-vaya-black tracking-wide">
            VAYA Updated Stock List
          </h1>
          <p className="text-xs sm:text-sm text-vaya-gray mt-1">
            For any enquiry, please email us at{' '}
            <a href="mailto:sales@vayahome.com" className="font-semibold text-vaya-primary">
              sales@vayahome.com
            </a>
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {loading && (
          <p className="text-sm text-gray-500 py-10 text-center">Loading stock data...</p>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4 text-sm text-red-700 text-center">
            {error}
          </div>
        )}

        {!loading && !error && stocks.length === 0 && (
          <div className="border border-gray-300 rounded py-8 text-center text-gray-500 text-base">
            No File Uploaded for the day
          </div>
        )}

        {!loading && !error && stocks.length > 0 && (
          <>
            {/* Top bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <input
                type="text"
                placeholder="Search across all fields..."
                value={globalSearch}
                onChange={(e) => handleGlobalSearch(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-vaya-primary w-full sm:w-72"
              />
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={handlePageSize}
                  className="border border-gray-300 rounded px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-vaya-primary"
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <span>entries</span>
              </div>
            </div>

            {/* Mobile sort + search (above cards) */}
            <div className="flex flex-col gap-2 mb-3 sm:hidden">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500">Sort by:</span>
                {columns.map((col) => (
                  <button
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${
                      sortCol === col.key
                        ? 'bg-vaya-black text-white border-vaya-black'
                        : 'bg-white text-gray-600 border-gray-300'
                    }`}
                  >
                    {col.label} {sortCol === col.key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </button>
                ))}
              </div>
              {columns.map((col) => (
                <input
                  key={col.key}
                  type="text"
                  placeholder={`Search ${col.label}`}
                  value={search[col.key]}
                  onChange={(e) => handleSearch(col.key, e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-vaya-primary"
                />
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto rounded-lg shadow">
              <table className="w-full text-sm border-collapse bg-white">
                <thead>
                  <tr className="bg-vaya-black text-white">
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className="px-4 py-3 text-left font-semibold cursor-pointer select-none hover:bg-vaya-dark transition-colors"
                      >
                        {col.label}
                        <SortIcon col={col.key} />
                      </th>
                    ))}
                  </tr>
                  <tr className="bg-white border-b">
                    {columns.map((col) => (
                      <th key={col.key} className="px-3 py-2">
                        <input
                          type="text"
                          placeholder={`Search ${col.label}`}
                          value={search[col.key]}
                          onChange={(e) => handleSearch(col.key, e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs font-normal text-gray-700 focus:outline-none focus:ring-1 focus:ring-vaya-primary"
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                        No matching records found.
                      </td>
                    </tr>
                  ) : (
                    paged.map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 font-medium text-vaya-black">{row.pattern || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{row.color || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{row.rollLength || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="flex flex-col gap-3 sm:hidden">
              {paged.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-6">No matching records found.</p>
              ) : (
                paged.map((row, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-100 px-4 py-3">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className="font-semibold text-vaya-black text-sm">{row.pattern || '—'}</span>
                      <span className="text-xs bg-vaya-light text-vaya-dark px-2 py-0.5 rounded-full whitespace-nowrap">
                        {row.color || '—'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Roll Length: <span className="text-gray-700 font-medium">{row.rollLength || '—'} mtr</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-4">
              <Pagination
                page={safePage}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>

      {showScrollTop && <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-vaya-black text-white shadow-lg flex items-center justify-center hover:bg-vaya-dark transition-colors"
        aria-label="Scroll to top"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
          <path fillRule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z"/>
        </svg>
      </button>}
    </div>
  );
}
