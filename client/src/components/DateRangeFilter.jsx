import { useState, useRef, useEffect } from 'react';
import { DateRangePicker, createStaticRanges } from 'react-date-range';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';

const staticRanges = createStaticRanges([
  {
    label: 'Today',
    range: () => ({ startDate: new Date(), endDate: new Date() }),
  },
  {
    label: 'Yesterday',
    range: () => ({ startDate: subDays(new Date(), 1), endDate: subDays(new Date(), 1) }),
  },
  {
    label: 'Last 7 Days',
    range: () => ({ startDate: subDays(new Date(), 6), endDate: new Date() }),
  },
  {
    label: 'Last 30 Days',
    range: () => ({ startDate: subDays(new Date(), 29), endDate: new Date() }),
  },
  {
    label: 'This Month',
    range: () => ({ startDate: startOfMonth(new Date()), endDate: endOfMonth(new Date()) }),
  },
  {
    label: 'Last Month',
    range: () => ({
      startDate: startOfMonth(subMonths(new Date(), 1)),
      endDate: endOfMonth(subMonths(new Date(), 1)),
    }),
  },
]);

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
  const wrapperRef = useRef(null);

  useEffect(() => {
    setPending([{ startDate: parseDate(from), endDate: parseDate(to), key: 'selection' }]);
  }, [from, to]);

  useEffect(() => {
    function onMouseDown(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setPending([{ startDate: parseDate(from), endDate: parseDate(to), key: 'selection' }]);
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [from, to]);

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

  const displayFrom = format(parseDate(from), 'dd-MMM-yyyy');
  const displayTo = format(parseDate(to), 'dd-MMM-yyyy');

  return (
    <div ref={wrapperRef} className="relative">
      <div
        className="flex items-center gap-2 border border-gray-200 rounded bg-gray-50 px-3 py-2 cursor-pointer hover:border-purple-400 transition-colors min-w-0"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="text-sm text-gray-700 flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
          {displayFrom} - {displayTo}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClear?.();
            setOpen(false);
          }}
          className="text-gray-400 hover:text-gray-600 leading-none flex-shrink-0"
          title="Clear date range"
        >
          ✕
        </button>
      </div>

      {open && (
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
              <button
                onClick={handleCancel}
                className="px-4 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
