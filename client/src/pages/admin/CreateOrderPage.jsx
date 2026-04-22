import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getOrderCustomers, getOrderProducts, getOrderAddresses, getOrderShippingModes, placeAdminOrder } from '@/api/admin.api';
import toast from 'react-hot-toast';

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
    <div className="bg-white rounded-lg shadow p-6 max-w-lg">
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
  const [pattern, setPattern] = useState('');
  const [color, setColor] = useState('');
  const [search, setSearch] = useState({ pattern: '', color: '' });
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['order-products', customer.unc, search.pattern, search.color, page],
    queryFn: () => getOrderProducts(customer.unc, { pattern: search.pattern, color: search.color, page, perPage: 20 }),
    keepPreviousData: true,
  });

  const products = data?.items ?? [];
  const total = data?.total ?? 0;
  const perPage = 20;
  const totalPages = Math.ceil(total / perPage);

  const cartCount = cart.reduce((sum, i) => sum + 1, 0);

  const getCartQty = (p) => {
    const key = `${p.Pattern}||${p.Color}`;
    return cart.find((i) => i.key === key)?.quantity ?? '';
  };

  const handleQtyChange = (p, qty) => {
    const key = `${p.Pattern}||${p.Color}`;
    const q = parseFloat(qty);
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
    setSearch({ pattern, color });
    setPage(1);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-700">
          Step 2: Browse Products — <span className="text-vaya-primary">{customer.name} ({customer.unc})</span>
        </h2>
        <div className="flex items-center gap-3">
          <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">
            Cart: {cartCount} item{cartCount !== 1 ? 's' : ''}
          </span>
          <button onClick={onNext} disabled={cartCount === 0}
            className="bg-vaya-primary text-white px-4 py-1.5 rounded text-sm hover:bg-vaya-dark disabled:opacity-50">
            View Cart & Checkout
          </button>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4 flex-wrap">
        <input value={pattern} onChange={(e) => setPattern(e.target.value)}
          placeholder="Pattern" className="border rounded px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-1 focus:ring-vaya-primary" />
        <input value={color} onChange={(e) => setColor(e.target.value)}
          placeholder="Color" className="border rounded px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-1 focus:ring-vaya-primary" />
        <button type="submit" className="bg-gray-700 text-white px-4 py-1.5 rounded text-sm hover:bg-gray-800">Search</button>
        <button type="button" onClick={() => { setPattern(''); setColor(''); setSearch({ pattern: '', color: '' }); setPage(1); }}
          className="border px-4 py-1.5 rounded text-sm hover:bg-gray-50">Clear</button>
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
                    <td className="px-3 py-2">{p.NumberOfRolls}</td>
                    <td className="px-3 py-2">{p.TotalLength}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={qty}
                        onChange={(e) => handleQtyChange(p, e.target.value)}
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

      {totalPages > 1 && (
        <div className="flex items-center gap-2 mt-3 text-sm">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="border px-3 py-1 rounded disabled:opacity-40 hover:bg-gray-50">Previous</button>
          <span className="text-gray-600">Page {page} of {totalPages} ({total} products)</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className="border px-3 py-1 rounded disabled:opacity-40 hover:bg-gray-50">Next</button>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button onClick={onBack} className="border px-4 py-2 rounded text-sm hover:bg-gray-50">Back</button>
        <button onClick={onNext} disabled={cartCount === 0}
          className="bg-vaya-primary text-white px-5 py-2 rounded text-sm hover:bg-vaya-dark disabled:opacity-50">
          View Cart & Checkout ({cartCount} item{cartCount !== 1 ? 's' : ''})
        </button>
      </div>
    </div>
  );
}

// ── Step 3: Cart Review & Checkout ─────────────────────────────────────────
function StepCheckout({ customer, cart, onCartChange, onBack, onSuccess }) {
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [orderType, setOrderType] = useState('Ordered');
  const [poNumber, setPoNumber] = useState('');
  const [shippingAddressId, setShippingAddressId] = useState('');
  const [billingAddressId, setBillingAddressId] = useState('');
  const [shipmentMode, setShipmentMode] = useState('');

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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-700">
          Step 3: Cart & Checkout — <span className="text-vaya-primary">{customer.name} ({customer.unc})</span>
        </h2>
        <button onClick={onBack} className="border px-4 py-1.5 rounded text-sm hover:bg-gray-50">Back to Products</button>
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
                      type="number" min="0.1" step="0.1"
                      value={item.quantity}
                      onChange={(e) => {
                        const q = parseFloat(e.target.value);
                        if (!isNaN(q) && q > 0) {
                          onCartChange(cart.map((c) => c.key === item.key ? { ...c, quantity: q } : c));
                        }
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
      <div className="bg-white rounded-lg shadow p-5 grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
          <select value={billingAddressId} onChange={(e) => setBillingAddressId(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm">
            <option value="">Select Billing Address</option>
            {addresses.map((a, i) => (
              <option key={i} value={a['Address ID'] || a.AddressId || i}>
                {a['Address'] || a.address}, {a['City'] || a.city}
              </option>
            ))}
          </select>
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
            min={new Date().toISOString().slice(0, 10)}
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-vaya-primary" />
        </div>
      </div>

      {/* Grand Total Banner */}
      <div className="bg-vaya-light rounded-lg p-4 mb-4 flex items-center justify-between">
        <span className="font-semibold text-vaya-dark">Grand Total</span>
        <span className="text-xl font-bold text-vaya-dark">₹ {fmt(totals.total)}</span>
      </div>

      <div className="flex gap-2">
        <button onClick={onBack} className="border px-5 py-2 rounded text-sm hover:bg-gray-50">Back</button>
        <button
          onClick={handlePlaceOrder}
          disabled={place.isPending || cart.length === 0}
          className="bg-vaya-primary text-white px-6 py-2 rounded text-sm hover:bg-vaya-dark disabled:opacity-60 font-medium"
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
