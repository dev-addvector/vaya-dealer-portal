import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { getDashboardFilters, getChartData, downloadChartDataCSV } from '@/api/admin.api';
import { IndiaMap } from '@/components/admin/IndiaMap';
import DateRangeFilter from '@/components/DateRangeFilter';
import { todayIST } from '@/utils/dateUtils';

const today = todayIST();
const LINE_COLORS = ['#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export default function DashboardPage() {
  const [filters, setFilters] = useState({
    from: '2023-02-01',
    to: today,
    searchString: '',
    location: '',
    consigneeName: '',
  });
  const [downloading, setDownloading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [pdfCapturing, setPdfCapturing] = useState(false);
  const dashboardRef = useRef(null);

  const { data: filterRes } = useQuery({
    queryKey: ['dashboard-filters'],
    queryFn: getDashboardFilters,
  });

  const { data: chartRes, isLoading } = useQuery({
    queryKey: ['chart-data', filters],
    queryFn: () => getChartData(filters),
  });

  const opts = filterRes?.data ?? {};
  const cd = chartRes?.data ?? {};

  const searchBarData = (cd.topSearchString?.search_string ?? []).map((s, i) => ({
    name: s,
    count: cd.topSearchString?.count?.[i] ?? 0,
  }));

  const allConsigneeUsers = cd.topConsignee?.users ?? [];
  const top5Users = allConsigneeUsers.slice(0, 5);
  const otherUsers = allConsigneeUsers.slice(5);
  const hasOthers = otherUsers.length > 0;

  const lineData = (cd.topConsignee?.dates ?? []).map((date, i) => {
    const row = { date };
    top5Users.forEach((u) => {
      row[u.name] = u.data[i] ?? 0;
    });
    if (hasOthers) {
      row['Others'] = otherUsers.reduce((sum, u) => sum + (u.data[i] ?? 0), 0);
    }
    return row;
  });

  const tickInterval = lineData.length > 30 ? Math.floor(lineData.length / 20) : 0;

  const lineKeys = [...top5Users.map((u) => u.name), ...(hasOthers ? ['Others'] : [])];
  const [hiddenLines, setHiddenLines] = useState(() => new Set(hasOthers ? ['Others'] : []));

  function toggleLine(key) {
    setHiddenLines((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleDownloadCSV() {
    setDropdownOpen(false);
    setDownloading(true);
    try {
      await downloadChartDataCSV(filters);
    } finally {
      setDownloading(false);
    }
  }

  async function handleDownloadPDF() {
    setDropdownOpen(false);
    setDownloading(true);
    setPdfCapturing(true);
    await new Promise((r) => setTimeout(r, 50));
    try {
      const el = dashboardRef.current;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f3f4f6',
        scrollY: -window.scrollY,
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const headerH = 10;

      const now = new Date();
      const dateTimeStr = now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' })
        + ' - '
        + now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });

      const drawHeader = () => {
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(40, 40, 40);
        pdf.text('Vaya', margin, margin);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        pdf.text(dateTimeStr, pageW - margin, margin, { align: 'right' });
      };

      const imgW = pageW - margin * 2;
      const imgH = (canvas.height * imgW) / canvas.width;
      const contentTop = margin + headerH;
      const usableH = pageH - contentTop - margin;
      let y = 0;
      while (y < imgH) {
        if (y > 0) pdf.addPage();
        drawHeader();
        pdf.addImage(imgData, 'PNG', margin, contentTop - y, imgW, imgH);
        y += usableH;
      }
      const date = todayIST().replace(/-/g, '_');
      pdf.save(`vaya_dashboard_${date}.pdf`);
    } finally {
      setPdfCapturing(false);
      setDownloading(false);
    }
  }

  function clearFilters() {
    setFilters({ from: '2023-02-01', to: today, searchString: '', location: '', consigneeName: '' });
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
        <div className="relative w-full sm:w-auto">
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            disabled={downloading}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm px-4 py-2 rounded font-medium w-full sm:w-auto"
          >
            {downloading ? 'Downloading…' : 'Download ↓'}
          </button>
          {dropdownOpen && !downloading && (
            <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded shadow-lg z-10">
              <button
                onClick={handleDownloadCSV}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Download CSV
              </button>
              <button
                onClick={handleDownloadPDF}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Download PDF
              </button>
            </div>
          )}
        </div>
      </div>

      <div ref={dashboardRef} className="pt-3">

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        {pdfCapturing ? (
          <div className="grid grid-cols-4 gap-3">
            <div className="border border-gray-300 rounded px-3 py-2 text-sm bg-gray-50 text-gray-700">
              <span className="block text-xs text-gray-400 mb-0.5">Consignee Name</span>
              {filters.consigneeName || <span className="text-gray-400">All</span>}
            </div>
            <div className="border border-gray-300 rounded px-3 py-2 text-sm bg-gray-50 text-gray-700">
              <span className="block text-xs text-gray-400 mb-0.5">Search String</span>
              {filters.searchString || <span className="text-gray-400">All</span>}
            </div>
            <div className="border border-gray-300 rounded px-3 py-2 text-sm bg-gray-50 text-gray-700">
              <span className="block text-xs text-gray-400 mb-0.5">Location</span>
              {filters.location || <span className="text-gray-400">All</span>}
            </div>
            <div className="border border-gray-300 rounded px-3 py-2 text-sm bg-gray-50 text-gray-700">
              <span className="block text-xs text-gray-400 mb-0.5">Date Range</span>
              {filters.from} — {filters.to}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <select
              value={filters.consigneeName}
              onChange={(e) => setFilters((f) => ({ ...f, consigneeName: e.target.value }))}
              className="border border-gray-200 rounded px-3 py-2 text-sm text-gray-600 bg-gray-50 focus:outline-none focus:border-purple-400"
            >
              <option value="">Consignee Name</option>
              {(opts.consigneeNameArray ?? []).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>

            <select
              value={filters.searchString}
              onChange={(e) => setFilters((f) => ({ ...f, searchString: e.target.value }))}
              className="border border-gray-200 rounded px-3 py-2 text-sm text-gray-600 bg-gray-50 focus:outline-none focus:border-purple-400"
            >
              <option value="">Search Strings</option>
              {(opts.searchStringArray ?? []).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={filters.location}
              onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
              className="border border-gray-200 rounded px-3 py-2 text-sm text-gray-600 bg-gray-50 focus:outline-none focus:border-purple-400"
            >
              <option value="">Location</option>
              {(opts.locationArray ?? []).map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>

            <DateRangeFilter
              from={filters.from}
              to={filters.to}
              onChange={({ from, to }) => setFilters((f) => ({ ...f, from, to }))}
              onClear={clearFilters}
            />
          </div>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="rounded-lg p-4 sm:p-5 text-white bg-[#7c3aed]">
          <div className="text-xl sm:text-2xl mb-1">⏱</div>
          <p className="text-2xl sm:text-3xl font-bold">
            {isLoading ? '…' : (cd.averageTimeElpsed ?? 0)} s
          </p>
          <p className="text-xs sm:text-sm mt-1 opacity-90">Average of Elapsed Time</p>
        </div>
        <div className="rounded-lg p-4 sm:p-5 text-white bg-[#3ec97b]">
          <div className="text-xl sm:text-2xl mb-1">📋</div>
          <p className="text-2xl sm:text-3xl font-bold">
            {isLoading ? '…' : (cd.averageRecord ?? 0)}
          </p>
          <p className="text-xs sm:text-sm mt-1 opacity-90">Average of Records Per Search</p>
        </div>
        <div className="rounded-lg p-4 sm:p-5 text-white bg-[#f05372]">
          <div className="text-xl sm:text-2xl mb-1">⚡</div>
          <p className="text-2xl sm:text-3xl font-bold">
            {isLoading ? '…' : (cd.averageRecordPerSec ?? 0)} /s
          </p>
          <p className="text-xs sm:text-sm mt-1 opacity-90">Average of Records Per Search Per Sec</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Top 5 Search Strings - Horizontal Bar */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Top 5 Search Strings</h2>
          {searchBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={searchBarData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 8, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={60} />
                <Tooltip />
                <Bar dataKey="count" fill="#7c3aed" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              {isLoading ? 'Loading…' : 'No data'}
            </div>
          )}
        </div>

        {/* Search By Region - India Map */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-700">Search By Region</h2>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>0 Worst</span>
              <div className="w-20 h-3 rounded bg-gradient-to-r from-[#ececf6] to-[#7c3aed]" />
              <span>Highest</span>
            </div>
          </div>
          <IndiaMap locationMap={cd.locationMap ?? []} />
        </div>
      </div>

      {/* Search By Users - Line Chart */}
      <div className="bg-white rounded-lg shadow p-5">
        <h2 className="font-semibold text-gray-700 mb-4">Search By Users</h2>
        {lineData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={lineData} margin={{ top: 5, right: 5, left: 5, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 8 }}
                  angle={-45}
                  textAnchor="end"
                  interval={tickInterval}
                />
                <YAxis
                  tick={{ fontSize: 9 }}
                  label={{ value: 'Search Count', angle: -90, position: 'insideLeft', offset: 5 }}
                />
                <Tooltip />
                {lineKeys.map((key, i) => (
                  !hiddenLines.has(key) && (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={key === 'Others' ? '#9ca3af' : LINE_COLORS[i % LINE_COLORS.length]}
                      dot={{ r: 2 }}
                      strokeWidth={1.5}
                      strokeDasharray={key === 'Others' ? '4 2' : undefined}
                    />
                  )
                ))}
              </LineChart>
            </ResponsiveContainer>

            {/* Custom legend with toggles */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: '12px', justifyContent: 'center' }}>
              {lineKeys.map((key, i) => {
                const color = key === 'Others' ? '#9ca3af' : LINE_COLORS[i % LINE_COLORS.length];
                const hidden = hiddenLines.has(key);
                const isOthers = key === 'Others';
                return (
                  <button
                    key={key}
                    onClick={() => toggleLine(key)}
                    title={isOthers && hidden ? 'Click to show aggregated Others' : undefined}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      fontSize: '12px', padding: '4px 8px', borderRadius: '4px',
                      border: `1px solid ${hidden ? '#e5e7eb' : '#d1d5db'}`,
                      background: hidden ? '#f9fafb' : '#ffffff',
                      color: hidden ? '#9ca3af' : '#374151',
                      cursor: 'pointer', transition: 'colors 0.15s',
                    }}
                  >
                    <span style={{
                      display: 'inline-block', width: '12px', height: '2px',
                      borderRadius: '2px', backgroundColor: hidden ? '#d1d5db' : color,
                    }} />
                    <span>{key}</span>
                    {isOthers && hidden && (
                      <span style={{ fontSize: '10px', color: '#9ca3af' }}>(disabled)</span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
            {isLoading ? 'Loading…' : 'No data'}
          </div>
        )}
        <p className="text-center text-xs text-gray-500 mt-2">Timeline</p>
      </div>
      </div>{/* end dashboardRef */}
    </div>
  );
}
