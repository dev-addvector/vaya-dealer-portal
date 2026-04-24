import { useState, useMemo } from 'react';
import { useReservedOrders, useConvertReserved } from '@/hooks/useOrders';
import { downloadOpenOrderPdf } from '@/api/order.api';
import { container, breadcrumb } from '@/styles/page';

const th = {
  backgroundColor: '#111111',
  color: '#ffffff',
  padding: '10px 10px',
  textAlign: 'center',
  fontWeight: 400,
  fontSize: '14px',
  border: '1px solid #333',
  whiteSpace: 'nowrap',
};

const td = {
  padding: '8px 10px',
  textAlign: 'center',
  color: '#555',
  fontSize: '14px',
  border: '1px solid #dee2e6',
  verticalAlign: 'middle',
};

const filterCell = { padding: '4px 6px', border: '1px solid #dee2e6' };

const filterSelect = {
  width: '100%',
  padding: '4px 6px',
  fontSize: '13px',
  border: '1px solid #ccc',
  borderRadius: '3px',
  height: '30px',
  boxSizing: 'border-box',
  backgroundColor: '#fff',
};

const filterInput = { ...filterSelect };

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
  if (!filterDate || !orderDate) return true;
  const [y, m, d] = filterDate.split('-');
  return (orderDate || '').startsWith(`${d}-${m}-${y}`);
}

