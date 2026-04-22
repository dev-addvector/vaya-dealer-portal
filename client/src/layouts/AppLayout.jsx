import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useLogout } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useProducts';
import { downloadPriceListCsv, downloadPriceListPdf } from '@/api/download.api';

export default function AppLayout() {
  const logout = useLogout();
  const navigate = useNavigate();
  const { data: cart } = useCart();
  const cartCount = cart?.items?.length ?? 0;

  const [profileOpen, setProfileOpen] = useState(false);
  const [downloadsOpen, setDownloadsOpen] = useState(false);
  const [priceListModal, setPriceListModal] = useState(false);
  const [priceListLoading, setPriceListLoading] = useState(null); // 'csv' | 'pdf' | null
  const profileRef = useRef(null);
  const downloadsRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (downloadsRef.current && !downloadsRef.current.contains(e.target)) {
        setDownloadsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const triggerDownload = async (type) => {
    setPriceListLoading(type);
    try {
      const blob = type === 'csv' ? await downloadPriceListCsv() : await downloadPriceListPdf();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = type === 'csv' ? 'Price-list.csv' : 'Price-list.pdf';
      a.click();
      URL.revokeObjectURL(url);
      setPriceListModal(false);
    } finally {
      setPriceListLoading(null);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Desktop header */}
      <header style={{ backgroundColor: '#E3E8CC', boxShadow: '0px 1px 3px #00000029', position: 'sticky', top: 0, zIndex: 40, width: '100%' }}>
        <nav style={{ height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '100%', padding: '0' }}>

          {/* Logo — left 33% */}
          <div style={{ width: '33%', padding: '20px 30px' }}>
            <NavLink to="/products">
              <img src="/images/logo.png" alt="Vaya" style={{ height: '40px', objectFit: 'contain', display: 'block' }} />
            </NavLink>
          </div>

          {/* Title — center 33% */}
          <div style={{ width: '33%', textAlign: 'center' }}>
            <span style={{ fontSize: '25px', color: '#111111', fontWeight: 400 }}>Dealer Portal</span>
          </div>

          {/* Nav icons — right 33% */}
          <div style={{ width: '33%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '50px', gap: '32px' }}>

            {/* Stock Check (Home) */}
            <NavLink
              to="/products"
              title="Stock Check"
              style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#707070', textDecoration: 'none' }}
            >
              {({ isActive }) => (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill={isActive ? '#807A52' : '#707070'} viewBox="0 0 16 16">
                  <path d="M8.354 1.146a.5.5 0 0 0-.708 0l-6 6-.354.353V15.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-4h2v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5V7.5l-.354-.354-6-6z"/>
                </svg>
              )}
            </NavLink>

            {/* Open Orders */}
            <NavLink
              to="/orders/open-orders"
              title="Open Orders"
              style={{ width: '34px', height: '34px', display: 'block', opacity: 0.6 }}
              className={({ isActive }) => isActive ? 'opacity-100' : ''}
            >
              <img src="/images/open-orders.svg" alt="Open Orders" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </NavLink>

            {/* Reserved Orders */}
            <NavLink
              to="/orders/reserved-orders"
              title="Reserved Orders"
              style={{ width: '34px', height: '34px', display: 'block', opacity: 0.6 }}
              className={({ isActive }) => isActive ? 'opacity-100' : ''}
            >
              <img src="/images/reserve-order.svg" alt="Reserved Orders" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </NavLink>

            {/* Downloads dropdown */}
            <div ref={downloadsRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setDownloadsOpen(!downloadsOpen)}
                title="Downloads"
                style={{ width: '34px', height: '34px', border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, opacity: downloadsOpen ? 1 : 0.6 }}
              >
                <img src="/images/downloads.svg" alt="Downloads" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </button>

              {downloadsOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: '#fff', boxShadow: '0px 3px 20px #00000052', minWidth: '160px', zIndex: 100, borderRadius: '4px' }}>
                  <div
                    onClick={() => { setDownloadsOpen(false); navigate('/downloads/ebrochures'); }}
                    style={{ padding: '10px 16px', cursor: 'pointer', color: '#707070', fontSize: '14px', borderBottom: '1px solid #5c5c5c1a', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#AEC148'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zm0-2a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zm0-2a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1h-3z"/><path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z"/></svg>
                    E-Brochure
                  </div>
                  <div
                    onClick={() => { setDownloadsOpen(false); setPriceListModal(true); }}
                    style={{ padding: '10px 16px', cursor: 'pointer', color: '#707070', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#AEC148'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 16 16"><path d="M1 0a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1H1zm13 2v12H2V2h12zm-5.354 7.354a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L8 8.293l1.646-1.647a.5.5 0 0 1 .708.708l-2 2z"/></svg>
                    Price List
                  </div>
                </div>
              )}
            </div>

            {/* Profile dropdown */}
            <div ref={profileRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                title="Profile"
                style={{ width: '34px', height: '34px', border: '1px solid rgba(84,84,84,0.5)', borderRadius: '50%', padding: 0, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <img src="/images/menu-icon-3.png" alt="Profile" style={{ width: '70%', height: '70%', objectFit: 'contain', opacity: 0.7 }} />
              </button>

              {profileOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: '#fff', boxShadow: '0px 3px 20px #00000052', minWidth: '160px', zIndex: 100, borderRadius: '4px' }}>
                  {[
                    ['/profile', 'Profile'],
                    ['/orders/my-orders', 'All Orders'],
                  ].map(([to, label]) => (
                    <div
                      key={to}
                      onClick={() => { setProfileOpen(false); navigate(to); }}
                      style={{ padding: '10px 16px', cursor: 'pointer', color: '#707070', fontSize: '14px', borderBottom: '1px solid #5c5c5c1a', display: 'flex', alignItems: 'center', gap: '8px' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#AEC148'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                    >
                      {label}
                    </div>
                  ))}
                  <div
                    onClick={() => { setProfileOpen(false); logout.mutate(); }}
                    style={{ padding: '10px 16px', cursor: 'pointer', color: '#707070', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#AEC148'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                  >
                    Logout
                  </div>
                </div>
              )}
            </div>

            {/* Cart */}
            <button
              onClick={() => navigate('/cart')}
              title="Cart"
              style={{ backgroundColor: '#AEC148', padding: '25px', border: 'none', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '90px' }}
            >
              <img src="/images/shopping-cart.png" alt="Cart" style={{ width: '40px' }} />
              {cartCount > 0 && (
                <span style={{ position: 'absolute', width: '17px', height: '17px', background: '#000', color: '#AEC148', borderRadius: '50%', textAlign: 'center', fontSize: '12px', lineHeight: '17px', right: '8px', top: '8px' }}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </nav>
      </header>

      <main style={{ flex: 1 }}>
        <div id="wrapper" style={{ backgroundColor: '#ffffff', minHeight: 'calc(100vh - 90px)' }}>
          <Outlet />
        </div>
      </main>

      <footer style={{ backgroundColor: '#f5f5f5', borderTop: '1px solid #e0e0e0', flexShrink: 0 }}>
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#666' }}>VAYA Home By Universal Textile Mills</p>
          <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
            Customer Care :{' '}
            <a href="mailto:sales@vayahome.com" style={{ color: '#666', textDecoration: 'none' }}>sales@vayahome.com</a>
            {' | '}
            <a href="tel:+918068170500" style={{ color: '#666', textDecoration: 'none' }}>+91 8068170500</a>
          </p>
        </div>
      </footer>

      {/* Price List format modal */}
      {priceListModal && (
        <div
          onClick={() => { if (!priceListLoading) setPriceListModal(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: '8px', padding: '36px 48px', minWidth: '320px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', position: 'relative', textAlign: 'center' }}
          >
            <button
              onClick={() => { if (!priceListLoading) setPriceListModal(false); }}
              style={{ position: 'absolute', top: '12px', right: '14px', background: 'none', border: '1px solid #ccc', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '14px', lineHeight: '22px', color: '#555' }}
            >×</button>
            <div style={{ display: 'flex', gap: '40px', justifyContent: 'center', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => triggerDownload('csv')}
                  disabled={!!priceListLoading}
                  style={{ background: 'none', border: 'none', cursor: priceListLoading ? 'wait' : 'pointer', fontSize: '16px', fontWeight: 600, color: priceListLoading === 'csv' ? '#AEC148' : '#111', padding: '4px 0' }}
                >
                  {priceListLoading === 'csv' ? 'Downloading…' : 'CSV'}
                </button>
                <div style={{ width: '100px', height: '2px', background: '#111' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => triggerDownload('pdf')}
                  disabled={!!priceListLoading}
                  style={{ background: 'none', border: 'none', cursor: priceListLoading ? 'wait' : 'pointer', fontSize: '16px', fontWeight: 600, color: priceListLoading === 'pdf' ? '#AEC148' : '#111', padding: '4px 0' }}
                >
                  {priceListLoading === 'pdf' ? 'Downloading…' : 'PDF'}
                </button>
                <div style={{ width: '100px', height: '2px', background: '#111' }} />
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
