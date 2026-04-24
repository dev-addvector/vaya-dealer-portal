import { useState, useEffect, useRef, useMemo } from 'react';
import { useLoadProducts, useAddToCart, useEditCartItem, useCart } from '@/hooks/useProducts';

const containerStyle = { maxWidth: '90%', margin: '0 auto', padding: '0 15px' };

const thStyle = {
  backgroundColor: '#111111',
  color: '#ffffff',
  padding: '10px 10px',
  textAlign: 'left',
  border: '1px solid #333',
  fontWeight: 400,
  whiteSpace: 'nowrap',
  fontSize: '14px',
};

const tdStyle = {
  padding: '6px 10px',
  border: '1px solid #dee2e6',
  verticalAlign: 'middle',
  fontSize: '14px',
  color: '#333',
};

const searchInputStyle = {
  border: '1px solid #C8C8C8',
  borderRadius: '3px',
  padding: '7px 8px',
  fontSize: '14px',
  background: '#fff',
  outline: 'none',
  width: '200px',
  height: '36px',
  boxSizing: 'border-box',
};

function RollModal({ product, onClose }) {
  if (!product) return null;
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} />
      <div
        style={{ position: 'relative', backgroundColor: '#fff', borderRadius: '4px', padding: '20px', minWidth: '320px', maxWidth: '420px', boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '10px', right: '14px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#555', lineHeight: 1 }}
        >
          ×
        </button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
          <div style={{ fontSize: '13px', color: '#555', fontWeight: 500 }}>Unique Roll Number</div>
          <div style={{ fontSize: '13px', color: '#555', fontWeight: 500 }}>Length</div>
        </div>
        <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
          {product.Rolls.map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <input
                readOnly
                value={r.PcSINo || ''}
                style={{ border: '1px solid #C8C8C8', borderRadius: '3px', padding: '6px 10px', fontSize: '13px', backgroundColor: '#f9f9f9', outline: 'none', width: '100%' }}
              />
              <input
                readOnly
                value={r.Length || ''}
                style={{ border: '1px solid #C8C8C8', borderRadius: '3px', padding: '6px 10px', fontSize: '13px', backgroundColor: '#f9f9f9', outline: 'none', width: '100%' }}
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
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        zIndex: 100,
        width: '300px',
        backgroundColor: '#fff',
        boxShadow: '0px 3px 40px rgba(0,0,0,0.32)',
        borderRadius: '10px',
        padding: '20px',
        marginTop: '10px',
      }}
    >
      <button
        onClick={onClose}
        style={{ position: 'absolute', top: '10px', right: '14px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#555', lineHeight: 1 }}
      >
        ×
      </button>
      <div style={{ textAlign: 'center', fontWeight: 600, fontSize: '15px', marginBottom: '6px' }}>
        Specify Panel Lengths
      </div>
      <div style={{ textAlign: 'center', fontStyle: 'italic', fontSize: '14px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
        Optional Field
        <span
          title="Please provide info to help us to send adequate roll lengths"
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #000', borderRadius: '50%', width: '17px', height: '17px', fontSize: '10px', cursor: 'default', flexShrink: 0 }}
        >
          i
        </span>
      </div>
      <textarea
        rows={4}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width: '100%', border: '1px solid #C8C8C8', borderRadius: '4px', padding: '6px', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }}
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
      <div style={{ borderBottom: '1px solid rgba(112,112,112,0.2)', padding: '5px 0' }}>
        <div style={containerStyle}>
          <span style={{ color: '#AEC148', fontSize: '28px', lineHeight: '43px' }}>Stock</span>
        </div>
      </div>

      <section>
        <div style={{ ...containerStyle, paddingBottom: '25px' }}>

          {/* Search bar + Show entries */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '15px', paddingBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="text"
                placeholder="Search Pattern"
                value={draftPattern}
                style={searchInputStyle}
                onChange={e => setDraftPattern(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <input
                type="text"
                placeholder="Search Color"
                value={draftColor}
                style={{ ...searchInputStyle, marginLeft: '5px' }}
                onChange={e => setDraftColor(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                title="Search"
                style={{
                  width: '40px',
                  height: '36px',
                  border: '1px solid transparent',
                  borderRadius: '4px',
                  backgroundColor: '#aec148',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23fff' viewBox='0 0 16 16'%3E%3Cpath d='M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  marginLeft: '5px',
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#555' }}>
              Show
              <select
                value={filters.perPage}
                onChange={e => setFilters(f => ({ ...f, perPage: Number(e.target.value), page: 1 }))}
                style={{ border: '1px solid #C8C8C8', borderRadius: '3px', padding: '4px 6px', fontSize: '14px', cursor: 'pointer', outline: 'none' }}
              >
                {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              entries
            </div>
          </div>

          {isLoading && <p style={{ color: '#999', fontSize: '14px', padding: '20px 0' }}>Loading products...</p>}
          {isError && <p style={{ color: '#e3342f', fontSize: '14px', padding: '20px 0' }}>Failed to load products.</p>}

          {!isLoading && (
            <>
              <div style={{ overflowX: 'auto', boxShadow: '0px 2px 15px #00000038' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', fontSize: '14px' }}>
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
                          style={{ ...thStyle, cursor: key ? 'pointer' : 'default', userSelect: 'none' }}
                          onClick={() => key && handleSort(key)}
                        >
                          {label}
                          {key && (
                            <span style={{ marginLeft: '6px', opacity: sort.key === key ? 1 : 0.3, fontSize: '11px' }}>
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
                        <td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: '#999', padding: '24px' }}>No products found</td>
                      </tr>
                    )}
                    {sortedProducts.map((p) => {
                      const key = `${p.Pattern}||${p.Color}`;
                      const inStock = p.TotalLength > 0;
                      return (
                        <tr
                          key={key}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                        >
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            <span
                              style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: inStock ? '#28a745' : '#dc3545' }}
                              title={inStock ? 'In Stock' : 'Out of Stock'}
                            />
                          </td>
                          <td style={{ ...tdStyle, fontWeight: 400 }}>{p.Pattern}</td>
                          <td style={tdStyle}>{p.Color}</td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>{p.TotalLength.toFixed(2)}</td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            {p.Rolls.length > 0 ? (
                              <button
                                onClick={() => setRollModal(p)}
                                style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: '14px', padding: 0, textDecoration: 'underline' }}
                              >
                                {p.NumberOfRolls}
                              </button>
                            ) : p.NumberOfRolls}
                          </td>
                          <td style={{ ...tdStyle, position: 'relative' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', position: 'relative', borderBottom: '1px solid #000', minWidth: '115px' }}>
                              <input
                                type="text"
                                inputMode="decimal"
                                placeholder="Enter Length(m)"
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  padding: '4px 2px',
                                  width: '100px',
                                  fontSize: '13px',
                                  outline: 'none',
                                  color: '#555',
                                  textAlign: 'center',
                                }}
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
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: orderLengths[key] ? 'pointer' : 'not-allowed',
                                  padding: '0 2px',
                                  color: '#555',
                                  fontSize: '20px',
                                  lineHeight: 1,
                                  flexShrink: 0,
                                  opacity: orderLengths[key] ? 1 : 0.25,
                                }}
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
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            {cartItemByKey[key] ? (
                              <span style={{ fontSize: '13px', color: '#807A52', fontWeight: 500 }}>✓ In Cart</span>
                            ) : (
                              <button
                                onClick={() => handleAddToCart(p)}
                                disabled={addToCart.isPending || !inStock}
                                style={{
                                  backgroundColor: '#fff',
                                  color: inStock ? '#807A52' : '#aaa',
                                  border: `1px solid ${inStock ? '#807A52' : '#ccc'}`,
                                  padding: '5px 14px',
                                  borderRadius: '3px',
                                  fontSize: '13px',
                                  cursor: inStock ? 'pointer' : 'not-allowed',
                                  whiteSpace: 'nowrap',
                                }}
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
              <div style={{ display: 'flex', gap: '4px', marginTop: '16px', alignItems: 'center', fontSize: '14px', color: '#555', flexWrap: 'wrap' }}>
                <button
                  disabled={filters.page <= 1}
                  onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                  style={{ padding: '4px 10px', border: '1px solid #dee2e6', borderRadius: '3px', background: '#fff', cursor: filters.page <= 1 ? 'not-allowed' : 'pointer', color: '#555' }}
                >
                  ‹
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pg = i + 1;
                  return (
                    <button key={pg} onClick={() => setFilters(f => ({ ...f, page: pg }))}
                      style={{ padding: '4px 10px', border: '1px solid #dee2e6', borderRadius: '3px', background: filters.page === pg ? '#807A52' : '#fff', color: filters.page === pg ? '#fff' : '#555', cursor: 'pointer' }}>
                      {pg}
                    </button>
                  );
                })}
                {totalPages > 5 && <span style={{ padding: '4px 6px' }}>…</span>}
                {totalPages > 5 && (
                  <button onClick={() => setFilters(f => ({ ...f, page: totalPages }))}
                    style={{ padding: '4px 10px', border: '1px solid #dee2e6', borderRadius: '3px', background: filters.page === totalPages ? '#807A52' : '#fff', color: filters.page === totalPages ? '#fff' : '#555', cursor: 'pointer' }}>
                    {totalPages}
                  </button>
                )}
                <button
                  disabled={filters.page >= totalPages}
                  onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                  style={{ padding: '4px 10px', border: '1px solid #dee2e6', borderRadius: '3px', background: '#fff', cursor: filters.page >= totalPages ? 'not-allowed' : 'pointer', color: '#555' }}
                >
                  ›
                </button>
                <span style={{ marginLeft: '8px', color: '#888' }}>{total} groups</span>
              </div>
            </>
          )}
        </div>
      </section>

      <RollModal product={rollModal} onClose={() => setRollModal(null)} />
    </div>
  );
}