export default function ReservedOrdersPage() {
  const { data, isLoading } = useReservedOrders();
  const convert = useConvertReserved();
  const orders = data?.data ?? [];

  const [filters, setFilters] = useState({
    orderId: '', orderDate: '', netPayable: '', po: '', shipping: '', orderType: '', orderStatus: '',
  });
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [downloading, setDownloading] = useState(null);
  const [sort, setSort] = useState({ key: 'OrderDate', dir: 'desc' });

  const unique = (key) => [...new Set(orders.map(o => o[key]).filter(v => v && String(v).toLowerCase() !== 'null'))];

  const orderIds = useMemo(() => unique('OrderID'), [orders]);
  const poNumbers = useMemo(() => unique('PONumber'), [orders]);
  const shippingModes = useMemo(() => unique('ShippingMode'), [orders]);
  const orderTypes = useMemo(() => unique('OrderType'), [orders]);
  const orderStatuses = useMemo(() => unique('OrderStatus'), [orders]);

  const filtered = useMemo(() => orders.filter(o => {
    if (filters.orderId && o.OrderID !== filters.orderId) return false;
    if (!matchesDate(o.OrderDate, filters.orderDate)) return false;
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
      if (sort.key === 'OrderDate')       { av = parseErpDate(a.OrderDate);  bv = parseErpDate(b.OrderDate); }
      else if (sort.key === 'NetPayable') { av = netPayableNum(a); bv = netPayableNum(b); }
      else { av = (a[sort.key] || '').toLowerCase(); bv = (b[sort.key] || '').toLowerCase(); }
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
      <div style={breadcrumb.wrap}>
        <div style={container}>
          <span style={breadcrumb.title}>Reserved Orders</span>
        </div>
      </div>

      <section>
        <div style={{ ...container, paddingBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '20px', marginBottom: '8px', fontSize: '14px', color: '#555' }}>
            Show&nbsp;
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              style={{ margin: '0 6px', padding: '2px 6px', fontSize: '14px', border: '1px solid #ccc', borderRadius: '3px' }}
            >
              {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            &nbsp;entries
          </div>

          <div style={{ boxShadow: '0px 2px 15px #00000038', overflowX: 'auto' }}>
            {isLoading && <p style={{ padding: '24px', color: '#999', fontSize: '14px' }}>Loading...</p>}
            {!isLoading && (
              <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', fontSize: '14px' }}>
                <thead>
                  <tr>
                    {[
                      { label: 'Order ID',      key: 'OrderID' },
                      { label: 'Order Date',    key: 'OrderDate' },
                      { label: 'Net Payable',   key: 'NetPayable' },
                      { label: 'PO Number',     key: 'PONumber' },
                      { label: 'Shipping Mode', key: 'ShippingMode' },
                      { label: 'Order Type',    key: 'OrderType' },
                      { label: 'Order Status',  key: 'OrderStatus' },
                      { label: 'Action',        key: null },
                    ].map(({ label, key }) => (
                      <th
                        key={label}
                        style={{ ...th, cursor: key ? 'pointer' : 'default', userSelect: 'none' }}
                        onClick={() => key && handleSort(key)}
                      >
                        {label}
                        {key && <span style={{ marginLeft: '5px', opacity: sort.key === key ? 1 : 0.3, fontSize: '11px' }}>{sort.key === key && sort.dir === 'desc' ? '▼' : '▲'}</span>}
                      </th>
                    ))}
                  </tr>
                  <tr style={{ backgroundColor: '#fff' }}>
                    <td style={filterCell}>
                      <select value={filters.orderId} onChange={e => setFilter('orderId', e.target.value)} style={filterSelect}>
                        <option value="">Select OrderID</option>
                        {orderIds.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </td>
                    <td style={filterCell}>
                      <input type="date" value={filters.orderDate} onChange={e => setFilter('orderDate', e.target.value)} style={filterInput} />
                    </td>
                    <td style={filterCell}>
                      <input type="text" placeholder="Net Payable" value={filters.netPayable} onChange={e => setFilter('netPayable', e.target.value)} style={filterInput} />
                    </td>
                    <td style={filterCell}>
                      <select value={filters.po} onChange={e => setFilter('po', e.target.value)} style={filterSelect}>
                        <option value="">Search PO</option>
                        {poNumbers.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </td>
                    <td style={filterCell}>
                      <select value={filters.shipping} onChange={e => setFilter('shipping', e.target.value)} style={filterSelect}>
                        <option value="">Shipping Mode</option>
                        {shippingModes.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </td>
                    <td style={filterCell}>
                      <select value={filters.orderType} onChange={e => setFilter('orderType', e.target.value)} style={filterSelect}>
                        <option value="">Select Type</option>
                        {orderTypes.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </td>
                    <td style={filterCell}>
                      <select value={filters.orderStatus} onChange={e => setFilter('orderStatus', e.target.value)} style={filterSelect}>
                        <option value="">Select Status</option>
                        {orderStatuses.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </td>
                    <td style={filterCell} />
                  </tr>
                </thead>
                <tbody>
                  {paged.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ ...td, color: '#999', padding: '24px' }}>No reserved orders found.</td>
                    </tr>
                  ) : paged.map((o, i) => {
                    const orderId = (!o.OrderID || String(o.OrderID).toLowerCase() === 'null') ? 'N/A' : o.OrderID;
                    const po = o.PONumber;
                    return (
                      <tr
                        key={po ?? i}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                      >
                        <td style={td}>{orderId}</td>
                        <td style={td}>{o.OrderDate ?? 'N/A'}</td>
                        <td style={{ ...td, textAlign: 'right' }}>{formatNetPayable(o)}</td>
                        <td style={td}>{po ?? 'N/A'}</td>
                        <td style={td}>{o.ShippingMode ?? 'N/A'}</td>
                        <td style={td}>{o.OrderType ?? 'N/A'}</td>
                        <td style={td}>{o.OrderStatus ?? 'N/A'}</td>
                        <td style={td}>
                          {po ? (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                              <button
                                onClick={() => handleDownload(po)}
                                disabled={downloading === po}
                                title="Download Proforma Invoice"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: '18px', lineHeight: 1, padding: 0 }}
                              >
                                &#8681;
                              </button>
                              <button
                                onClick={() => convert.mutate(po)}
                                disabled={convert.isPending}
                                title="Convert to Order"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: '16px', lineHeight: 1, padding: 0 }}
                              >
                                &#128722;
                              </button>
                            </div>
                          ) : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {!isLoading && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', marginTop: '20px', fontSize: '14px' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ background: 'none', border: '1px solid #dee2e6', padding: '4px 10px', cursor: page === 1 ? 'default' : 'pointer', borderRadius: '3px', color: page === 1 ? '#ccc' : '#555' }}
              >
                &lt;
              </button>
              {pageNumbers.map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{ background: page === p ? '#111' : 'none', color: page === p ? '#fff' : '#555', border: '1px solid #dee2e6', padding: '4px 10px', cursor: 'pointer', borderRadius: '3px', minWidth: '34px' }}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ background: 'none', border: '1px solid #dee2e6', padding: '4px 10px', cursor: page === totalPages ? 'default' : 'pointer', borderRadius: '3px', color: page === totalPages ? '#ccc' : '#555' }}
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
