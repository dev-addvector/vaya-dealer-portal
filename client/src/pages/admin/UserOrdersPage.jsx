import { useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getOrdersByUnc } from '@/api/admin.api';

// ERP sends dates as "DD-MM-YYYY HH:MM:SS" — new Date() misreads this as MM-DD.
function parseErpDate(str) {
  if (!str || str === 'Null') return null;
  const [datePart] = String(str).split(' ');
  const parts = datePart.split('-');
  if (parts.length === 3 && parts[0].length <= 2) {
    const [d, m, y] = parts;
    const year = y.length === 2 ? `20${y}` : y;
    const dt = new Date(`${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
    return isNaN(dt.getTime()) ? null : dt;
  }
  const dt = new Date(str);
  return isNaN(dt.getTime()) ? null : dt;
}

function fmtDate(dateStr) {
  const dt = parseErpDate(dateStr);
  if (!dt) return '—';
  return dt.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric',
  });
}

function fmtAmount(order) {
  const direct = parseFloat(order.NetPayable);
  if (!isNaN(direct) && direct > 0) {
    return direct.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (Array.isArray(order.OrderItems) && order.OrderItems.length > 0) {
    const total = order.OrderItems.reduce(
      (sum, item) => sum + (parseFloat(item.TotalCost) || 0) + (parseFloat(item.TaxAmount) || 0),
      0
    );
    if (total > 0) return total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return '—';
}

const STATUS_COLORS = {
  Delivered: 'bg-green-100 text-green-700',
  Process: 'bg-blue-100 text-blue-700',
  Pending: 'bg-yellow-100 text-yellow-700',
};

const COLUMNS = [
  { label: 'Order ID',      field: 'OrderID',      sortable: true },
  { label: 'Order Date',    field: 'OrderDate',    sortable: true },
  { label: 'Invoice ID',    field: 'InvoiceNo',    sortable: true },
  { label: 'Invoice Date',  field: 'InvoiceDate',  sortable: true },
  { label: 'Net Payable',   field: 'NetPayable',   sortable: true },
  { label: 'PO Number',     field: 'PONumber',     sortable: true },
  { label: 'Shipping Mode', field: 'ShippingMode', sortable: true },
  { label: 'Order Type',    field: 'OrderType',    sortable: true },
  { label: 'Order Status',  field: 'OrderStatus',  sortable: true },
];

const PAGE_SIZE = 10;
const DATE_FIELDS = new Set(['OrderDate', 'InvoiceDate']);
const NUM_FIELDS  = new Set(['NetPayable']);

function netPayableNum(o) {
  const d = parseFloat(o.NetPayable);
  if (!isNaN(d) && d > 0) return d;
  if (Array.isArray(o.OrderItems))
    return o.OrderItems.reduce((s, i) => s + (parseFloat(i.TotalCost) || 0) + (parseFloat(i.TaxAmount) || 0), 0);
  return 0;
}

function getValue(o, field) {
  const v = o[field];
  if (v == null || v === 'Null' || v === '') return null;
  if (NUM_FIELDS.has(field))  return netPayableNum(o);
  if (DATE_FIELDS.has(field)) return parseErpDate(v);
  return String(v).toLowerCase();
}

function sortOrders(orders, sortBy, sortDir) {
  if (!sortBy) return orders;
  return [...orders].sort((a, b) => {
    const av = getValue(a, sortBy);
    const bv = getValue(b, sortBy);
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    let cmp = 0;
    if (av instanceof Date) cmp = av - bv;
    else if (typeof av === 'number') cmp = av - bv;
    else cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });
}

function SortIcon({ field, sortBy, sortDir }) {
  if (sortBy !== field) return <span className="ml-1 text-gray-300">↕</span>;
  return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
}

export default function UserOrdersPage() {
  const { unc } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [sortBy, setSortBy]   = useState('OrderDate');
  const [sortDir, setSortDir] = useState('desc');
  const [search, setSearch]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const decodedUnc = decodeURIComponent(unc);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-user-orders', unc],
    queryFn: () => getOrdersByUnc(decodedUnc),
    staleTime: 5 * 60 * 1000,
  });

  const rawOrders = data?.data ?? [];

  const statuses = useMemo(() => {
    const set = new Set(rawOrders.map((o) => o.OrderStatus).filter(Boolean));
    return [...set].sort();
  }, [rawOrders]);

  const orders = useMemo(() => {
    let result = rawOrders;
    if (statusFilter) {
      result = result.filter((o) => o.OrderStatus === statusFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (o) =>
          (o.OrderID   && String(o.OrderID).toLowerCase().includes(q)) ||
          (o.InvoiceNo && String(o.InvoiceNo).toLowerCase().includes(q)) ||
          (o.PONumber  && String(o.PONumber).toLowerCase().includes(q))
      );
    }
    return sortOrders(result, sortBy, sortDir);
  }, [rawOrders, statusFilter, search, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedOrders = orders.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function getPageNumbers() {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (safePage <= 4) return [1, 2, 3, 4, 5, '…', totalPages];
    if (safePage >= totalPages - 3) return [1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '…', safePage - 1, safePage, safePage + 1, '…', totalPages];
  }

  function handleSort(field) {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
    setPage(1);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4">
        <button onClick={() => navigate('/admin/users')} className="text-sm text-vaya-primary hover:underline">
          ← Back to Users
        </button>
        <h1 className="text-xl font-bold text-gray-800 break-words">
          Orders — {state?.userName || decodedUnc}
        </h1>
      </div>

      {isLoading && <p className="text-sm text-gray-500">Loading orders from ERP...</p>}
      {isError   && <p className="text-sm text-red-600">Failed to load orders from ERP.</p>}

      {!isLoading && !isError && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              placeholder="Search Order ID, Invoice ID, PO Number..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="border rounded px-3 py-2 text-sm w-full sm:w-80 focus:outline-none focus:ring-1 focus:ring-vaya-green"
            />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-vaya-green"
            >
              <option value="">All Statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {(search || statusFilter) && (
              <button
                onClick={() => { setSearch(''); setStatusFilter(''); setPage(1); }}
                className="text-sm text-gray-500 hover:text-gray-700 underline whitespace-nowrap"
              >
                Clear filters
              </button>
            )}
            <span className="text-sm text-gray-500 self-center ml-auto whitespace-nowrap">
              {orders.length} of {rawOrders.length} orders
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg shadow">
            <table className="w-full text-sm border-collapse bg-white">
              <thead className="bg-vaya-light text-vaya-dark uppercase text-xs">
                <tr>
                  {COLUMNS.map(({ label, field, sortable }) => (
                    <th
                      key={label}
                      className={`px-4 py-3 text-left font-semibold whitespace-nowrap ${sortable ? 'cursor-pointer select-none hover:bg-vaya-light/70' : ''}`}
                      onClick={() => sortable && handleSort(field)}
                    >
                      {label}
                      {sortable && <SortIcon field={field} sortBy={sortBy} sortDir={sortDir} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-6 text-center text-gray-400">No orders found.</td>
                  </tr>
                ) : (
                  pagedOrders.map((o, i) => (
                    <tr key={i} className="border-t hover:bg-vaya-light/30">
                      <td className="px-4 py-3">
                        <button onClick={() => setSelectedOrder(o)} className="text-vaya-primary hover:underline font-medium">
                          {o.OrderID && o.OrderID !== 'Null' ? o.OrderID : 'N/A'}
                        </button>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{fmtDate(o.OrderDate)}</td>
                      <td className="px-4 py-3">{o.InvoiceNo && o.InvoiceNo !== 'Null' ? o.InvoiceNo : '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{fmtDate(o.InvoiceDate)}</td>
                      <td className="px-4 py-3 text-right">{fmtAmount(o)}</td>
                      <td className="px-4 py-3">{o.PONumber || '—'}</td>
                      <td className="px-4 py-3">{o.ShippingMode || '—'}</td>
                      <td className="px-4 py-3">{o.OrderType || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[o.OrderStatus] || 'bg-gray-100 text-gray-600'}`}>
                          {o.OrderStatus || '—'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 gap-3">
            <p className="text-sm text-gray-500 text-center sm:text-left">
              {orders.length === 0
                ? 'No entries found'
                : `Showing ${(safePage - 1) * PAGE_SIZE + 1} to ${Math.min(safePage * PAGE_SIZE, orders.length)} of ${orders.length} entries`}
            </p>
            <div className="flex items-center gap-1 justify-center">
              <button
                disabled={safePage <= 1}
                onClick={() => setPage(1)}
                className="px-2.5 py-1.5 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
              >«</button>
              <button
                disabled={safePage <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
              >Previous</button>
              {getPageNumbers().map((n, i) =>
                n === '…' ? (
                  <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-sm text-gray-400">…</span>
                ) : (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`px-3 py-1.5 text-sm border rounded ${
                      n === safePage
                        ? 'bg-vaya-primary text-white border-vaya-primary'
                        : 'hover:bg-gray-50'
                    }`}
                  >{n}</button>
                )
              )}
              <button
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
              >Next</button>
              <button
                disabled={safePage >= totalPages}
                onClick={() => setPage(totalPages)}
                className="px-2.5 py-1.5 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
              >»</button>
            </div>
          </div>
        </>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end sm:justify-center sm:items-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedOrder(null)} />
          <div className="relative bg-white w-full sm:max-w-2xl sm:h-auto h-full overflow-y-auto shadow-xl p-4 sm:p-6">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl leading-none"
            >
              ×
            </button>
            <h2 className="text-lg font-bold mb-4 pr-8">Order Details — {selectedOrder.OrderID}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-6">
              <div><span className="text-gray-500">Order ID:</span> <span className="font-medium ml-1">{selectedOrder.OrderID}</span></div>
              <div><span className="text-gray-500">Order Date:</span> <span className="font-medium ml-1">{fmtDate(selectedOrder.OrderDate)}</span></div>
              <div><span className="text-gray-500">Invoice ID:</span> <span className="font-medium ml-1">{selectedOrder.InvoiceNo || '—'}</span></div>
              <div><span className="text-gray-500">Invoice Date:</span> <span className="font-medium ml-1">{fmtDate(selectedOrder.InvoiceDate)}</span></div>
              <div><span className="text-gray-500">Net Payable:</span> <span className="font-medium ml-1">{fmtAmount(selectedOrder)}</span></div>
              <div><span className="text-gray-500">Order Type:</span> <span className="font-medium ml-1">{selectedOrder.OrderType || '—'}</span></div>
              <div><span className="text-gray-500">Shipping Mode:</span> <span className="font-medium ml-1">{selectedOrder.ShippingMode || '—'}</span></div>
              <div><span className="text-gray-500">Status:</span> <span className="font-medium ml-1">{selectedOrder.OrderStatus || '—'}</span></div>
            </div>

            <h3 className="font-semibold text-sm mb-2 text-gray-700">Order Items</h3>
            {Array.isArray(selectedOrder.OrderItems) && selectedOrder.OrderItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead className="bg-vaya-light text-vaya-dark uppercase">
                    <tr>
                      {['Color', 'Pattern', 'Rate', 'Ordered Length', 'Tax', 'Discount', 'Total'].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.OrderItems.map((item, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-3 py-2">{item.Color || '—'}</td>
                        <td className="px-3 py-2">{item.Pattern || '—'}</td>
                        <td className="px-3 py-2 text-right">{Number(item.Rate || 0).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right">{item.OrderdLength || '—'}</td>
                        <td className="px-3 py-2 text-right">{Number(item.TaxAmount || 0).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right">{Number(item.DiscountVal || 0).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right">
                          {(Number(item.TotalCost || 0) + Number(item.TaxAmount || 0)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No order items available.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
