import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart, useDeleteCartItem, useEditCartItem, usePlaceOrder, useShippingModes } from '@/hooks/useProducts';
import { useAddresses } from '@/hooks/useAddresses';
import toast from 'react-hot-toast';

const thBase = 'bg-vaya-black text-white px-[12px] py-[10px] text-center font-normal text-[13px] whitespace-nowrap border border-[#333]';
const tdBase = 'px-[10px] py-2 border-b border-[#e0e0e0] align-middle text-[13px] text-[#333]';

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
    <div className="absolute top-full left-0 z-[200] bg-white border border-[#ccc] rounded p-3 w-[280px] shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-[13px]">Specify Panel Lengths</span>
        <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-[16px] leading-none text-[#555]">×</button>
      </div>
      <p className="text-[11px] text-[#888] m-0 mb-[6px] italic">Optional — helps us send adequate roll lengths</p>
      <textarea
        rows={4}
        value={text}
        onChange={e => setText(e.target.value)}
        className="w-full border border-[#ccc] rounded-[3px] p-[6px] text-[12px] resize-y"
        placeholder="e.g. 3m×2, 4m×1..."
      />
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => onSave(text)}
          className="flex-1 bg-vaya-black text-white border-none py-[6px] rounded-[3px] cursor-pointer text-[12px]"
        >
          Confirm length
        </button>
        <button
          onClick={onClose}
          className="flex-1 bg-white text-[#333] border border-[#ccc] py-[6px] rounded-[3px] cursor-pointer text-[12px]"
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

  const [localLengths, setLocalLengths] = useState({});
  const [popupItemId, setPopupItemId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [shippingAddressId, setShippingAddressId] = useState('');
  const [shipmentMode, setShipmentMode] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [rememberPassword, setRememberPassword] = useState(false);
  const [refPoNumber, setRefPoNumber] = useState('');

  const debounceTimers = useRef({});

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

  let totalPrice = 0, totalDiscount = 0, totalGst = 0;
  items.forEach(item => {
    const c = calcItem(effectiveItem(item), cutDiscount, rollDiscount, globalGst);
    totalPrice += c.price;
    totalDiscount += c.itemDiscount;
    totalGst += c.gstAmount;
  });
  const grandTotal = totalPrice - totalDiscount + totalGst;

  const inputCls = 'w-full border border-[#ccc] rounded-[3px] px-2 py-[6px] text-[13px] bg-white outline-none';
  const labelCls = 'text-[12px] text-[#555] mb-1 block font-medium';

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-[rgba(112,112,112,0.2)] py-2">
        <div className="max-w-[96%] mx-auto px-[15px]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/products')}
              className="bg-transparent border-none cursor-pointer text-[#555] px-[6px] py-1 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
              </svg>
            </button>
            <span className="text-[16px] font-medium text-[#333]">Order Cart</span>
          </div>
        </div>
      </div>

      {isLoading && <p className="text-center text-[#999] p-10">Loading cart...</p>}

      {!isLoading && items.length === 0 && (
        <div className="text-center p-[60px]">
          <p className="text-[#666] text-[16px] mb-4">Your cart is empty</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-vaya-primary text-white border-none px-6 py-[10px] rounded cursor-pointer text-sm"
          >
            Continue Shopping
          </button>
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <>
          {/* Cart table */}
          <section className="py-5">
            <div className="max-w-[96%] mx-auto px-[15px]">
              <div className="overflow-x-auto shadow-[0_2px_10px_rgba(0,0,0,0.08)]">
                <table className="w-full border-collapse bg-white">
                  <thead>
                    <tr>
                      <th className={thBase}>Product Descriptions</th>
                      <th className={thBase}>
                        <div className="flex items-center justify-center gap-1">
                          <span title="Rates/Prices are excluding taxes" className="cursor-help text-[11px] border border-[#aaa] rounded-full w-[14px] h-[14px] leading-[14px] text-center inline-block">i</span>
                          Roll Rate
                        </div>
                      </th>
                      <th className={thBase}>
                        <div className="flex items-center justify-center gap-1">
                          <span title="Rates/Prices are excluding taxes" className="cursor-help text-[11px] border border-[#aaa] rounded-full w-[14px] h-[14px] leading-[14px] text-center inline-block">i</span>
                          Cut Rate
                        </div>
                      </th>
                      <th className={thBase}>Ordered Length</th>
                      <th className={thBase}>Status</th>
                      <th className={thBase}>Price</th>
                      <th className={thBase}>Discount</th>
                      <th className={thBase}>GST %</th>
                      <th className={thBase}>GST</th>
                      <th className={thBase}>Final Amount</th>
                      <th className={thBase}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const c = calcItem(effectiveItem(item), cutDiscount, rollDiscount, globalGst);
                      const inStock = true;
                      return (
                        <tr key={item.id} className="border-b border-[#f0f0f0]">
                          <td className={tdBase}>
                            Pattern: {item.pattern}, Color: {item.color}
                          </td>
                          <td className={`${tdBase} text-right`}>
                            ₹{' '}
                            <span className={c.isRoll ? 'text-vaya-green font-bold underline' : ''}>
                              {rupeeFormat(c.rollPrice)}
                            </span>
                          </td>
                          <td className={`${tdBase} text-right`}>
                            ₹{' '}
                            <span className={!c.isRoll ? 'text-vaya-green font-bold underline' : ''}>
                              {rupeeFormat(c.cutPrice)}
                            </span>
                          </td>
                          <td className={`${tdBase} relative`}>
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={getLength(item)}
                                onChange={e => handleLengthChange(item.id, e.target.value)}
                                onBlur={e => handleLengthBlur(item.id, e.target.value)}
                                className="w-[80px] border border-[#ccc] rounded-[3px] px-[6px] py-1 text-[13px] outline-none"
                              />
                              <button
                                onClick={() => setPopupItemId(popupItemId === item.id ? null : item.id)}
                                className="bg-transparent border-none cursor-pointer text-[#555] p-[2px] flex items-center"
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
                          <td className={`${tdBase} text-center`}>
                            <span className={`text-[12px] ${inStock ? 'text-[#28a745]' : 'text-[#dc3545]'}`}>
                              {inStock ? 'In Stock' : 'No Stock - Delivery date TBD'}
                            </span>
                          </td>
                          <td className={`${tdBase} text-right`}>₹ {rupeeFormat(c.price)}</td>
                          <td className={`${tdBase} text-right`}>₹ {rupeeFormat(c.itemDiscount)}</td>
                          <td className={`${tdBase} text-center`}>{c.gstPct}%</td>
                          <td className={`${tdBase} text-right`}>₹ {rupeeFormat(c.gstAmount)}</td>
                          <td className={`${tdBase} text-right font-medium`}>₹ {rupeeFormat(c.finalAmount)}</td>
                          <td className={`${tdBase} text-center`}>
                            <button
                              onClick={() => deleteItem.mutate(item.id)}
                              className="bg-transparent border-none cursor-pointer text-[#dc3545] p-1"
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
                    <tr className="bg-[#f9f9f9] font-medium">
                      <td colSpan={5} className={`${tdBase} text-right font-semibold`}>Total</td>
                      <td className={`${tdBase} text-right`}>₹ {rupeeFormat(totalPrice)}</td>
                      <td className={`${tdBase} text-right`}>₹ {rupeeFormat(totalDiscount)}</td>
                      <td colSpan={2} className={`${tdBase} text-right`}>₹ {rupeeFormat(totalGst)}</td>
                      <td className={`${tdBase} text-right`}>₹ {rupeeFormat(grandTotal)}</td>
                      <td className={tdBase}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Summary + Order Form */}
          <section className="py-[10px] pb-10">
            <div className="max-w-[96%] mx-auto px-[15px]">
              <div className="flex justify-end">
                <div className="w-full max-w-[720px]">
                  {/* Totals */}
                  <div className="mb-5">
                    {[
                      ['Total:', totalPrice],
                      ['Discount:', totalDiscount],
                      ['GST/Tax :', totalGst],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-end items-center gap-6 py-1 border-b border-[#eee]">
                        <span className="text-sm text-[#555] min-w-[100px] text-right">{label}</span>
                        <span className="text-sm text-[#333] min-w-[110px] text-right">₹&nbsp;&nbsp;{rupeeFormat(val)}</span>
                      </div>
                    ))}
                    <div className="flex justify-end items-center gap-6 py-2">
                      <span className="text-[16px] font-bold text-[#333] min-w-[100px] text-right">Total Amount:</span>
                      <span className="text-[18px] font-bold text-[#333] min-w-[110px] text-right">₹&nbsp;&nbsp;{rupeeFormat(grandTotal)}</span>
                    </div>
                  </div>

                  {/* Order form */}
                  <div className="bg-vaya-light rounded p-6 pb-5">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-4">
                      <div>
                        <label className={labelCls}>Shipping address</label>
                        <select value={shippingAddressId} onChange={e => setShippingAddressId(e.target.value)} className={inputCls}>
                          {shippingAddresses.length === 0 && <option value="">No addresses found</option>}
                          {shippingAddresses.map(a => (
                            <option key={a.id} value={String(a.id)}>
                              {[a.line1, a.pincode, a.city, a.state].filter(Boolean).join(', ')}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className={labelCls}>Billing Address</label>
                        <input
                          readOnly
                          value={billingAddress ? [billingAddress.line1, billingAddress.pincode, billingAddress.city, billingAddress.state].filter(Boolean).join(', ') : ''}
                          className={`${inputCls} text-[#555] cursor-default`}
                          placeholder="No billing address found"
                        />
                      </div>

                      <div>
                        <label className={labelCls}>Shipment Mode</label>
                        <select value={shipmentMode} onChange={e => setShipmentMode(e.target.value)} className={inputCls} required>
                          {shippingModes.length === 0 && <option value="">Loading...</option>}
                          {shippingModes.map((m, i) => (
                            <option key={i} value={m['Shipping Mode']}>{m['Shipping Mode']}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className={labelCls}>PO Number (Optional)</label>
                        <input
                          type="text"
                          value={poNumber}
                          onChange={e => setPoNumber(e.target.value)}
                          className={inputCls}
                          placeholder="PO No./Reference No./Name"
                          autoComplete="off"
                        />
                      </div>

                      <div>
                        <label className={labelCls}>Select reserve / delivery date</label>
                        <input
                          type="date"
                          value={orderDate}
                          onChange={e => setOrderDate(e.target.value)}
                          min={today}
                          max={maxDate}
                          className={inputCls}
                          required
                        />
                      </div>

                      <div>
                        <label className={`${labelCls} flex items-center gap-[6px] cursor-pointer`}>
                          <input
                            type="checkbox"
                            checked={rememberPassword}
                            onChange={e => {
                              setRememberPassword(e.target.checked);
                              handleRememberPassword(authPassword, e.target.checked);
                            }}
                            className="cursor-pointer"
                          />
                          Remember Password
                        </label>
                        <input
                          type="password"
                          value={authPassword}
                          onChange={e => setAuthPassword(e.target.value)}
                          onBlur={() => handleRememberPassword(authPassword, rememberPassword)}
                          className={inputCls}
                          placeholder="Enter Authorization Password"
                          autoComplete="new-password"
                          required
                        />
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center justify-center gap-6 mt-2">
                      <button
                        type="button"
                        onClick={() => handleSubmit('Reserved')}
                        disabled={submitting}
                        className={`bg-white text-[#333] border-2 border-[#333] px-8 py-[10px] text-sm font-semibold rounded-[2px] tracking-[0.5px] ${submitting ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                      >
                        Reserve Stock
                      </button>
                      <span className="text-[#888] text-[13px]">OR</span>
                      <button
                        type="button"
                        onClick={() => handleSubmit('Ordered')}
                        disabled={submitting}
                        className={`bg-white text-[#333] border-2 border-[#333] px-8 py-[10px] text-sm font-semibold rounded-[2px] tracking-[0.5px] ${submitting ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                      >
                        Place Order
                      </button>
                    </div>

                    {submitting && (
                      <p className="text-center mt-3 text-sm text-[#555]">
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
