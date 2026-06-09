import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getOrderCustomers, getOrderProducts, getOrderAddresses, getOrderShippingModes, placeAdminOrder, getOrderFilterOptions } from '@/api/admin.api';
import SearchableSelect from '@/components/SearchableSelect';
import toast from 'react-hot-toast';
import { todayIST } from '@/utils/dateUtils';

const round1 = (n) => Math.round(n * 10) / 10;

function RollModal({ product, onClose }) {
  if (!product) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.4)]" />
      <div className="relative bg-white rounded-[4px] p-5 min-w-[320px] max-w-[420px] shadow-[0_4px_24px_rgba(0,0,0,0.18)]" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-[10px] right-[14px] bg-transparent border-none text-[20px] cursor-pointer text-[#555] leading-none">×</button>
        <div className="font-semibold text-sm mb-3 text-gray-700">{product.Pattern} — {product.Color}</div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="text-[13px] text-[#555] font-medium">Unique Roll Number</div>
          <div className="text-[13px] text-[#555] font-medium">Length</div>
        </div>
        <div className="max-h-[320px] overflow-y-auto">
          {product.Rolls.map((r, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 mb-2">
              <input readOnly value={r.PcSINo || ''} className="border border-[#C8C8C8] rounded-[3px] px-[10px] py-[6px] text-[13px] bg-[#f9f9f9] outline-none w-full" />
              <input readOnly value={r.Length || ''} className="border border-[#C8C8C8] rounded-[3px] px-[10px] py-[6px] text-[13px] bg-[#f9f9f9] outline-none w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Step 1: Customer Selection ─────────────────────────────────────────────
function StepSelectCustomer({ onSelect }) {
  const { data, isLoading } = useQuery({ queryKey: ['order-customers'], queryFn: getOrderCustomers });
  const customers = data?.data ?? [];
  const [selected, setSelected] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const c = customers.find((x) => x.unc === selected);
    if (c) onSelect(c);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6 max-w-lg">
      <h2 className="text-base font-semibold mb-4 text-gray-700">Step 1: Select Customer</h2>
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading customers...</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-600 block mb-1">Customer <span className="text-red-500">*</span></label>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              required
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vaya-primary"
            >
              <option value="">Select Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.unc}>
                  {c.name} - {c.unc}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={!selected}
              className="bg-vaya-primary text-white px-5 py-2 rounded text-sm hover:bg-vaya-dark disabled:opacity-50">
              Next: Browse Products
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Step 2: Product Browse & Cart ──────────────────────────────────────────
function StepSelectProducts({ customer, cart, onCartChange, onNext, onBack }) {
  const [draftPattern, setDraftPattern] = useState('');
  const [draftColor, setDraftColor] = useState('');
  const [search, setSearch] = useState({ pattern: '', color: '' });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const PAGE_SIZE_OPTIONS = [10, 20, 25, 50, 100];
  const [rollModal, setRollModal] = useState(null);
  const [draftQtys, setDraftQtys] = useState({});

  const { data: filtersData, isLoading: filtersLoading } = useQuery({
    queryKey: ['order-filter-options', customer.unc],
    queryFn: () => getOrderFilterOptions(customer.unc),
    staleTime: 30 * 60 * 1000,
  });

  const allPatterns = useMemo(() => filtersData?.data?.patterns ?? [], [filtersData]);
  const allColors = useMemo(() => filtersData?.data?.colors ?? [], [filtersData]);
  const patternColorsMap = useMemo(() => filtersData?.data?.patternColors ?? {}, [filtersData]);
  const colorPatternsMap = useMemo(() => filtersData?.data?.colorPatterns ?? {}, [filtersData]);

  const patterns = useMemo(() => {
    if (draftColor && colorPatternsMap[draftColor]) return colorPatternsMap[draftColor];
    return allPatterns;
  }, [allPatterns, draftColor, colorPatternsMap]);

  const colors = useMemo(() => {
    if (draftPattern && patternColorsMap[draftPattern]) return patternColorsMap[draftPattern];
    return allColors;
  }, [allColors, draftPattern, patternColorsMap]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['order-products', customer.unc, search.pattern, search.color, page, perPage],
    queryFn: () => getOrderProducts(customer.unc, { pattern: search.pattern, color: search.color, page, perPage }),
    keepPreviousData: true,
  });

  const products = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / perPage);

  const cartCount = cart.reduce((sum, i) => sum + 1, 0);

  const getCartQty = (p) => {
    const key = `${p.Pattern}||${p.Color}`;
    return cart.find((i) => i.key === key)?.quantity ?? '';
  };

  const handleQtyChange = (p, qty) => {
    const key = `${p.Pattern}||${p.Color}`;
    const q = round1(parseFloat(qty));
    if (!qty || isNaN(q) || q <= 0) {
      onCartChange(cart.filter((i) => i.key !== key));
    } else {
      const existing = cart.find((i) => i.key === key);
      if (existing) {
        onCartChange(cart.map((i) => i.key === key ? { ...i, quantity: q } : i));
      } else {
        onCartChange([...cart, {
          key,
          pattern: p.Pattern,
          color: p.Color,
          rollPrice: parseFloat(p.RollPrice) || 0,
          cutPrice: parseFloat(p.CutPrice) || 0,
          quantity: q,
          remark: '',
        }]);
      }
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch({ pattern: draftPattern, color: draftColor });
    setPage(1);
  };

  const handleClear = () => {
    setDraftPattern('');
    setDraftColor('');
    setSearch({ pattern: '', color: '' });
    setPage(1);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
        <h2 className="text-base font-semibold text-gray-700 break-words">
          Step 2: Browse Products — <span className="text-vaya-primary">{customer.name} ({customer.unc})</span>
        </h2>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">
            Cart: {cartCount} item{cartCount !== 1 ? 's' : ''}
          </span>
          <button onClick={onNext} disabled={cartCount === 0}
            className="bg-vaya-primary text-white px-4 py-1.5 rounded text-sm hover:bg-vaya-dark disabled:opacity-50">
            View Cart & Checkout
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
        <span>Show</span>
        <select
          value={perPage}
          onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
          className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-vaya-green"
        >
          {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <span>entries</span>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 mb-4 items-end">
        <div className="w-full sm:w-48">
          <SearchableSelect
            value={draftPattern}
            onChange={(val) => {
              setDraftPattern(val);
              if (draftColor && val && !patternColorsMap[val]?.includes(draftColor)) setDraftColor('');
            }}
            options={patterns}
            placeholder={filtersLoading ? 'Loading...' : 'Pattern'}
            disabled={filtersLoading}
            className="h-[34px]"
          />
        </div>
        <div className="w-full sm:w-48">
          <SearchableSelect
            value={draftColor}
            onChange={(val) => {
              setDraftColor(val);
              if (draftPattern && val && !colorPatternsMap[val]?.includes(draftPattern)) setDraftPattern('');
            }}
            options={colors}
            placeholder={filtersLoading ? 'Loading...' : 'Color'}
            disabled={filtersLoading}
            className="h-[34px]"
          />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="bg-gray-700 text-white px-4 py-1.5 rounded text-sm hover:bg-gray-800">Search</button>
          <button type="button" onClick={handleClear}
            className="border px-4 py-1.5 rounded text-sm hover:bg-gray-50">Clear</button>
        </div>
      </form>

      {isLoading && <p className="text-sm text-gray-500 mb-3">Loading products...</p>}
      {isError && <p className="text-sm text-red-500 mb-3">Failed to load products. Check ERP connection.</p>}

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="w-full text-sm border-collapse bg-white">
          <thead className="bg-vaya-light text-vaya-dark uppercase text-xs">
            <tr>
              {['Pattern', 'Color', 'Cut Price', 'Roll Price', 'No. of Rolls', 'Total Length', 'Qty (mtrs)', 'Action'].map((h) => (
                <th key={h} className="px-3 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && !isLoading ? (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-400">No products found.</td></tr>
            ) : (
              products.map((p, i) => {
                const key = `${p.Pattern}||${p.Color}`;
                const qty = getCartQty(p);
                const inCart = !!cart.find((c) => c.key === key);
                return (
                  <tr key={i} className={`border-t hover:bg-vaya-light/30 ${inCart ? 'bg-green-50' : ''}`}>
                    <td className="px-3 py-2 font-medium">{p.Pattern}</td>
                    <td className="px-3 py-2">{p.Color}</td>
                    <td className="px-3 py-2">{Number(p.CutPrice).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2">{Number(p.RollPrice).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2">
                      {p.NumberOfRolls > 0 ? (
                        <button
                          onClick={() => setRollModal(p)}
                          className="text-blue-600 hover:underline font-medium bg-transparent border-none cursor-pointer p-0"
                        >
                          {p.NumberOfRolls}
                        </button>
                      ) : p.NumberOfRolls}
                    </td>
                    <td className="px-3 py-2">{Number(p.TotalLength).toFixed(1)}</td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={draftQtys[key] !== undefined ? draftQtys[key] : (qty !== '' ? String(qty) : '')}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === '' || /^\d*\.?\d*$/.test(v))
                            setDraftQtys(prev => ({ ...prev, [key]: v }));
                        }}
                        onBlur={() => {
                          const draft = draftQtys[key];
                          if (draft === undefined) return;
                          const raw = parseFloat(draft);
                          const rounded = (!draft || isNaN(raw) || raw <= 0) ? '' : String(raw < 1 ? 1 : round1(raw));
                          setDraftQtys(prev => { const n = { ...prev }; delete n[key]; return n; });
                          handleQtyChange(p, rounded);
                        }}
                        placeholder="0"
                        className="border rounded px-2 py-1 w-20 text-sm focus:outline-none focus:ring-1 focus:ring-vaya-primary"
                      />
                    </td>
                    <td className="px-3 py-2">
                      {inCart ? (
                        <button onClick={() => onCartChange(cart.filter((c) => c.key !== key))}
                          className="text-red-500 text-xs hover:underline">Remove</button>
                      ) : (
                        <span className="text-gray-400 text-xs">Enter qty to add</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {total > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 gap-3">
          <p className="text-sm text-gray-500 text-center sm:text-left">
            {`Showing ${(page - 1) * perPage + 1} to ${Math.min(page * perPage, total)} of ${total} entries`}
          </p>
          <div className="flex items-center gap-1 justify-center">
            <button
              disabled={page <= 1}
              onClick={() => setPage(1)}
              className="px-2.5 py-1.5 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
            >«</button>
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
            >Previous</button>
            {(() => {
              let pages;
              if (totalPages <= 7) pages = Array.from({ length: totalPages }, (_, i) => i + 1);
              else if (page <= 4) pages = [1, 2, 3, 4, 5, '…', totalPages];
              else if (page >= totalPages - 3) pages = [1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
              else pages = [1, '…', page - 1, page, page + 1, '…', totalPages];
              return pages.map((n, idx) =>
                n === '…' ? (
                  <span key={`e-${idx}`} className="px-2 py-1.5 text-sm text-gray-400">…</span>
                ) : (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`px-3 py-1.5 text-sm border rounded ${
                      n === page ? 'bg-vaya-primary text-white border-vaya-primary' : 'hover:bg-gray-50'
                    }`}
                  >{n}</button>
                )
              );
            })()}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
            >Next</button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
              className="px-2.5 py-1.5 text-sm border rounded disabled:opacity-40 hover:bg-gray-50"
            >»</button>
          </div>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button onClick={onBack} className="border px-4 py-2 rounded text-sm hover:bg-gray-50">Back</button>
        <button onClick={onNext} disabled={cartCount === 0}
          className="bg-vaya-primary text-white px-5 py-2 rounded text-sm hover:bg-vaya-dark disabled:opacity-50">
          View Cart & Checkout ({cartCount} item{cartCount !== 1 ? 's' : ''})
        </button>
      </div>

      <RollModal product={rollModal} onClose={() => setRollModal(null)} />
    </div>
  );
}

// ── Step 3: Cart Review & Checkout ─────────────────────────────────────────
function StepCheckout({ customer, cart, onCartChange, onBack, onSuccess }) {
  const [orderDate, setOrderDate] = useState(todayIST());
  const [orderType, setOrderType] = useState('Ordered');
  const [poNumber, setPoNumber] = useState('');
  const [shippingAddressId, setShippingAddressId] = useState('');
  const [shipmentMode, setShipmentMode] = useState('');
  const [draftQtys, setDraftQtys] = useState({});

  const { data: addrData } = useQuery({
    queryKey: ['order-addresses', customer.unc],
    queryFn: () => getOrderAddresses(customer.unc),
  });
  const { data: shipData } = useQuery({
    queryKey: ['order-shipping', customer.unc],
    queryFn: () => getOrderShippingModes(customer.unc),
  });

  const addresses = addrData?.data ?? [];
  const shippingModes = shipData?.data ?? [];

  const billingAddress = addresses.find(
    (a) => a['Address Type'] === 'Billing' || a.AddressType === 'Billing' || a.isBillingDefault
  ) || addresses[0] || null;
  const billingAddressId = billingAddress?.['Address ID'] || billingAddress?.AddressId || '';

  const cutDiscount = parseFloat(customer.cutDiscount || 0);
  const rollDiscount = parseFloat(customer.rollDiscount || 0);
  const globalGst = 5;

  const computeRow = (item) => {
    const qty = Number(item.quantity) || 0;
    const isRoll = qty >= 50;
    const rate = isRoll ? item.rollPrice : item.cutPrice;
    const amount = rate * qty;
    const discPct = isRoll ? rollDiscount : cutDiscount;
    const discount = (amount * discPct) / 100;
    const taxable = amount - discount;
    const gst = (taxable * globalGst) / 100;
    const total = taxable + gst;
    return { qty, rate, amount, discount, gst, total };
  };

  const totals = cart.reduce(
    (acc, item) => {
      const r = computeRow(item);
      return { amount: acc.amount + r.amount, discount: acc.discount + r.discount, gst: acc.gst + r.gst, total: acc.total + r.total };
    },
    { amount: 0, discount: 0, gst: 0, total: 0 }
  );

  const place = useMutation({
    mutationFn: placeAdminOrder,
    onSuccess: () => { toast.success('Order placed successfully!'); onSuccess(); },
    onError: (err) => toast.error(err.message || 'Failed to place order'),
  });

  const handlePlaceOrder = () => {
    if (!orderDate) return toast.error('Order date is required');
    place.mutate({
      unc: customer.unc,
      cartItems: cart,
      shippingAddressId,
      billingAddressId,
      shipmentMode,
      poNumber,
      orderDate,
      orderType,
      cutDiscount,
      rollDiscount,
    });
  };

  const fmt = (n) => Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-base font-semibold text-gray-700 break-words">
          Step 3: Cart & Checkout — <span className="text-vaya-primary">{customer.name} ({customer.unc})</span>
        </h2>
        <button onClick={onBack} className="border px-4 py-1.5 rounded text-sm hover:bg-gray-50 w-full sm:w-auto">Back to Products</button>
      </div>

      {/* Cart Table */}
      <div className="overflow-x-auto rounded-lg shadow mb-6">
        <table className="w-full text-sm border-collapse bg-white">
          <thead className="bg-vaya-light text-vaya-dark uppercase text-xs">
            <tr>
              {['Pattern & Color', 'Roll Price', 'Cut Price', 'Qty', 'Amount', 'Discount', `GST ${globalGst}%`, 'Total', 'Action'].map((h) => (
                <th key={h} className="px-3 py-3 text-right first:text-left font-semibold whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cart.map((item) => {
              const r = computeRow(item);
              return (
                <tr key={item.key} className="border-t hover:bg-vaya-light/30">
                  <td className="px-3 py-3">
                    <div className="font-medium">{item.pattern}</div>
                    <div className="text-gray-500 text-xs">{item.color}</div>
                  </td>
                  <td className="px-3 py-3 text-right">{fmt(item.rollPrice)}</td>
                  <td className="px-3 py-3 text-right">{fmt(item.cutPrice)}</td>
                  <td className="px-3 py-3 text-right">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={draftQtys[item.key] !== undefined ? draftQtys[item.key] : String(item.quantity)}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '' || /^\d*\.?\d*$/.test(v))
                          setDraftQtys(prev => ({ ...prev, [item.key]: v }));
                      }}
                      onBlur={() => {
                        const draft = draftQtys[item.key];
                        if (draft === undefined) return;
                        const raw = parseFloat(draft);
                        setDraftQtys(prev => { const n = { ...prev }; delete n[item.key]; return n; });
                        if (!isNaN(raw) && raw > 0)
                          onCartChange(cart.map((c) => c.key === item.key ? { ...c, quantity: raw < 1 ? 1 : round1(raw) } : c));
                      }}
                      className="border rounded px-2 py-1 w-20 text-sm text-right focus:outline-none focus:ring-1 focus:ring-vaya-primary"
                    />
                  </td>
                  <td className="px-3 py-3 text-right">{fmt(r.amount)}</td>
                  <td className="px-3 py-3 text-right">{fmt(r.discount)}</td>
                  <td className="px-3 py-3 text-right">{fmt(r.gst)}</td>
                  <td className="px-3 py-3 text-right font-medium">{fmt(r.total)}</td>
                  <td className="px-3 py-3 text-right">
                    <button onClick={() => onCartChange(cart.filter((c) => c.key !== item.key))}
                      className="text-red-500 text-xs hover:underline">Remove</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50 font-semibold text-sm">
            <tr className="border-t-2">
              <td colSpan={4} className="px-3 py-2 text-right text-gray-600">SubTotal</td>
              <td className="px-3 py-2 text-right">{fmt(totals.amount)}</td>
              <td className="px-3 py-2 text-right">{fmt(totals.discount)}</td>
              <td className="px-3 py-2 text-right">{fmt(totals.gst)}</td>
              <td className="px-3 py-2 text-right text-vaya-dark">{fmt(totals.total)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Order Details */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-xs text-gray-600 block mb-1">Shipping Address</label>
          <select value={shippingAddressId} onChange={(e) => setShippingAddressId(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm">
            <option value="">Select Shipping Address</option>
            {addresses.map((a, i) => (
              <option key={i} value={a['Address ID'] || a.AddressId || i}>
                {a['Address'] || a.address}, {a['City'] || a.city}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-600 block mb-1">Billing Address</label>
          <input
            readOnly
            value={billingAddress
              ? `${billingAddress['Address'] || billingAddress.address || ''}, ${billingAddress['City'] || billingAddress.city || ''}`.replace(/^,\s*|,\s*$/, '')
              : ''}
            placeholder="No billing address found"
            className="w-full border rounded px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-default"
          />
        </div>

        <div>
          <label className="text-xs text-gray-600 block mb-1">Order Type <span className="text-red-500">*</span></label>
          <select value={orderType} onChange={(e) => setOrderType(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm">
            <option value="Ordered">Ordered</option>
            <option value="Reserved">Reserved</option>
          </select>
        </div>

        {orderType !== 'Reserved' && (
          <div>
            <label className="text-xs text-gray-600 block mb-1">Shipping Mode</label>
            <select value={shipmentMode} onChange={(e) => setShipmentMode(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm">
              <option value="">Select Shipping Mode</option>
              {shippingModes.length > 0
                ? shippingModes.map((m, i) => <option key={i} value={m['Shipping Mode'] || m}>{m['Shipping Mode'] || m}</option>)
                : ['Air', 'Surface', 'Sea', 'TBD'].map((m) => <option key={m} value={m}>{m}</option>)
              }
            </select>
          </div>
        )}

        <div>
          <label className="text-xs text-gray-600 block mb-1">PO Number</label>
          <input type="text" value={poNumber} onChange={(e) => setPoNumber(e.target.value)}
            placeholder="Optional"
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vaya-primary" />
        </div>

        <div>
          <label className="text-xs text-gray-600 block mb-1">Order / Delivery Date <span className="text-red-500">*</span></label>
          <input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)}
            min={todayIST()}
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vaya-primary" />
        </div>
      </div>

      {/* Grand Total Banner */}
      <div className="bg-vaya-light rounded-lg p-4 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span className="font-semibold text-vaya-dark">Grand Total</span>
        <span className="text-xl font-bold text-vaya-dark">₹ {fmt(totals.total)}</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <button onClick={onBack} className="border px-5 py-2 rounded text-sm hover:bg-gray-50 w-full sm:w-auto">Back</button>
        <button
          onClick={handlePlaceOrder}
          disabled={place.isPending || cart.length === 0}
          className="bg-vaya-primary text-white px-6 py-2 rounded text-sm hover:bg-vaya-dark disabled:opacity-60 font-medium w-full sm:w-auto"
        >
          {place.isPending ? 'Placing Order...' : 'Place Order'}
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function CreateOrderPage() {
  const [step, setStep] = useState(1);
  const [customer, setCustomer] = useState(null);
  const [cart, setCart] = useState([]);

  const handleSelectCustomer = (c) => {
    setCustomer(c);
    setCart([]);
    setStep(2);
  };

  const handleSuccess = () => {
    setStep(1);
    setCustomer(null);
    setCart([]);
  };

  const stepLabels = ['Select Customer', 'Browse Products', 'Cart & Checkout'];

  return (
    <div>
      <h1 className="text-xl font-bold mb-4 text-gray-800">Create Order</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-6">
        {stepLabels.map((label, i) => {
          const n = i + 1;
          const active = step === n;
          const done = step > n;
          return (
            <div key={n} className="flex items-center">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium
                ${active ? 'bg-vaya-primary text-white' : done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                  ${active ? 'bg-white text-vaya-primary' : done ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                  {done ? '✓' : n}
                </span>
                {label}
              </div>
              {i < stepLabels.length - 1 && <div className="w-6 h-px bg-gray-300 mx-1" />}
            </div>
          );
        })}
      </div>

      {step === 1 && <StepSelectCustomer onSelect={handleSelectCustomer} />}
      {step === 2 && customer && (
        <StepSelectProducts
          customer={customer}
          cart={cart}
          onCartChange={setCart}
          onNext={() => { if (cart.length > 0) setStep(3); else toast.error('Add at least one item to cart'); }}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && customer && (
        <StepCheckout
          customer={customer}
          cart={cart}
          onCartChange={setCart}
          onBack={() => setStep(2)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
