import { useState, useEffect, useRef, useMemo } from 'react';
import { useLoadProducts, useAddToCart, useEditCartItem, useCart, useProductFilters } from '@/hooks/useProducts';

const thBase = 'bg-vaya-black text-white px-[10px] py-[10px] text-left border border-[#333] font-normal whitespace-nowrap text-sm select-none';
const tdBase = 'px-[10px] py-[6px] border border-[#dee2e6] align-middle text-sm text-[#333]';

function RollModal({ product, onClose }) {
  if (!product) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.4)]" />
      <div className="relative bg-white rounded-[4px] p-5 min-w-[320px] max-w-[420px] shadow-[0_4px_24px_rgba(0,0,0,0.18)]" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-[10px] right-[14px] bg-transparent border-none text-[20px] cursor-pointer text-[#555] leading-none">×</button>
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

function PanelLengthPopup({ onClose, value, onChange }) {
  const popupRef = useRef(null);
  const textareaRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    if (textareaRef.current) {
      setTimeout(() => textareaRef.current.focus(), 0);
    }
  }, []);

  const handlePopupClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div ref={popupRef} onClick={handlePopupClick} className="absolute top-full right-0 z-[1000] w-[280px] bg-white shadow-[0px_3px_40px_rgba(0,0,0,0.32)] rounded-[10px] p-4 mt-[10px] md:w-[300px] md:p-5">
      <button onClick={onClose} className="absolute top-[10px] right-[14px] bg-transparent border-none text-[18px] cursor-pointer text-[#555] leading-none">×</button>
      <div className="text-center font-semibold text-[15px] mb-[6px]">Specify Panel Lengths</div>
      <div className="text-center italic text-sm mb-[10px] flex items-center justify-center gap-[6px]">
        Optional Field
        <span title="Please provide info to help us to send adequate roll lengths" className="inline-flex items-center justify-center border border-black rounded-full w-[17px] h-[17px] text-[10px] cursor-default shrink-0">i</span>
      </div>
      <textarea ref={textareaRef} rows={4} value={value} onChange={e => onChange(e.target.value)} onClick={handlePopupClick} onMouseDown={handlePopupClick} className="w-full border border-[#C8C8C8] rounded-[4px] p-[6px] text-[13px] resize-y focus:outline-none focus:border-[#007bff] focus:ring-1 focus:ring-[#007bff]" />
    </div>
  );
}

