import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart, useDeleteCartItem, useEditCartItem, usePlaceOrder, useShippingModes } from '@/hooks/useProducts';
import { useAddresses } from '@/hooks/useAddresses';
import toast from 'react-hot-toast';

const containerStyle = { maxWidth: '96%', margin: '0 auto', padding: '0 15px' };

const thStyle = {
  backgroundColor: '#111111',
  color: '#ffffff',
  padding: '10px 12px',
  textAlign: 'center',
  fontWeight: 400,
  fontSize: '13px',
  whiteSpace: 'nowrap',
  border: '1px solid #333',
};

const tdStyle = {
  padding: '8px 10px',
  borderBottom: '1px solid #e0e0e0',
  verticalAlign: 'middle',
  fontSize: '13px',
  color: '#333',
};

function rupeeFormat(val) {
  const n = parseFloat(val) || 0;
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calcItem(item, cutDiscount, rollDiscount, globalGst) {
  const qty = parseFloat(item.quantity) || 0;
  const isRoll = qty >= 50;
  const rollPrice = parseFloat(item.rollPrice || item.price) || 0;
  const cutPrice = parseFloat(item.cutPrice || item.price) || 0;
  const rate = isRoll ? rollPrice : cutPrice;
  const price = rate * qty;
  const discountPct = isRoll ? rollDiscount : cutDiscount;
  const itemDiscount = (price * discountPct) / 100;
  const taxable = price - itemDiscount;
  const gstPct = parseFloat(item.gstPercent) || globalGst || 0;
  const gstAmount = (taxable * gstPct) / 100;
  const finalAmount = taxable + gstAmount;
  return { rate, rollPrice, cutPrice, price, itemDiscount, gstPct, gstAmount, finalAmount, isRoll, qty };
}

function PanelLengthPopup({ item, onClose, onSave }) {
  const [text, setText] = useState(item.remark || '');
  return (
    <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 200, background: '#fff', border: '1px solid #ccc', borderRadius: 4, padding: '12px', width: '280px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>Specify Panel Lengths</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1, color: '#555' }}>×</button>
      </div>
      <p style={{ fontSize: 11, color: '#888', margin: '0 0 6px', fontStyle: 'italic' }}>Optional — helps us send adequate roll lengths</p>
      <textarea
        rows={4}
        value={text}
        onChange={e => setText(e.target.value)}
        style={{ width: '100%', border: '1px solid #ccc', borderRadius: 3, padding: '6px', fontSize: 12, boxSizing: 'border-box', resize: 'vertical' }}
        placeholder="e.g. 3m×2, 4m×1..."
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          onClick={() => onSave(text)}
          style={{ flex: 1, backgroundColor: '#111', color: '#fff', border: 'none', padding: '6px 0', borderRadius: 3, cursor: 'pointer', fontSize: 12 }}
        >
          Confirm length
        </button>
        <button
          onClick={onClose}
          style={{ flex: 1, backgroundColor: '#fff', color: '#333', border: '1px solid #ccc', padding: '6px 0', borderRadius: 3, cursor: 'pointer', fontSize: 12 }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}

export default function CartPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: cartData, isLoading } = useCart();
  const deleteItem = useDeleteCartItem();
  const editItem = useEditCartItem();
  const placeOrderMutation = usePlaceOrder();
  const { data: addressData } = useAddresses();
  const { data: modesData } = useShippingModes();

  const items = cartData?.items ?? [];
  const cutDiscount = cartData?.userDiscounts?.cutDiscount ?? 0;
  const rollDiscount = cartData?.userDiscounts?.rollDiscount ?? 0;
  const globalGst = cartData?.gst ?? 5;
  const receivingOrderDays = cartData?.receivingOrderDays ?? 30;

  const addresses = addressData?.data ?? [];
  const shippingAddresses = addresses.filter(a => a.addressType === 'Shipping' || a.isDefault);
  const billingAddress = addresses.find(a => a.isBillingDefault) || addresses.find(a => a.addressType === 'Billing');
  const shippingModes = modesData?.modes ?? [];

  // local length state (before API save)
  const [localLengths, setLocalLengths] = useState({});
  const [popupItemId, setPopupItemId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // order form state
  const [shippingAddressId, setShippingAddressId] = useState('');
  const [shipmentMode, setShipmentMode] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [rememberPassword, setRememberPassword] = useState(false);
  const [refPoNumber, setRefPoNumber] = useState('');

  const debounceTimers = useRef({});

  // Init form from saved defaults / localStorage
  useEffect(() => {
    if (shippingAddresses.length && !shippingAddressId) {
      const def = shippingAddresses.find(a => a.isDefault) || shippingAddresses[0];
      if (def) setShippingAddressId(String(def.id));
    }
    if (shippingModes.length && !shipmentMode) {
      setShipmentMode(shippingModes[0]?.['Shipping Mode'] || '');
    }
  }, [shippingAddresses.length, shippingModes.length]);

  useEffect(() => {
    const rem = localStorage.getItem('rathp_rem') === 'true';
    const saved = localStorage.getItem('rathp') || '';
    if (rem && saved) {
      setRememberPassword(true);
      setAuthPassword(saved);
    }
  }, []);

  // Pre-fill form when arriving from convert-reserved flow
  useEffect(() => {
    const rd = location.state?.reserveDetails;
    if (!rd) return;
    if (rd.shippingAddressId) setShippingAddressId(rd.shippingAddressId);
    if (rd.shippingMode)      setShipmentMode(rd.shippingMode);
    if (rd.poNumber)          setPoNumber(rd.poNumber);
    if (rd.refPoNumber)       setRefPoNumber(rd.refPoNumber);
  }, [location.state]);

  const handleRememberPassword = (pwd, checked) => {
    if (checked && pwd) {
      localStorage.setItem('rathp_rem', 'true');
      localStorage.setItem('rathp', pwd);
    } else {
      localStorage.setItem('rathp_rem', 'false');
      localStorage.setItem('rathp', '');
    }
  };

  const handleLengthChange = (itemId, val) => {
    if (val !== '' && !/^\d*\.?\d*$/.test(val)) return;
    setLocalLengths(prev => ({ ...prev, [itemId]: val }));
    clearTimeout(debounceTimers.current[itemId]);
    debounceTimers.current[itemId] = setTimeout(() => {
      const num = parseFloat(val);
      if (!isNaN(num) && num > 0) {
        editItem.mutate({ id: itemId, quantity: num });
      }
    }, 800);
  };

  const handleLengthBlur = (itemId, val) => {
    const num = parseFloat(val);
    if (isNaN(num) || num < 1) {
      setLocalLengths(prev => ({ ...prev, [itemId]: '1' }));
      editItem.mutate({ id: itemId, quantity: 1 });
    }
  };

  const handlePanelSave = (itemId, remarkText) => {
    editItem.mutate({ id: itemId, remark: remarkText });
    setPopupItemId(null);
  };

  const getLength = (item) => {
    const local = localLengths[item.id];
    return local !== undefined ? local : String(item.quantity ?? '');
  };

  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date(Date.now() + receivingOrderDays * 86400000).toISOString().split('T')[0];

  const handleSubmit = async (orderType) => {
    if (!orderDate) { toast.error('Please select a reserve/delivery date'); return; }
    if (!authPassword) { toast.error('Please enter authorization password'); return; }
    if (!shippingAddressId) { toast.error('Please select a shipping address'); return; }

    handleRememberPassword(authPassword, rememberPassword);
    setSubmitting(true);

    const billingId = billingAddress ? String(billingAddress.id) : shippingAddressId;

    placeOrderMutation.mutate(
      { shippingAddressId, billingAddressId: billingId, shipmentMode, poNumber, orderDate, orderType, authPassword, refPoNumber },
      {
        onSuccess: (data) => {
          setSubmitting(false);
          if (data?.success !== false) {
            navigate('/products');
          }
        },
        onError: (err) => {
          setSubmitting(false);
          toast.error(err?.message || 'Failed to place order');
        },
      }
    );
  };

  const effectiveItem = (item) => {
    const local = localLengths[item.id];
    if (local !== undefined) {
      const qty = parseFloat(local);
      if (!isNaN(qty) && qty > 0) return { ...item, quantity: qty };
    }
    return item;
  };

  // Totals
  let totalPrice = 0, totalDiscount = 0, totalGst = 0;
  items.forEach(item => {
    const c = calcItem(effectiveItem(item), cutDiscount, rollDiscount, globalGst);
    totalPrice += c.price;
    totalDiscount += c.itemDiscount;
    totalGst += c.gstAmount;
  });
  const grandTotal = totalPrice - totalDiscount + totalGst;

  const labelStyle = { fontSize: 12, color: '#555', marginBottom: 4, display: 'block', fontWeight: 500 };
  const inputStyle = {
    width: '100%', border: '1px solid #ccc', borderRadius: 3,
    padding: '6px 8px', fontSize: 13,
    background: '#fff', outline: 'none', boxSizing: 'border-box',
  };
  const selectStyle = {
    width: '100%', border: '1px solid #ccc', borderRadius: 3,
    padding: '6px 8px', fontSize: 13, background: '#fff', outline: 'none', cursor: 'pointer',
  };

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      {/* Breadcrumb */}
      <div style={{ borderBottom: '1px solid rgba(112,112,112,0.2)', padding: '8px 0' }}>
        <div style={containerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => navigate('/products')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: '4px 6px', display: 'flex', alignItems: 'center' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
              </svg>
            </button>
            <span style={{ fontSize: 16, fontWeight: 500, color: '#333' }}>Order Cart</span>
          </div>
        </div>
      </div>

      {isLoading && <p style={{ textAlign: 'center', color: '#999', padding: 40 }}>Loading cart...</p>}

      {!isLoading && items.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <p style={{ color: '#666', fontSize: 16, marginBottom: 16 }}>Your cart is empty</p>
          <button
            onClick={() => navigate('/products')}
            style={{ backgroundColor: '#807A52', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 4, cursor: 'pointer', fontSize: 14 }}
          >
            Continue Shopping
          </button>
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <>
          {/* Cart table */}
          <section style={{ padding: '20px 0' }}>
            <div style={containerStyle}>
              <div style={{ overflowX: 'auto', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Product Descriptions</th>
                      <th style={thStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <span title="Rates/Prices are excluding taxes" style={{ cursor: 'help', fontSize: 11, border: '1px solid #aaa', borderRadius: '50%', width: 14, height: 14, lineHeight: '14px', textAlign: 'center', display: 'inline-block' }}>i</span>
                          Roll Rate
                        </div>
                      </th>
                      <th style={thStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <span title="Rates/Prices are excluding taxes" style={{ cursor: 'help', fontSize: 11, border: '1px solid #aaa', borderRadius: '50%', width: 14, height: 14, lineHeight: '14px', textAlign: 'center', display: 'inline-block' }}>i</span>
                          Cut Rate
                        </div>
                      </th>
                      <th style={thStyle}>Ordered Length</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Price</th>
                      <th style={thStyle}>Discount</th>
                      <th style={thStyle}>GST %</th>
                      <th style={thStyle}>GST</th>
                      <th style={thStyle}>Final Amount</th>
                      <th style={thStyle}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const c = calcItem(effectiveItem(item), cutDiscount, rollDiscount, globalGst);
                      const inStock = true; // stock was validated at add-to-cart time
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={tdStyle}>
                            Pattern: {item.pattern}, Color: {item.color}
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>
                            ₹{' '}
                            <span style={c.isRoll ? { color: '#aec148', fontWeight: 'bold', textDecoration: 'underline' } : {}}>
                              {rupeeFormat(c.rollPrice)}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>
                            ₹{' '}
                            <span style={!c.isRoll ? { color: '#aec148', fontWeight: 'bold', textDecoration: 'underline' } : {}}>
                              {rupeeFormat(c.cutPrice)}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, position: 'relative' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={getLength(item)}
                                onChange={e => handleLengthChange(item.id, e.target.value)}
                                onBlur={e => handleLengthBlur(item.id, e.target.value)}
                                style={{ width: 80, border: '1px solid #ccc', borderRadius: 3, padding: '4px 6px', fontSize: 13, outline: 'none' }}
                              />
                              <button
                                onClick={() => setPopupItemId(popupItemId === item.id ? null : item.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 2, display: 'flex', alignItems: 'center' }}
                                title="Specify panel lengths"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                  <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
                                </svg>
                              </button>
                            </div>
                            {popupItemId === item.id && (
                              <PanelLengthPopup
                                item={item}
                                onClose={() => setPopupItemId(null)}
                                onSave={(text) => handlePanelSave(item.id, text)}
                              />
                            )}
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            <span style={{ fontSize: 12, color: inStock ? '#28a745' : '#dc3545' }}>
                              {inStock ? 'In Stock' : 'No Stock - Delivery date TBD'}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>₹ {rupeeFormat(c.price)}</td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>₹ {rupeeFormat(c.itemDiscount)}</td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>{c.gstPct}%</td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>₹ {rupeeFormat(c.gstAmount)}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 500 }}>₹ {rupeeFormat(c.finalAmount)}</td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            <button
                              onClick={() => deleteItem.mutate(item.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc3545', padding: 4 }}
                              title="Remove item"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {/* Totals row */}
                    <tr style={{ backgroundColor: '#f9f9f9', fontWeight: 500 }}>
                      <td colSpan={5} style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>Total</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>₹ {rupeeFormat(totalPrice)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>₹ {rupeeFormat(totalDiscount)}</td>
                      <td colSpan={2} style={{ ...tdStyle, textAlign: 'right' }}>₹ {rupeeFormat(totalGst)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>₹ {rupeeFormat(grandTotal)}</td>
                      <td style={tdStyle}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Summary + Order Form */}
          <section style={{ padding: '10px 0 40px' }}>
            <div style={containerStyle}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: '100%', maxWidth: 720 }}>
                  {/* Total summary */}
                  <div style={{ marginBottom: 20 }}>
                    {[
                      ['Total:', totalPrice],
                      ['Discount:', totalDiscount],
                      ['GST/Tax :', totalGst],
                    ].map(([label, val]) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 24, padding: '4px 0', borderBottom: '1px solid #eee' }}>
                        <span style={{ fontSize: 14, color: '#555', minWidth: 100, textAlign: 'right' }}>{label}</span>
                        <span style={{ fontSize: 14, color: '#333', minWidth: 110, textAlign: 'right' }}>₹&nbsp;&nbsp;{rupeeFormat(val)}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 24, padding: '8px 0' }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#333', minWidth: 100, textAlign: 'right' }}>Total Amount:</span>
                      <span style={{ fontSize: 18, fontWeight: 700, color: '#333', minWidth: 110, textAlign: 'right' }}>₹&nbsp;&nbsp;{rupeeFormat(grandTotal)}</span>
                    </div>
                  </div>

                  {/* Order form */}
                  <div style={{ backgroundColor: '#e3e8cc', borderRadius: 4, padding: '24px 24px 20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', marginBottom: 16 }}>
                      {/* Shipping Address */}
                      <div>
                        <label style={labelStyle}>Shipping address</label>
                        <select
                          value={shippingAddressId}
                          onChange={e => setShippingAddressId(e.target.value)}
                          style={selectStyle}
                        >
                          {shippingAddresses.length === 0 && <option value="">No addresses found</option>}
                          {shippingAddresses.map(a => (
                            <option key={a.id} value={String(a.id)}>
                              {[a.line1, a.pincode, a.city, a.state].filter(Boolean).join(', ')}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Billing Address */}
                      <div>
                        <label style={labelStyle}>Billing Address</label>
                        <input
                          readOnly
                          value={billingAddress ? [billingAddress.line1, billingAddress.pincode, billingAddress.city, billingAddress.state].filter(Boolean).join(', ') : ''}
                          style={{ ...inputStyle, color: '#555', cursor: 'default' }}
                          placeholder="No billing address found"
                        />
                      </div>

                      {/* Shipment Mode */}
                      <div>
                        <label style={labelStyle}>Shipment Mode</label>
                        <select
                          value={shipmentMode}
                          onChange={e => setShipmentMode(e.target.value)}
                          style={selectStyle}
                          required
                        >
                          {shippingModes.length === 0 && <option value="">Loading...</option>}
                          {shippingModes.map((m, i) => (
                            <option key={i} value={m['Shipping Mode']}>{m['Shipping Mode']}</option>
                          ))}
                        </select>
                      </div>

                      {/* PO Number */}
                      <div>
                        <label style={labelStyle}>PO Number (Optional)</label>
                        <input
                          type="text"
                          value={poNumber}
                          onChange={e => setPoNumber(e.target.value)}
                          style={inputStyle}
                          placeholder="PO No./Reference No./Name"
                          autoComplete="off"
                        />
                      </div>

                      {/* Reserve/Delivery Date */}
                      <div>
                        <label style={labelStyle}>Select reserve / delivery date</label>
                        <input
                          type="date"
                          value={orderDate}
                          onChange={e => setOrderDate(e.target.value)}
                          min={today}
                          max={maxDate}
                          style={inputStyle}
                          required
                        />
                      </div>

                      {/* Auth Password */}
                      <div>
                        <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={rememberPassword}
                            onChange={e => {
                              setRememberPassword(e.target.checked);
                              handleRememberPassword(authPassword, e.target.checked);
                            }}
                            style={{ cursor: 'pointer' }}
                          />
                          Remember Password
                        </label>
                        <input
                          type="password"
                          value={authPassword}
                          onChange={e => setAuthPassword(e.target.value)}
                          onBlur={() => handleRememberPassword(authPassword, rememberPassword)}
                          style={inputStyle}
                          placeholder="Enter Authorization Password"
                          autoComplete="new-password"
                          required
                        />
                      </div>
                    </div>

                    {/* Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginTop: 8 }}>
                      <button
                        type="button"
                        onClick={() => handleSubmit('Reserved')}
                        disabled={submitting}
                        style={{
                          backgroundColor: '#fff',
                          color: '#333',
                          border: '2px solid #333',
                          padding: '10px 32px',
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: submitting ? 'not-allowed' : 'pointer',
                          borderRadius: 2,
                          opacity: submitting ? 0.6 : 1,
                          letterSpacing: '0.5px',
                        }}
                      >
                        Reserve Stock
                      </button>
                      <span style={{ color: '#888', fontSize: 13 }}>OR</span>
                      <button
                        type="button"
                        onClick={() => handleSubmit('Ordered')}
                        disabled={submitting}
                        style={{
                          backgroundColor: '#fff',
                          color: '#333',
                          border: '2px solid #333',
                          padding: '10px 32px',
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: submitting ? 'not-allowed' : 'pointer',
                          borderRadius: 2,
                          opacity: submitting ? 0.6 : 1,
                          letterSpacing: '0.5px',
                        }}
                      >
                        Place Order
                      </button>
                    </div>

                    {submitting && (
                      <p style={{ textAlign: 'center', marginTop: 12, fontSize: 14, color: '#555' }}>
                        Processing your order. Please wait...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
