import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getOrdersByUnc } from '@/api/admin.api';

function fmtDate(dateStr) {
  if (!dateStr || dateStr === 'Null') return '—';
  const d = new Date(dateStr);
  return isNaN(d) ? dateStr : d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtAmount(val) {
  if (val == null || val === 'Null') return '—';
  return Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

const STATUS_COLORS = {
  Delivered: 'bg-green-100 text-green-700',
  Process: 'bg-blue-100 text-blue-700',
  Pending: 'bg-yellow-100 text-yellow-700',
};

export default function UserOrdersPage() {
  const { unc } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [selectedOrder, setSelectedOrder] = useState(null);

  const decodedUnc = decodeURIComponent(unc);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-user-orders', unc],
    queryFn: () => getOrdersByUnc(decodedUnc),
    staleTime: 5 * 60 * 1000,
  });

  const orders = data?.data ?? [];

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
      {isError && <p className="text-sm text-red-600">Failed to load orders from ERP.</p>}

      {!isLoading && !isError && (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="w-full text-sm border-collapse bg-white">
            <thead className="bg-vaya-light text-vaya-dark uppercase text-xs">
              <tr>
                {['Order ID', 'Order Date', 'Invoice ID', 'Invoice Date', 'Net Payable', 'PO Number', 'Shipping Mode', 'Order Type', 'Order Status', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-6 text-center text-gray-400">No orders found for this user.</td>
                </tr>
              ) : (
                orders.map((o, i) => (
                  <tr key={i} className="border-t hover:bg-vaya-light/30">
                    <td className="px-4 py-3">
                      {o.OrderID && o.OrderID !== 'Null' ? (
                        <button onClick={() => setSelectedOrder(o)} className="text-vaya-primary hover:underline font-medium">
                          {o.OrderID}
                        </button>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{fmtDate(o.OrderDate)}</td>
                    <td className="px-4 py-3">{o.InvoiceNo && o.InvoiceNo !== 'Null' ? o.InvoiceNo : '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{fmtDate(o.InvoiceDate)}</td>
                    <td className="px-4 py-3 text-right">{fmtAmount(o.NetPayable)}</td>
                    <td className="px-4 py-3">{o.PONumber || '—'}</td>
                    <td className="px-4 py-3">{o.ShippingMode || '—'}</td>
                    <td className="px-4 py-3">{o.OrderType || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[o.OrderStatus] || 'bg-gray-100 text-gray-600'}`}>
                        {o.OrderStatus || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {(o.OrderStatus === 'Process' || o.OrderStatus === 'Delivered') && o.InvoiceNo && o.InvoiceNo !== 'Null' && (
                        <a
                          href={`/api/orders/download/${encodeURIComponent(o.InvoiceNo)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-vaya-primary hover:underline"
                        >
                          Download
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
              <div><span className="text-gray-500">Net Payable:</span> <span className="font-medium ml-1">{fmtAmount(selectedOrder.NetPayable)}</span></div>
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