function ProductCard({ p, orderLengths, setOrderLengths, panelNotes, setPanelNotes, panelPopupKey, setPanelPopupKey, cartItemByKey, addToCart, editCartItem, debounceTimers, setRollModal, handleAddToCart }) {
  const key = `${p.Pattern}||${p.Color}`;
  const inStock = p.TotalLength > 0;
  const inCart = !!cartItemByKey[key];

  return (
    <div className="border border-[#ddd] rounded-[4px] shadow-[0_1px_4px_rgba(0,0,0,0.08)] bg-white">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#f5f5f5] border-b border-[#e0e0e0] rounded-t-[4px]">
        <span className="text-[18px] font-normal text-[#222]">{p.Pattern}</span>
        <span className={`w-3 h-3 rounded-full shrink-0 ${inStock ? 'bg-[#28a745]' : 'bg-[#dc3545]'}`} title={inStock ? 'In Stock' : 'Out of Stock'} />
      </div>

      {/* Card rows */}
      <div className="divide-y divide-[#ebebeb]">
        <div className="flex items-center justify-between px-4 py-[10px]">
          <span className="text-[13px] text-[#555]">Color :</span>
          <span className="text-[13px] text-[#333]">{p.Color}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-[10px]">
          <span className="text-[13px] text-[#555]">Quantity Available :</span>
          <span className="text-[13px] text-[#333]">{p.TotalLength.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-[10px]">
          <span className="text-[13px] text-[#555]">Number of Rolls :</span>
          {p.Rolls.length > 0 ? (
            <button onClick={() => setRollModal(p)} className="bg-transparent border-none text-[#007bff] cursor-pointer text-[13px] p-0 underline">
              {p.NumberOfRolls}
            </button>
          ) : (
            <span className="text-[13px] text-[#333]">{p.NumberOfRolls}</span>
          )}
        </div>
        <div className="flex items-center justify-between px-4 py-[10px] relative">
          <span className="text-[13px] text-[#555]">Order Length(m) :</span>
          <div className="inline-flex items-center relative border-b border-black">
            <input
              type="text"
              inputMode="decimal"
              placeholder="Enter Length"
              className="border-none bg-transparent py-1 px-[2px] w-[90px] text-[13px] text-[#555] text-right focus:bg-white focus:border focus:border-[#007bff] focus:shadow-sm rounded"
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
                      if (!isNaN(num) && num > 0) editCartItem.mutate({ id: cartItem.id, quantity: num });
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
              className={`bg-transparent border-none px-[2px] text-[#555] text-[18px] leading-none shrink-0 ${orderLengths[key] ? 'cursor-pointer opacity-100' : 'cursor-not-allowed opacity-25'}`}
            >
              ▾
            </button>
            {panelPopupKey === key && (
              <PanelLengthPopup
                value={panelNotes[key] || ''}
                onChange={v => {
                  setPanelNotes(prev => ({ ...prev, [key]: v }));
                  const cartItem = cartItemByKey[key];
                  if (cartItem) {
                    clearTimeout(debounceTimers.current[`panel_${key}`]);
                    debounceTimers.current[`panel_${key}`] = setTimeout(() => {
                      editCartItem.mutate({ id: cartItem.id, remark: v });
                    }, 800);
                  }
                }}
                onClose={() => setPanelPopupKey(null)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Add to cart footer */}
      <div className="border-t border-[#e0e0e0] rounded-b-[4px] overflow-hidden">
        {inCart ? (
          <div className="py-3 text-center text-[13px] text-vaya-primary font-medium">✓ In Cart</div>
        ) : (
          <button
            onClick={() => handleAddToCart(p)}
            disabled={addToCart.isPending || !inStock}
            className={`w-full py-3 border-none text-[14px] tracking-wide ${inStock ? 'bg-vaya-light text-[#555] cursor-pointer' : 'bg-[#f0f0f0] text-[#aaa] cursor-not-allowed'}`}
          >
            Add to cart
          </button>
        )}
      </div>
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

  // Mobile filter states
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileDraftFilters, setMobileDraftFilters] = useState({ pattern: '', color: '', sortBy: '' });
  const [mobileExpanded, setMobileExpanded] = useState({
    pattern: false,
    color: false,
    sortBy: false,
  });

  const { data, isLoading, isError } = useLoadProducts(filters);
  const { data: filtersData, isLoading: filtersLoading } = useProductFilters();
  const addToCart = useAddToCart();
  const editCartItem = useEditCartItem();
  const { data: cartData } = useCart();
  const debounceTimers = useRef({});

  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timerId => clearTimeout(timerId));
    };
  }, []);

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
    setPanelNotes(prev => {
      const merged = { ...prev };
      items.forEach(item => {
        const key = `${item.pattern}||${item.color}`;
        if (item.remark && merged[key] === undefined) merged[key] = item.remark;
      });
      return merged;
    });
  }, [cartData]);

  const products = data?.data?.items ?? [];
  const total = data?.data?.total ?? 0;
  const totalPages = Math.ceil(total / filters.perPage);

  // Get unique values for filters from API with dependent filtering
  const allPatterns = useMemo(() => filtersData?.data?.patterns ?? [], [filtersData]);
  const allColors = useMemo(() => filtersData?.data?.colors ?? [], [filtersData]);
  const patternColorsMap = useMemo(() => filtersData?.data?.patternColors ?? {}, [filtersData]);
  const colorPatternsMap = useMemo(() => filtersData?.data?.colorPatterns ?? {}, [filtersData]);

  // Filter patterns based on selected color
  const patterns = useMemo(() => {
    if (filters.color && colorPatternsMap[filters.color]) {
      return colorPatternsMap[filters.color];
    }
    return allPatterns;
  }, [allPatterns, filters.color, colorPatternsMap]);

  // Filter colors based on selected pattern
  const colors = useMemo(() => {
    if (filters.pattern && patternColorsMap[filters.pattern]) {
      return patternColorsMap[filters.pattern];
    }
    return allColors;
  }, [allColors, filters.pattern, patternColorsMap]);

  const handleSort = (key) => {
    setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
  };

  const sortedProducts = useMemo(() => {
    if (!sort.key) return products;
    return [...products].sort((a, b) => {
      let av, bv;
      if (sort.key === 'stock')        { av = a.TotalLength > 0 ? 1 : 0; bv = b.TotalLength > 0 ? 1 : 0; }
      else if (sort.key === 'pattern') { av = (a.Pattern || '').toLowerCase(); bv = (b.Pattern || '').toLowerCase(); }
      else if (sort.key === 'color')   { av = (a.Color || '').toLowerCase(); bv = (b.Color || '').toLowerCase(); }
      else if (sort.key === 'qty')     { av = a.TotalLength; bv = b.TotalLength; }
      else if (sort.key === 'rolls')   { av = a.NumberOfRolls; bv = b.NumberOfRolls; }
      else return 0;
      if (av < bv) return sort.dir === 'asc' ? -1 : 1;
      if (av > bv) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [products, sort]);

  const handleSearch = () => {
    setFilters(f => ({ ...f, pattern: draftPattern, color: draftColor, page: 1 }));
  };

  // Mobile filter functions
  const setMobileDraftFilter = (key, val) => { 
    const newFilters = { ...mobileDraftFilters, [key]: val };
    
    // Clear dependent filter when the other one changes
    if (key === 'pattern' && val) {
      // If pattern is selected, clear color if it's not available for this pattern
      if (newFilters.color && !patternColorsMap[val]?.includes(newFilters.color)) {
        newFilters.color = '';
      }
    } else if (key === 'color' && val) {
      // If color is selected, clear pattern if it's not available for this color
      if (newFilters.pattern && !colorPatternsMap[val]?.includes(newFilters.pattern)) {
        newFilters.pattern = '';
      }
    }
    
    setMobileDraftFilters(newFilters); 
  };

  // Mobile dependent filtering
  const mobilePatterns = useMemo(() => {
    if (mobileDraftFilters.color && colorPatternsMap[mobileDraftFilters.color]) {
      return colorPatternsMap[mobileDraftFilters.color];
    }
    return allPatterns;
  }, [allPatterns, mobileDraftFilters.color, colorPatternsMap]);

  const mobileColors = useMemo(() => {
    if (mobileDraftFilters.pattern && patternColorsMap[mobileDraftFilters.pattern]) {
      return patternColorsMap[mobileDraftFilters.pattern];
    }
    return allColors;
  }, [allColors, mobileDraftFilters.pattern, patternColorsMap]);

  const applyMobileFilters = () => {
    const newFilters = { 
      ...filters, 
      pattern: mobileDraftFilters.pattern, 
      color: mobileDraftFilters.color, 
      page: 1 
    };
    
    // Handle sort by
    if (mobileDraftFilters.sortBy) {
      const sortOptions = {
        'stock': { key: 'stock', dir: 'asc' },
        'pattern': { key: 'pattern', dir: 'asc' },
        'color': { key: 'color', dir: 'asc' },
        'qty': { key: 'qty', dir: 'desc' },
        'rolls': { key: 'rolls', dir: 'desc' },
      };
      setSort(sortOptions[mobileDraftFilters.sortBy] || { key: null, dir: 'asc' });
    }
    
    setFilters(newFilters);
    setMobileFiltersOpen(false);
  };

  const clearFilters = () => {
    setFilters({ pattern: '', color: '', page: 1, perPage: 10 });
    setDraftPattern('');
    setDraftColor('');
    setSort({ key: null, dir: 'asc' });
    setMobileDraftFilters({ pattern: '', color: '', sortBy: '' });
  };

  const handleAddToCart = (p) => {
    const key = `${p.Pattern}||${p.Color}`;
    const length = parseFloat(orderLengths[key] || 0);
    if (!length || length < 1) { alert('Please enter an order length of at least 1 m'); return; }
    if (length > p.TotalLength) { alert(`Max available length is ${p.TotalLength.toFixed(2)} m`); return; }
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

  const cardProps = { orderLengths, setOrderLengths, panelNotes, setPanelNotes, panelPopupKey, setPanelPopupKey, cartItemByKey, addToCart, editCartItem, debounceTimers, setRollModal, handleAddToCart };

  const Pagination = () => (
    <div className="flex gap-1 mt-4 items-center text-sm text-[#555] flex-wrap">
      <button disabled={filters.page <= 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))} className={`px-[10px] py-1 border border-[#dee2e6] rounded-[3px] bg-white text-[#555] ${filters.page <= 1 ? 'cursor-not-allowed' : 'cursor-pointer'}`}>‹</button>
      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
        const pg = i + 1;
        return (
          <button key={pg} onClick={() => setFilters(f => ({ ...f, page: pg }))} className={`px-[10px] py-1 border border-[#dee2e6] rounded-[3px] cursor-pointer ${filters.page === pg ? 'bg-vaya-primary text-white' : 'bg-white text-[#555]'}`}>{pg}</button>
        );
      })}
      {totalPages > 5 && <span className="px-[6px] py-1">…</span>}
      {totalPages > 5 && (
        <button onClick={() => setFilters(f => ({ ...f, page: totalPages }))} className={`px-[10px] py-1 border border-[#dee2e6] rounded-[3px] cursor-pointer ${filters.page === totalPages ? 'bg-vaya-primary text-white' : 'bg-white text-[#555]'}`}>{totalPages}</button>
      )}
      <button disabled={filters.page >= totalPages} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))} className={`px-[10px] py-1 border border-[#dee2e6] rounded-[3px] bg-white text-[#555] ${filters.page >= totalPages ? 'cursor-not-allowed' : 'cursor-pointer'}`}>›</button>
      <span className="ml-2 text-[#888]">{total} groups</span>
    </div>
  );

  return (
    <div>
      {/* Breadcrumb */}
      <div className="border-b border-[rgba(112,112,112,0.2)] py-[5px]">
        <div className="max-w-[90%] mx-auto px-[15px]">
          <div className="flex items-center justify-between">
            <span className="text-vaya-green text-[28px] leading-[43px]">Stock</span>
            <button
              type="button"
              onClick={() => { setMobileDraftFilters({ pattern: filters.pattern, color: filters.color, sortBy: '' }); setMobileFiltersOpen(true); }}
              disabled={filtersLoading}
              className={`md:hidden w-[44px] h-[44px] rounded-[6px] flex items-center justify-center ${
                filtersLoading 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-vaya-green text-white cursor-pointer'
              }`}
              aria-label="Open filters"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 5H21L14 13V19L10 21V13L3 5Z" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <section>
        <div className="max-w-[90%] mx-auto px-[15px] pb-[25px]">

          {/* Search bar */}
          <div className="flex items-center justify-between pt-[15px] pb-[10px] flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <input
                type="text"
                placeholder="Search Pattern"
                value={draftPattern}
                className="border border-[#C8C8C8] rounded-[3px] px-2 py-[7px] text-sm bg-white outline-none min-w-0 flex-1 md:w-[200px] md:flex-none h-[36px]"
                onChange={e => setDraftPattern(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <input
                type="text"
                placeholder="Search Color"
                value={draftColor}
                className="border border-[#C8C8C8] rounded-[3px] px-2 py-[7px] text-sm bg-white outline-none min-w-0 flex-1 md:w-[200px] md:flex-none h-[36px] ml-[5px]"
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
            <div className="hidden md:flex items-center gap-[6px] text-sm text-[#555]">
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
              {/* ── Mobile card list ── */}
              <div className="md:hidden flex flex-col gap-4">
                {sortedProducts.length === 0 && (
                  <p className="text-center text-[#999] py-6 text-sm">No products found</p>
                )}
                {sortedProducts.map(p => (
                  <ProductCard key={`${p.Pattern}||${p.Color}`} p={p} {...cardProps} />
                ))}
              </div>

              {/* ── Desktop table ── */}
              <div className="hidden md:block overflow-x-auto shadow-[0px_2px_15px_rgba(0,0,0,0.22)]">
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
                        <th key={label} className={`${thBase} ${key ? 'cursor-pointer' : 'cursor-default'}`} onClick={() => key && handleSort(key)}>
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
                      <tr><td colSpan={7} className="text-center text-[#999] p-6 border border-[#dee2e6]">No products found</td></tr>
                    )}
                    {sortedProducts.map((p) => {
                      const key = `${p.Pattern}||${p.Color}`;
                      const inStock = p.TotalLength > 0;
                      return (
                        <tr key={key} className="hover:bg-[#f8f9fa]">
                          <td className={`${tdBase} text-center`}>
                            <span className={`inline-block w-3 h-3 rounded-full ${inStock ? 'bg-[#28a745]' : 'bg-[#dc3545]'}`} title={inStock ? 'In Stock' : 'Out of Stock'} />
                          </td>
                          <td className={`${tdBase} font-normal`}>{p.Pattern}</td>
                          <td className={tdBase}>{p.Color}</td>
                          <td className={`${tdBase} text-center`}>{p.TotalLength.toFixed(2)}</td>
                          <td className={`${tdBase} text-center`}>
                            {p.Rolls.length > 0 ? (
                              <button onClick={() => setRollModal(p)} className="bg-transparent border-none text-[#007bff] cursor-pointer text-sm p-0 underline">{p.NumberOfRolls}</button>
                            ) : p.NumberOfRolls}
                          </td>
                          <td className={`${tdBase} relative`}>
                            <div className="inline-flex items-center relative border-b border-black min-w-[115px]">
                              <input
                                type="text"
                                inputMode="decimal"
                                placeholder="Enter Length(m)"
                                className="border-none bg-transparent py-1 px-[2px] w-[100px] text-[13px] text-[#555] text-center focus:bg-white focus:border focus:border-[#007bff] focus:shadow-sm rounded"
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
                                        if (!isNaN(num) && num > 0) editCartItem.mutate({ id: cartItem.id, quantity: num });
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
                                  onChange={v => {
                                    setPanelNotes(prev => ({ ...prev, [key]: v }));
                                    const cartItem = cartItemByKey[key];
                                    if (cartItem) {
                                      clearTimeout(debounceTimers.current[`panel_${key}`]);
                                      debounceTimers.current[`panel_${key}`] = setTimeout(() => {
                                        editCartItem.mutate({ id: cartItem.id, remark: v });
                                      }, 800);
                                    }
                                  }}
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

              <Pagination />
            </>
          )}
        </div>
      </section>

      <RollModal product={rollModal} onClose={() => setRollModal(null)} />

      {/* Mobile Filter Sidebar */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(false)}
            className="absolute inset-0 bg-black/50"
            aria-label="Close filters"
          />

          <div className="absolute right-0 top-0 h-full w-[86%] max-w-[360px] bg-white shadow-xl flex flex-col">
            <div className="h-[62px] flex items-center justify-end px-4 border-b border-[#eee]">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="text-[#666] text-[28px] leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {[
                {
                  key: 'sortBy',
                  label: 'Sort by',
                  content: (
                    <select value={mobileDraftFilters.sortBy} onChange={e => setMobileDraftFilter('sortBy', e.target.value)} className="w-full px-[6px] py-1 text-[13px] border border-[#ccc] rounded-[3px] h-[30px] bg-white">
                      <option value="">Select Sorting</option>
                      <option value="stock">Stock Status</option>
                      <option value="pattern">Pattern</option>
                      <option value="color">Color</option>
                      <option value="qty">Quantity Available</option>
                      <option value="rolls">Number of Rolls</option>
                    </select>
                  ),
                },
                {
                  key: 'pattern',
                  label: 'Pattern',
                  content: (
                    <select value={mobileDraftFilters.pattern} onChange={e => setMobileDraftFilter('pattern', e.target.value)} className="w-full px-[6px] py-1 text-[13px] border border-[#ccc] rounded-[3px] h-[30px] bg-white">
                      <option value="">Select Pattern</option>
                      {mobilePatterns.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  ),
                },
                {
                  key: 'color',
                  label: 'Color',
                  content: (
                    <select value={mobileDraftFilters.color} onChange={e => setMobileDraftFilter('color', e.target.value)} className="w-full px-[6px] py-1 text-[13px] border border-[#ccc] rounded-[3px] h-[30px] bg-white">
                      <option value="">Select Color</option>
                      {mobileColors.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  ),
                },
              ].map((item) => (
                <div key={item.key} className="border-b border-[#eee]">
                  <button
                    type="button"
                    onClick={() => setMobileExpanded(s => ({ ...s, [item.key]: !s[item.key] }))}
                    className="w-full px-5 py-4 flex items-center justify-between text-left"
                  >
                    <span className="text-[16px] font-semibold text-[#111]">{item.label}</span>
                    <span className="text-[22px] font-semibold text-[#111]">{mobileExpanded[item.key] ? '−' : '+'}</span>
                  </button>
                  {mobileExpanded[item.key] && (
                    <div className="px-5 pb-4">
                      {item.content}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-5">
              <button
                type="button"
                onClick={applyMobileFilters}
                className="w-full bg-black text-white py-3 font-semibold"
              >
                Apply Filters
              </button>
              <button
                type="button"
                onClick={() => { clearFilters(); setMobileFiltersOpen(false); }}
                className="w-full mt-4 border border-black text-black py-3 font-semibold bg-white"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
