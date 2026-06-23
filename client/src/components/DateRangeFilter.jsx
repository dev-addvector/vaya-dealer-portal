import { useState, useRef, useEffect } from 'react';
import { DateRange, DateRangePicker, createStaticRanges } from 'react-date-range';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';

const staticRanges = createStaticRanges([
  { label: 'Today',        range: () => ({ startDate: new Date(), endDate: new Date() }) },
  { label: 'Yesterday',    range: () => ({ startDate: subDays(new Date(), 1), endDate: subDays(new Date(), 1) }) },
  { label: 'Last 7 Days',  range: () => ({ startDate: subDays(new Date(), 6), endDate: new Date() }) },
  { label: 'Last 30 Days', range: () => ({ startDate: subDays(new Date(), 29), endDate: new Date() }) },
  { label: 'This Month',   range: () => ({ startDate: startOfMonth(new Date()), endDate: endOfMonth(new Date()) }) },
  { label: 'Last Month',   range: () => ({ startDate: startOfMonth(subMonths(new Date(), 1)), endDate: endOfMonth(subMonths(new Date(), 1)) }) },
]);

const MOBILE_PRESETS = [
  { label: 'Today',        range: () => ({ startDate: new Date(), endDate: new Date() }) },
  { label: 'Yesterday',    range: () => ({ startDate: subDays(new Date(), 1), endDate: subDays(new Date(), 1) }) },
  { label: 'Last 7 Days',  range: () => ({ startDate: subDays(new Date(), 6), endDate: new Date() }) },
  { label: 'Last 30 Days', range: () => ({ startDate: subDays(new Date(), 29), endDate: new Date() }) },
  { label: 'This Month',   range: () => ({ startDate: startOfMonth(new Date()), endDate: endOfMonth(new Date()) }) },
  { label: 'Last Month',   range: () => ({ startDate: startOfMonth(subMonths(new Date(), 1)), endDate: endOfMonth(subMonths(new Date(), 1)) }) },
];

function parseDate(str) {
  if (!str) return new Date();
  const d = new Date(str);
  return isNaN(d) ? new Date() : d;
}

export default function DateRangeFilter({ from, to, onChange, onClear }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState([
    { startDate: parseDate(from), endDate: parseDate(to), key: 'selection' },
  ]);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 1024
  );
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setPending([{ startDate: parseDate(from), endDate: parseDate(to), key: 'selection' }]);
  }, [from, to]);

  useEffect(() => {
    if (isMobile) return; // mobile uses backdrop click instead
    function onMouseDown(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setPending([{ startDate: parseDate(from), endDate: parseDate(to), key: 'selection' }]);
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [from, to, isMobile]);

  function handleApply() {
    onChange({
      from: format(pending[0].startDate, 'yyyy-MM-dd'),
      to: format(pending[0].endDate, 'yyyy-MM-dd'),
    });
    setOpen(false);
  }

  function handleCancel() {
    setPending([{ startDate: parseDate(from), endDate: parseDate(to), key: 'selection' }]);
    setOpen(false);
  }

  function applyPreset(preset) {
    const r = preset.range();
    setPending([{ ...r, key: 'selection' }]);
  }

  const displayFrom = format(parseDate(from), 'dd-MMM-yyyy');
  const displayTo   = format(parseDate(to),   'dd-MMM-yyyy');

  return (
    <div ref={wrapperRef} className="relative w-full">
      {/* Trigger */}
      <div
        className="flex items-center gap-2 border border-gray-200 rounded bg-gray-50 px-3 py-2 cursor-pointer hover:border-purple-400 transition-colors min-w-0 w-full"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="text-sm text-gray-700 flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
          {displayFrom} - {displayTo}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onClear?.(); setOpen(false); }}
          className="text-gray-400 hover:text-gray-600 leading-none flex-shrink-0"
          title="Clear date range"
        >
          ✕
        </button>
      </div>

      {/* Mobile: full-screen backdrop */}
      {open && isMobile && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={handleCancel}
        />
      )}

      {open && (
        isMobile ? (
          /* Mobile: centered modal */
          <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] max-w-[calc(100vw-2rem)] rounded-xl shadow-2xl border border-gray-200 bg-white overflow-hidden">
            {/* Preset chips */}
            <div className="flex flex-wrap gap-1.5 p-3 border-b border-gray-100">
              {MOBILE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p)}
                  className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Single-month calendar */}
            <DateRange
              ranges={pending}
              onChange={(item) => setPending([item.selection])}
              months={1}
              direction="vertical"
              showMonthAndYearPickers
              rangeColors={['#3b82f6']}
            />

            {/* Footer */}
            <div className="flex items-center justify-between px-3 py-2.5 border-t border-gray-200 bg-white">
              <span className="text-xs text-gray-500">
                {format(pending[0].startDate, 'dd-MMM-yyyy')} – {format(pending[0].endDate, 'dd-MMM-yyyy')}
              </span>
              <div className="flex gap-2">
                <button onClick={handleCancel} className="px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleApply} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
                  Apply
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Desktop: existing dropdown */
          <div className="absolute z-50 right-0 mt-1 rounded-lg shadow-2xl border border-gray-200 bg-white overflow-hidden">
            <DateRangePicker
              ranges={pending}
              onChange={(item) => setPending([item.selection])}
              staticRanges={staticRanges}
              inputRanges={[]}
              months={2}
              direction="horizontal"
              showMonthAndYearPickers
              rangeColors={['#3b82f6']}
            />
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white">
              <span className="text-sm text-gray-500">
                {format(pending[0].startDate, 'dd-MMM-yyyy')} - {format(pending[0].endDate, 'dd-MMM-yyyy')}
              </span>
              <div className="flex gap-2">
                <button onClick={handleCancel} className="px-4 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleApply} className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                  Apply
                </button>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
