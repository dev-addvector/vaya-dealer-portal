import { useState, useMemo } from 'react';
import { useMyOrders } from '@/hooks/useOrders';
import { downloadOpenOrderPdf } from '@/api/order.api';

function parseErpDate(v) {
  if (!v || String(v).toLowerCase() === 'null') return 0;
  const p = String(v).split(/[\s-]/);
  return p.length >= 3 ? (new Date(`${p[2]}-${p[1]}-${p[0]}`).getTime() || 0) : 0;
}

function netPayableNum(order) {
  const d = parseFloat(order.NetPayable);
  if (!isNaN(d) && d > 0) return d;
  if (Array.isArray(order.OrderItems))
    return order.OrderItems.reduce((s, i) => s + (parseFloat(i.TotalCost) || 0) + (parseFloat(i.TaxAmount) || 0), 0);
  return 0;
}

function nullStr(val) {
  return !val || String(val).toLowerCase() === 'null' ? 'N/A' : val;
}

function formatNetPayable(order) {
  const direct = parseFloat(order.NetPayable);
  if (!isNaN(direct) && direct > 0) {
    return direct.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (Array.isArray(order.OrderItems) && order.OrderItems.length > 0) {
    const total = order.OrderItems.reduce(
      (sum, item) => sum + (parseFloat(item.TotalCost) || 0) + (parseFloat(item.TaxAmount) || 0),
      0
    );
    return total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return '—';
}

function matchesDate(orderDate, filterDate) {
  if (!filterDate || !orderDate || String(orderDate).toLowerCase() === 'null') return true;
  const [y, m, d] = filterDate.split('-');
  return String(orderDate).startsWith(`${d}-${m}-${y}`);
}

const thBase = 'bg-vaya-black text-white px-[10px] py-[10px] text-center font-normal text-sm border border-[#333] whitespace-nowrap select-none';
const tdBase = 'px-[10px] py-2 text-center text-[#555] text-sm border border-[#dee2e6] align-middle';
const filterCellCls = 'px-[6px] py-1 border border-[#dee2e6]';
const filterInputCls = 'w-full px-[6px] py-1 text-[13px] border border-[#ccc] rounded-[3px] h-[30px] bg-white';

export default function MyOrdersPage() {
  const { data, isLoading } = useMyOrders();
  const orders = data?.data ?? [];

  const [filters, setFilters] = useState({
    orderId: '', orderDate: '', invoiceId: '', invoiceDate: '',
    netPayable: '', po: '', shipping: '', orderType: '', orderStatus: '',
  });
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [downloading, setDownloading] = useState(null);
  const [sort, setSort] = useState({ key: 'OrderDate', dir: 'desc' });

  const unique = (key) => [
    ...new Set(orders.map(o => o[key]).filter(v => v && String(v).toLowerCase() !== 'null')),
  ];

  const orderIds      = useMemo(() => unique('OrderID'),      [orders]);
  const invoiceIds    = useMemo(() => unique('InvoiceNo'),    [orders]);
  const poNumbers     = useMemo(() => unique('PONumber'),     [orders]);
  const shippingModes = useMemo(() => unique('ShippingMode'), [orders]);
  const orderTypes    = useMemo(() => unique('OrderType'),    [orders]);
  const orderStatuses = useMemo(() => unique('OrderStatus'),  [orders]);

  const filtered = useMemo(() => orders.filter(o => {
    if (filters.orderId && o.OrderID !== filters.orderId) return false;
    if (!matchesDate(o.OrderDate, filters.orderDate)) return false;
    if (filters.invoiceId && o.InvoiceNo !== filters.invoiceId) return false;
    if (!matchesDate(o.InvoiceDate, filters.invoiceDate)) return false;
    if (filters.netPayable && !formatNetPayable(o).includes(filters.netPayable)) return false;
    if (filters.po && o.PONumber !== filters.po) return false;
    if (filters.shipping && o.ShippingMode !== filters.shipping) return false;
    if (filters.orderType && o.OrderType !== filters.orderType) return false;
    if (filters.orderStatus && o.OrderStatus !== filters.orderStatus) return false;
    return true;
  }), [orders, filters]);

  const handleSort = (key) => { setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' })); setPage(1); };

  const sortedFiltered = useMemo(() => {
    if (!sort.key) return filtered;
    return [...filtered].sort((a, b) => {
      let av, bv;
      if (sort.key === 'OrderDate' || sort.key === 'InvoiceDate') {
        av = parseErpDate(a[sort.key]); bv = parseErpDate(b[sort.key]);
      } else if (sort.key === 'NetPayable') {
        av = netPayableNum(a); bv = netPayableNum(b);
      } else {
        av = (a[sort.key] || '').toLowerCase(); bv = (b[sort.key] || '').toLowerCase();
      }
      if (av < bv) return sort.dir === 'asc' ? -1 : 1;
      if (av > bv) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / pageSize));
  const paged = sortedFiltered.slice((page - 1) * pageSize, page * pageSize);
  const setFilter = (key, val) => { setFilters(f => ({ ...f, [key]: val })); setPage(1); };

  const handleDownload = async (po) => {
    if (!po || downloading === po) return;
    try {
      setDownloading(po);
      const blob = await downloadOpenOrderPdf(po);
      const url = URL.createObjectURL(blob instanceof Blob ? blob : new Blob([blob]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `order-${po}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (_) {
      // download failed silently
    } finally {
      setDownloading(null);
    }
  };

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div>
      <div className="border-b border-[rgba(112,112,112,0.2)] py-[5px]">
        <div className="max-w-[90%] mx-auto px-[15px]">
          <span className="text-vaya-green text-[28px] leading-[43px]">My Orders</span>
        </div>
      </div>

      <section>
        <div className="max-w-[90%] mx-auto px-[15px] pb-10">
          <div className="flex justify-end items-center mt-5 mb-2 text-sm text-[#555]">
            Show&nbsp;
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="mx-[6px] px-[6px] py-[2px] text-sm border border-[#ccc] rounded-[3px]"
            >
              {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            &nbsp;entries
          </div>

          <div className="shadow-[0px_2px_15px_rgba(0,0,0,0.22)] overflow-x-auto">
            {isLoading && <p className="p-6 text-[#999] text-sm">Loading...</p>}
            {!isLoading && (
              <table className="w-full border-collapse bg-white text-sm">
                <thead>
                  <tr>
                    {[
                      { label: 'Order ID',      key: 'OrderID' },
                      { label: 'Order Date',    key: 'OrderDate' },
                      { label: 'Invoice ID',    key: 'InvoiceNo' },
                      { label: 'Invoice Date',  key: 'InvoiceDate' },
                      { label: 'Net Payable',   key: 'NetPayable' },
                      { label: 'PO Number',     key: 'PONumber' },
                      { label: 'Shipping Mode', key: 'ShippingMode' },
                      { label: 'Order Type',    key: 'OrderType' },
                      { label: 'Order Status',  key: 'OrderStatus' },
                      { label: 'Action',        key: null },
                    ].map(({ label, key }) => (
                      <th
                        key={label}
                        className={`${thBase} ${key ? 'cursor-pointer' : 'cursor-default'}`}
                        onClick={() => key && handleSort(key)}
                      >
                        {label}
                        {key && <span className={`ml-[5px] text-[11px] ${sort.key === key ? 'opacity-100' : 'opacity-30'}`}>{sort.key === key && sort.dir === 'desc' ? '▼' : '▲'}</span>}
                      </th>
                    ))}
                  </tr>
                  <tr className="bg-white">
                    <td className={filterCellCls}>
                      <select value={filters.orderId} onChange={e => setFilter('orderId', e.target.value)} className={filterInputCls}>
                        <option value="">Select OrderID</option>
                        {orderIds.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </td>
                    <td className={filterCellCls}>
                      <input type="date" value={filters.orderDate} onChange={e => setFilter('orderDate', e.target.value)} className={filterInputCls} />
                    </td>
                    <td className={filterCellCls}>
                      <select value={filters.invoiceId} onChange={e => setFilter('invoiceId', e.target.value)} className={filterInputCls}>
                        <option value="">Select Invoice Id</option>
                        {invoiceIds.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </td>
                    <td className={filterCellCls}>
                      <input type="date" value={filters.invoiceDate} onChange={e => setFilter('invoiceDate', e.target.value)} className={filterInputCls} />
                    </td>
                    <td className={filterCellCls}>
                      <input type="text" placeholder="Net Payable" value={filters.netPayable} onChange={e => setFilter('netPayable', e.target.value)} className={filterInputCls} />
                    </td>
                    <td className={filterCellCls}>
                      <select value={filters.po} onChange={e => setFilter('po', e.target.value)} className={filterInputCls}>
                        <option value="">Search PO</option>
                        {poNumbers.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </td>
                    <td className={filterCellCls}>
                      <select value={filters.shipping} onChange={e => setFilter('shipping', e.target.value)} className={filterInputCls}>
                        <option value="">Shipping Mode</option>
                        {shippingModes.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </td>
                    <td className={filterCellCls}>
                      <select value={filters.orderType} onChange={e => setFilter('orderType', e.target.value)} className={filterInputCls}>
                        <option value="">Select Type</option>
                        {orderTypes.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </td>
                    <td className={filterCellCls}>
                      <select value={filters.orderStatus} onChange={e => setFilter('orderStatus', e.target.value)} className={filterInputCls}>
                        <option value="">Select Status</option>
                        {orderStatuses.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </td>
                    <td className={filterCellCls} />
                  </tr>
                </thead>
                <tbody>
                  {paged.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center text-[#999] p-6 text-sm border border-[#dee2e6]">No orders found.</td>
                    </tr>
                  ) : paged.map((o, i) => (
                    <tr key={o.PONumber ?? i} className="hover:bg-[#f8f9fa]">
                      <td className={tdBase}>{nullStr(o.OrderID)}</td>
                      <td className={tdBase}>{nullStr(o.OrderDate)}</td>
                      <td className={tdBase}>{nullStr(o.InvoiceNo)}</td>
                      <td className={tdBase}>{nullStr(o.InvoiceDate)}</td>
                      <td className={`${tdBase} text-right`}>{formatNetPayable(o)}</td>
                      <td className={tdBase}>{o.PONumber ?? 'N/A'}</td>
                      <td className={tdBase}>{o.ShippingMode ?? 'N/A'}</td>
                      <td className={tdBase}>{o.OrderType ?? 'N/A'}</td>
                      <td className={tdBase}>{o.OrderStatus ?? 'N/A'}</td>
                      <td className={tdBase}>
                        {o.PONumber ? (
                          <button
                            onClick={() => handleDownload(o.PONumber)}
                            disabled={downloading === o.PONumber}
                            title="Download PDF"
                            className="bg-transparent border-none cursor-pointer text-[#555] text-[18px] leading-none p-0"
                          >
                            &#8681;
                          </button>
                        ) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!isLoading && (
            <div className="flex justify-center items-center gap-1 mt-5 text-sm">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`bg-transparent border border-[#dee2e6] px-[10px] py-1 rounded-[3px] ${page === 1 ? 'cursor-default text-[#ccc]' : 'cursor-pointer text-[#555]'}`}
              >
                &lt;
              </button>
              {pageNumbers.map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`border border-[#dee2e6] px-[10px] py-1 cursor-pointer rounded-[3px] min-w-[34px] ${page === p ? 'bg-vaya-black text-white' : 'bg-transparent text-[#555]'}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`bg-transparent border border-[#dee2e6] px-[10px] py-1 rounded-[3px] ${page === totalPages ? 'cursor-default text-[#ccc]' : 'cursor-pointer text-[#555]'}`}
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
