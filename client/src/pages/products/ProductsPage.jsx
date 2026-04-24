import { useState, useEffect, useRef, useMemo } from 'react';
import { useLoadProducts, useAddToCart, useEditCartItem, useCart } from '@/hooks/useProducts';

const thBase = 'bg-vaya-black text-white px-[10px] py-[10px] text-left border border-[#333] font-normal whitespace-nowrap text-sm select-none';
const tdBase = 'px-[10px] py-[6px] border border-[#dee2e6] align-middle text-sm text-[#333]';

function RollModal({ product, onClose }) {
  if (!product) return null;
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.4)]" />
      <div
        className="relative bg-white rounded-[4px] p-5 min-w-[320px] max-w-[420px] shadow-[0_4px_24px_rgba(0,0,0,0.18)]"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-[10px] right-[14px] bg-transparent border-none text-[20px] cursor-pointer text-[#555] leading-none"
        >
          ×
        </button>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="text-[13px] text-[#555] font-medium">Unique Roll Number</div>
          <div className="text-[13px] text-[#555] font-medium">Length</div>
        </div>
        <div className="max-h-[320px] overflow-y-auto">
          {product.Rolls.map((r, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 mb-2">
              <input
                readOnly
                value={r.PcSINo || ''}
                className="border border-[#C8C8C8] rounded-[3px] px-[10px] py-[6px] text-[13px] bg-[#f9f9f9] outline-none w-full"
              />
              <input
                readOnly
                value={r.Length || ''}
                className="border border-[#C8C8C8] rounded-[3px] px-[10px] py-[6px] text-[13px] bg-[#f9f9f9] outline-none w-full"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PanelLengthPopup({ onClose, value, onChange }) {
  const popupRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={popupRef}
      className="absolute top-full right-0 z-[100] w-[300px] bg-white shadow-[0px_3px_40px_rgba(0,0,0,0.32)] rounded-[10px] p-5 mt-[10px]"
    >
      <button
        onClick={onClose}
        className="absolute top-[10px] right-[14px] bg-transparent border-none text-[18px] cursor-pointer text-[#555] leading-none"
      >
        ×
      </button>
      <div className="text-center font-semibold text-[15px] mb-[6px]">
        Specify Panel Lengths
      </div>
      <div className="text-center italic text-sm mb-[10px] flex items-center justify-center gap-[6px]">
        Optional Field
        <span
          title="Please provide info to help us to send adequate roll lengths"
          className="inline-flex items-center justify-center border border-black rounded-full w-[17px] h-[17px] text-[10px] cursor-default shrink-0"
        >
          i
        </span>
      </div>
      <textarea
        rows={4}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-[#C8C8C8] rounded-[4px] p-[6px] text-[13px] resize-y outline-none"
      />
    </div>
  );
}

export default function ProductsPage() {
  const [filters, setFilters] = useState({ pattern: '', color: '', page: 1, perPage: 10 });
  const [draftPattern, setDraftPattern] = useState('');
  const [draftColor, setDraftColor] = useState('');
  const [orderLengths, setOrderLengths] = useState({});
  const [panelNotes, setPanelNotes] = useState({});
  const [panelPopupKey, setPanelPopupKey] = useState(null);
  const [rollModal, setRollModal] = useState(null);
  const [sort, setSort] = useState({ key: null, dir: 'asc' });

  const { data, isLoading, isError } = useLoadProducts(filters);
  const addToCart = useAddToCart();
  const editCartItem = useEditCartItem();
  const { data: cartData } = useCart();
  const debounceTimers = useRef({});

  const cartItemByKey = useMemo(() => {
    const map = {};
    (cartData?.items ?? []).forEach(item => {
      map[`${item.pattern}||${item.color}`] = item;
    });
    return map;
  }, [cartData]);

  useEffect(() => {
    const items = cartData?.items ?? [];
    if (!items.length) return;
    setOrderLengths(prev => {
      const merged = { ...prev };
      items.forEach(item => {
        const key = `${item.pattern}||${item.color}`;
        if (merged[key] === undefined) merged[key] = String(item.quantity);
      });
      return merged;
    });
  }, [cartData]);

  const products = data?.data?.items ?? [];
  const total = data?.data?.total ?? 0;
  const totalPages = Math.ceil(total / filters.perPage);

  const handleSort = (key) => {
    setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
  };

  const sortedProducts = useMemo(() => {
    if (!sort.key) return products;
    return [...products].sort((a, b) => {
      let av, bv;
      if (sort.key === 'stock')         { av = a.TotalLength > 0 ? 1 : 0; bv = b.TotalLength > 0 ? 1 : 0; }
      else if (sort.key === 'pattern')  { av = (a.Pattern || '').toLowerCase(); bv = (b.Pattern || '').toLowerCase(); }
      else if (sort.key === 'color')    { av = (a.Color || '').toLowerCase(); bv = (b.Color || '').toLowerCase(); }
      else if (sort.key === 'qty')      { av = a.TotalLength; bv = b.TotalLength; }
      else if (sort.key === 'rolls')    { av = a.NumberOfRolls; bv = b.NumberOfRolls; }
      else return 0;
      if (av < bv) return sort.dir === 'asc' ? -1 : 1;
      if (av > bv) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [products, sort]);

  const handleSearch = () => {
    setFilters(f => ({ ...f, pattern: draftPattern, color: draftColor, page: 1 }));
  };

  const handleAddToCart = (p) => {
    const key = `${p.Pattern}||${p.Color}`;
    const length = parseFloat(orderLengths[key] || 0);
    if (!length || length < 1) {
      alert('Please enter an order length of at least 1 m');
      return;
    }
    if (length > p.TotalLength) {
      alert(`Max available length is ${p.TotalLength.toFixed(2)} m`);
      return;
    }
    addToCart.mutate({
      productId: p.Rolls[0]?.PcSINo || key,
      productName: `${p.Pattern} - ${p.Color}`,
      pattern: p.Pattern,
      color: p.Color,
      price: parseFloat(p.RollPrice) || 0,
      rollPrice: parseFloat(p.RollPrice) || 0,
      cutPrice: parseFloat(p.CutPrice) || 0,
      gstPercent: parseFloat(p.GstPercent) || null,
      quantity: length,
      unit: 'm',
      remark: panelNotes[key] || '',
    });
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div className="border-b border-[rgba(112,112,112,0.2)] py-[5px]">
        <div className="max-w-[90%] mx-auto px-[15px]">
          <span className="text-vaya-green text-[28px] leading-[43px]">Stock</span>
        </div>
      </div>

      <section>
        <div className="max-w-[90%] mx-auto px-[15px] pb-[25px]">

          {/* Search bar + Show entries */}
          <div className="flex items-center justify-between pt-[15px] pb-[10px] flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search Pattern"
                value={draftPattern}
                className="border border-[#C8C8C8] rounded-[3px] px-2 py-[7px] text-sm bg-white outline-none w-[200px] h-[36px]"
                onChange={e => setDraftPattern(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <input
                type="text"
                placeholder="Search Color"
                value={draftColor}
                className="border border-[#C8C8C8] rounded-[3px] px-2 py-[7px] text-sm bg-white outline-none w-[200px] h-[36px] ml-[5px]"
                onChange={e => setDraftColor(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                title="Search"
                className="w-[40px] h-[36px] border border-transparent rounded-[4px] bg-vaya-green cursor-pointer shrink-0 ml-[5px] flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#fff" viewBox="0 0 16 16">
                  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-[6px] text-sm text-[#555]">
              Show
              <select
                value={filters.perPage}
                onChange={e => setFilters(f => ({ ...f, perPage: Number(e.target.value), page: 1 }))}
                className="border border-[#C8C8C8] rounded-[3px] px-[6px] py-1 text-sm cursor-pointer outline-none"
              >
                {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              entries
            </div>
          </div>

          {isLoading && <p className="text-[#999] text-sm py-5">Loading products...</p>}
          {isError && <p className="text-[#e3342f] text-sm py-5">Failed to load products.</p>}

          {!isLoading && (
            <>
              <div className="overflow-x-auto shadow-[0px_2px_15px_rgba(0,0,0,0.22)]">
                <table className="w-full border-collapse bg-white text-sm">
                  <thead>
                    <tr>
                      {[
                        { label: 'Stock',              key: 'stock'   },
                        { label: 'Pattern',            key: 'pattern' },
                        { label: 'Color',              key: 'color'   },
                        { label: 'Quantity Available', key: 'qty'     },
                        { label: 'Number of Rolls',    key: 'rolls'   },
                        { label: 'Order Length(m)',    key: null      },
                        { label: '',                   key: null      },
                      ].map(({ label, key }) => (
                        <th
                          key={label}
                          className={`${thBase} ${key ? 'cursor-pointer' : 'cursor-default'}`}
                          onClick={() => key && handleSort(key)}
                        >
                          {label}
                          {key && (
                            <span className={`ml-[6px] text-[11px] ${sort.key === key ? 'opacity-100' : 'opacity-30'}`}>
                              {sort.key === key && sort.dir === 'desc' ? '▼' : '▲'}
                            </span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center text-[#999] p-6 border border-[#dee2e6]">No products found</td>
                      </tr>
                    )}
                    {sortedProducts.map((p) => {
                      const key = `${p.Pattern}||${p.Color}`;
                      const inStock = p.TotalLength > 0;
                      return (
                        <tr key={key} className="hover:bg-[#f8f9fa]">
                          <td className={`${tdBase} text-center`}>
                            <span
                              className={`inline-block w-3 h-3 rounded-full ${inStock ? 'bg-[#28a745]' : 'bg-[#dc3545]'}`}
                              title={inStock ? 'In Stock' : 'Out of Stock'}
                            />
                          </td>
                          <td className={`${tdBase} font-normal`}>{p.Pattern}</td>
                          <td className={tdBase}>{p.Color}</td>
                          <td className={`${tdBase} text-center`}>{p.TotalLength.toFixed(2)}</td>
                          <td className={`${tdBase} text-center`}>
                            {p.Rolls.length > 0 ? (
                              <button
                                onClick={() => setRollModal(p)}
                                className="bg-transparent border-none text-[#007bff] cursor-pointer text-sm p-0 underline"
                              >
                                {p.NumberOfRolls}
                              </button>
                            ) : p.NumberOfRolls}
                          </td>
                          <td className={`${tdBase} relative`}>
                            <div className="inline-flex items-center relative border-b border-black min-w-[115px]">
                              <input
                                type="text"
                                inputMode="decimal"
                                placeholder="Enter Length(m)"
                                className="border-none bg-transparent py-1 px-[2px] w-[100px] text-[13px] outline-none text-[#555] text-center"
                                value={orderLengths[key] || ''}
                                onChange={e => {
                                  const v = e.target.value;
                                  if (v === '' || /^\d*\.?\d*$/.test(v)) {
                                    setOrderLengths(prev => ({ ...prev, [key]: v }));
                                    const cartItem = cartItemByKey[key];
                                    if (cartItem) {
                                      clearTimeout(debounceTimers.current[key]);
                                      debounceTimers.current[key] = setTimeout(() => {
                                        const num = parseFloat(v);
                                        if (!isNaN(num) && num > 0) {
                                          editCartItem.mutate({ id: cartItem.id, quantity: num });
                                        }
                                      }, 800);
                                    }
                                  }
                                }}
                                onBlur={() => {
                                  const v = parseFloat(orderLengths[key]);
                                  if (!isNaN(v) && v < 1) {
                                    setOrderLengths(prev => ({ ...prev, [key]: '1' }));
                                    const cartItem = cartItemByKey[key];
                                    if (cartItem) editCartItem.mutate({ id: cartItem.id, quantity: 1 });
                                  }
                                }}
                              />
                              <button
                                onClick={() => setPanelPopupKey(prev => prev === key ? null : key)}
                                title="Specify Panel Lengths"
                                disabled={!orderLengths[key]}
                                className={`bg-transparent border-none px-[2px] text-[#555] text-[20px] leading-none shrink-0 ${orderLengths[key] ? 'cursor-pointer opacity-100' : 'cursor-not-allowed opacity-25'}`}
                              >
                                ▾
                              </button>
                              {panelPopupKey === key && (
                                <PanelLengthPopup
                                  value={panelNotes[key] || ''}
                                  onChange={v => setPanelNotes(prev => ({ ...prev, [key]: v }))}
                                  onClose={() => setPanelPopupKey(null)}
                                />
                              )}
                            </div>
                          </td>
                          <td className={`${tdBase} text-center`}>
                            {cartItemByKey[key] ? (
                              <span className="text-[13px] text-vaya-primary font-medium">✓ In Cart</span>
                            ) : (
                              <button
                                onClick={() => handleAddToCart(p)}
                                disabled={addToCart.isPending || !inStock}
                                className={`bg-white px-[14px] py-[5px] rounded-[3px] text-[13px] whitespace-nowrap border ${inStock ? 'text-vaya-primary border-vaya-primary cursor-pointer' : 'text-[#aaa] border-[#ccc] cursor-not-allowed'}`}
                              >
                                Add To Cart
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex gap-1 mt-4 items-center text-sm text-[#555] flex-wrap">
                <button
                  disabled={filters.page <= 1}
                  onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                  className={`px-[10px] py-1 border border-[#dee2e6] rounded-[3px] bg-white text-[#555] ${filters.page <= 1 ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  ‹
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pg = i + 1;
                  return (
                    <button
                      key={pg}
                      onClick={() => setFilters(f => ({ ...f, page: pg }))}
                      className={`px-[10px] py-1 border border-[#dee2e6] rounded-[3px] cursor-pointer ${filters.page === pg ? 'bg-vaya-primary text-white' : 'bg-white text-[#555]'}`}
                    >
                      {pg}
                    </button>
                  );
                })}
                {totalPages > 5 && <span className="px-[6px] py-1">…</span>}
                {totalPages > 5 && (
                  <button
                    onClick={() => setFilters(f => ({ ...f, page: totalPages }))}
                    className={`px-[10px] py-1 border border-[#dee2e6] rounded-[3px] cursor-pointer ${filters.page === totalPages ? 'bg-vaya-primary text-white' : 'bg-white text-[#555]'}`}
                  >
                    {totalPages}
                  </button>
                )}
                <button
                  disabled={filters.page >= totalPages}
                  onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                  className={`px-[10px] py-1 border border-[#dee2e6] rounded-[3px] bg-white text-[#555] ${filters.page >= totalPages ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  ›
                </button>
                <span className="ml-2 text-[#888]">{total} groups</span>
              </div>
            </>
          )}
        </div>
      </section>

      <RollModal product={rollModal} onClose={() => setRollModal(null)} />
    </div>
  );
}
