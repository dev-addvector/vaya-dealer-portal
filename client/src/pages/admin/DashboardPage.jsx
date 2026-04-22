import { useState } from 'react';
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
  Legend,
} from 'recharts';
import { getDashboardFilters, getChartData, downloadChartData } from '@/api/admin.api';
import { IndiaMap } from '@/components/admin/IndiaMap';

const today = new Date().toISOString().slice(0, 10);
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

  const lineData = (cd.topConsignee?.dates ?? []).map((date, i) => {
    const row = { date };
    (cd.topConsignee?.users ?? []).forEach((u) => {
      row[u.name] = u.data[i] ?? 0;
    });
    return row;
  });

  const tickInterval = lineData.length > 30 ? Math.floor(lineData.length / 20) : 0;

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadChartData(filters);
    } finally {
      setDownloading(false);
    }
  }

  function clearFilters() {
    setFilters({ from: '2023-02-01', to: today, searchString: '', location: '', consigneeName: '' });
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm px-4 py-2 rounded font-medium"
        >
          {downloading ? 'Downloading…' : 'Download ↓'}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
              className="border border-gray-200 rounded px-2 py-2 text-sm flex-1 bg-gray-50 focus:outline-none focus:border-purple-400"
            />
            <span className="text-gray-400 text-xs">→</span>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
              className="border border-gray-200 rounded px-2 py-2 text-sm flex-1 bg-gray-50 focus:outline-none focus:border-purple-400"
            />
            <button
              onClick={clearFilters}
              title="Clear filters"
              className="text-gray-400 hover:text-gray-600 text-lg leading-none px-1"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="rounded-lg p-5 text-white" style={{ background: '#7c3aed' }}>
          <div className="text-2xl mb-1">⏱</div>
          <p className="text-3xl font-bold">
            {isLoading ? '…' : (cd.averageTimeElpsed ?? 0)} s
          </p>
          <p className="text-sm mt-1 opacity-90">Average of Elapsed Time</p>
        </div>
        <div className="rounded-lg p-5 text-white" style={{ background: '#3ec97b' }}>
          <div className="text-2xl mb-1">📋</div>
          <p className="text-3xl font-bold">
            {isLoading ? '…' : (cd.averageRecord ?? 0)}
          </p>
          <p className="text-sm mt-1 opacity-90">Average of Records Per Search</p>
        </div>
        <div className="rounded-lg p-5 text-white" style={{ background: '#f05372' }}>
          <div className="text-2xl mb-1">⚡</div>
          <p className="text-3xl font-bold">
            {isLoading ? '…' : (cd.averageRecordPerSec ?? 0)} /s
          </p>
          <p className="text-sm mt-1 opacity-90">Average of Records Per Search Per Sec</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Top 5 Search Strings - Horizontal Bar */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Top 5 Search Strings</h2>
          {searchBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={searchBarData}
                layout="vertical"
                margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                <Tooltip />
                <Bar dataKey="count" fill="#7c3aed" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 11 }} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
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
              <div
                className="w-20 h-3 rounded"
                style={{ background: 'linear-gradient(to right, #ececf6, #7c3aed)' }}
              />
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
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={lineData} margin={{ top: 5, right: 10, left: 10, bottom: 70 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9 }}
                angle={-45}
                textAnchor="end"
                interval={tickInterval}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                label={{ value: 'Search Count', angle: -90, position: 'insideLeft', offset: 10 }}
              />
              <Tooltip />
              <Legend wrapperStyle={{ paddingTop: 16 }} />
              {(cd.topConsignee?.users ?? []).map((u, i) => (
                <Line
                  key={u.name}
                  type="monotone"
                  dataKey={u.name}
                  stroke={LINE_COLORS[i % LINE_COLORS.length]}
                  dot={{ r: 2 }}
                  strokeWidth={1.5}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
            {isLoading ? 'Loading…' : 'No data'}
          </div>
        )}
        <p className="text-center text-xs text-gray-500 mt-2">Timeline</p>
      </div>
    </div>
  );
}
