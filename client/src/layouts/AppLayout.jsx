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
  const [priceListLoading, setPriceListLoading] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileRef = useRef(null);
  const downloadsRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (downloadsRef.current && !downloadsRef.current.contains(e.target)) setDownloadsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

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

  const navIconBase = 'nav-icon w-[30px] h-[30px] md:w-[34px] md:h-[34px] flex items-center justify-center border border-[rgba(112,112,112,0.35)] rounded-full no-underline shrink-0';
  const dropdownItemBase = 'px-4 py-[10px] cursor-pointer text-vaya-gray text-sm flex items-center gap-2 hover:bg-vaya-green';

  const mobileNavItems = [
    { label: 'Home', to: '/products' },
    { label: 'My Order', to: '/orders/my-orders' },
    { label: 'My Open Order', to: '/orders/open-orders' },
    { label: 'My Reservations', to: '/orders/reserved-orders' },
    { label: 'My Profile', to: '/profile' },
    { label: 'Download e-brochure', to: '/downloads/ebrochures' },
    { label: 'Download Price list', action: () => { setMobileMenuOpen(false); setPriceListModal(true); } },
    { label: 'About Us', to: '/about' },
  ];

  const handleMobileNav = (item) => {
    if (item.action) {
      item.action();
    } else {
      navigate(item.to);
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <style>{`
        .nav-icon {
          transition: background-color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
        }
        .nav-icon:hover {
          background-color: rgba(128,122,82,0.12) !important;
          border-color: #807A52 !important;
          opacity: 1 !important;
        }
        .cart-btn:hover { background-color: #9aae37 !important; }
        .mobile-drawer {
          transform: translateX(-100%);
          transition: transform 0.28s ease;
        }
        .mobile-drawer.open {
          transform: translateX(0);
        }
      `}</style>

      {/* ── Desktop header (hidden on mobile) ── */}
      <header className="hidden md:block bg-vaya-light shadow-[0px_1px_3px_rgba(0,0,0,0.16)] sticky top-0 z-40 w-full">
        <nav className="h-16 flex items-center justify-between">

          <div className="w-1/3 px-[30px] py-5">
            <NavLink to="/products">
              <img src="/images/logo.png" alt="Vaya" className="h-7 object-contain block" />
            </NavLink>
          </div>

          <div className="w-1/3 text-center">
            <span className="text-[25px] text-vaya-black font-normal">Dealer Portal</span>
          </div>

          <div className="w-1/3 flex items-center justify-end pr-[20px] gap-2 md:gap-3 lg:gap-4">

            <NavLink to="/products" title="Stock Check" className={navIconBase}>
              {({ isActive }) => (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill={isActive ? '#807A52' : '#707070'} viewBox="0 0 16 16">
                  <path d="M8.354 1.146a.5.5 0 0 0-.708 0l-6 6-.354.353V15.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-4h2v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5V7.5l-.354-.354-6-6z"/>
                </svg>
              )}
            </NavLink>

            <NavLink to="/orders/open-orders" title="Open Orders" className={({ isActive }) => `${navIconBase} ${isActive ? 'opacity-100' : 'opacity-60'}`}>
              <img src="/images/open-orders.svg" alt="Open Orders" className="w-[80%] h-[80%] object-contain" />
            </NavLink>

            <NavLink to="/orders/reserved-orders" title="Reserved Orders" className={({ isActive }) => `${navIconBase} ${isActive ? 'opacity-100' : 'opacity-60'}`}>
              <img src="/images/reserve-order.svg" alt="Reserved Orders" className="w-[80%] h-[80%] object-contain" />
            </NavLink>

            <div ref={downloadsRef} className="relative">
              <button
                onClick={() => setDownloadsOpen(!downloadsOpen)}
                title="Downloads"
                className={`nav-icon w-[30px] h-[30px] md:w-[34px] md:h-[34px] border border-[rgba(112,112,112,0.35)] rounded-full bg-transparent cursor-pointer p-0 flex items-center justify-center shrink-0 ${downloadsOpen ? 'opacity-100' : 'opacity-60'}`}
              >
                <img src="/images/downloads.svg" alt="Downloads" className="w-[80%] h-[80%] object-contain" />
              </button>
              {downloadsOpen && (
                <div className="absolute top-[calc(100%+8px)] right-0 bg-white shadow-[0px_3px_20px_rgba(0,0,0,0.32)] min-w-[160px] z-[100] rounded-[4px]">
                  <div onClick={() => { setDownloadsOpen(false); navigate('/downloads/ebrochures'); }} className={`${dropdownItemBase} border-b border-[rgba(92,92,92,0.1)]`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zm0-2a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zm0-2a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1h-3z"/><path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z"/></svg>
                    E-Brochure
                  </div>
                  <div onClick={() => { setDownloadsOpen(false); setPriceListModal(true); }} className={dropdownItemBase}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 16 16"><path d="M1 0a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1H1zm13 2v12H2V2h12zm-5.354 7.354a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L8 8.293l1.646-1.647a.5.5 0 0 1 .708.708l-2 2z"/></svg>
                    Price List
                  </div>
                </div>
              )}
            </div>

            <div ref={profileRef} className="relative">
              <button onClick={() => setProfileOpen(!profileOpen)} title="Profile" className="nav-icon w-[30px] h-[30px] md:w-[34px] md:h-[34px] border border-[rgba(84,84,84,0.5)] rounded-full p-0 bg-transparent cursor-pointer flex items-center justify-center">
                <img src="/images/menu-icon-3.png" alt="Profile" className="w-[70%] h-[70%] object-contain opacity-70" />
              </button>
              {profileOpen && (
                <div className="absolute top-[calc(100%+8px)] right-0 bg-white shadow-[0px_3px_20px_rgba(0,0,0,0.32)] min-w-[160px] z-[100] rounded-[4px]">
                  {[['/profile', 'Profile'], ['/orders/my-orders', 'All Orders']].map(([to, label]) => (
                    <div key={to} onClick={() => { setProfileOpen(false); navigate(to); }} className={`${dropdownItemBase} border-b border-[rgba(92,92,92,0.1)]`}>
                      {label}
                    </div>
                  ))}
                  <div onClick={() => { setProfileOpen(false); logout.mutate(); }} className={dropdownItemBase}>Logout</div>
                </div>
              )}
            </div>

            <button onClick={() => navigate('/cart')} title="Cart" className="cart-btn bg-vaya-green px-[14px] md:px-[18px] border-none cursor-pointer relative flex items-center justify-center h-16 shrink-0">
              <img src="/images/shopping-cart.png" alt="Cart" className="w-7" />
              {cartCount >= 0 && (
                <span className="absolute w-[17px] h-[17px] bg-vaya-black text-vaya-green rounded-full text-center text-[12px] leading-[17px] right-2 top-2">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* ── Mobile header (hidden on desktop) ── */}
      <header className="md:hidden bg-vaya-light shadow-[0px_1px_3px_rgba(0,0,0,0.16)] sticky top-0 z-40 w-full">
        <div className="h-14 flex items-center justify-between">

          {/* Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="h-14 px-4 bg-transparent border-none cursor-pointer flex items-center justify-center"
            aria-label="Open menu"
          >
            <svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect y="0" width="22" height="2" rx="1" fill="#333"/>
              <rect y="7" width="22" height="2" rx="1" fill="#333"/>
              <rect y="14" width="22" height="2" rx="1" fill="#333"/>
            </svg>
          </button>

          {/* Logo centered */}
          <NavLink to="/products" className="absolute left-1/2 -translate-x-1/2">
            <img src="/images/logo.png" alt="Vaya" className="h-6 object-contain block" />
          </NavLink>

          {/* Cart */}
          <button
            onClick={() => navigate('/cart')}
            className="cart-btn bg-vaya-green h-14 px-4 border-none cursor-pointer relative flex items-center justify-center"
          >
            <img src="/images/shopping-cart.png" alt="Cart" className="w-6" />
            <span className="absolute w-[16px] h-[16px] bg-vaya-black text-vaya-green rounded-full text-center text-[11px] leading-[16px] right-1 top-1">
              {cartCount}
            </span>
          </button>
        </div>
      </header>


      {/* ── Mobile drawer panel ── */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
      )}

      <div className={`md:hidden fixed top-0 left-0 h-full w-[300px] bg-white z-[60] flex flex-col mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}>

        {/* Drawer top bar */}
        <div className="flex items-center h-14 shrink-0">
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="h-14 px-4 bg-transparent border-none cursor-pointer flex items-center justify-center text-[#333]"
            aria-label="Close menu"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L17 17M17 1L1 17" stroke="#333" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Logo in drawer */}
        <div className="flex justify-center py-6 shrink-0">
          <img src="/images/logo.png" alt="Vaya" className="h-8 object-contain" />
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto">
          {mobileNavItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleMobileNav(item)}
              className="w-full text-left px-6 py-4 text-[15px] text-[#333] border-b border-[#e8e8e8] bg-transparent cursor-pointer hover:bg-gray-50"
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => { setMobileMenuOpen(false); logout.mutate(); }}
            className="w-full text-left px-6 py-4 text-[15px] text-[#333] border-b border-[#e8e8e8] bg-transparent cursor-pointer hover:bg-gray-50"
          >
            Logout
          </button>
        </nav>
      </div>

      <main className="flex-1">
        <div id="wrapper" className="bg-white min-h-[calc(100vh-64px)]">
          <Outlet />
        </div>
      </main>

      <footer className="bg-[#f5f5f5] border-t border-[#e0e0e0] shrink-0">
        <div className="p-4 text-center">
          <p className="m-0 mb-1 text-[13px] text-[#666]">VAYA Home By Universal Textile Mills</p>
          <p className="m-0 text-[13px] text-[#666]">
            Customer Care :{' '}
            <a href="mailto:sales@vayahome.com" className="text-[#666] no-underline">sales@vayahome.com</a>
            {' | '}
            <a href="tel:+918068170500" className="text-[#666] no-underline">+91 8068170500</a>
          </p>
        </div>
      </footer>

      {/* Price List modal */}
      {priceListModal && (
        <div onClick={() => { if (!priceListLoading) setPriceListModal(false); }} className="fixed inset-0 bg-[rgba(0,0,0,0.45)] z-[200] flex items-center justify-center">
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-[8px] px-12 py-9 min-w-[320px] shadow-[0_8px_32px_rgba(0,0,0,0.18)] relative text-center">
            <button onClick={() => { if (!priceListLoading) setPriceListModal(false); }} className="absolute top-3 right-[14px] bg-transparent border border-[#ccc] rounded-full w-6 h-6 cursor-pointer text-sm leading-[22px] text-[#555]">×</button>
            <div className="flex gap-10 justify-center items-end">
              <div className="flex flex-col items-center gap-2">
                <button onClick={() => triggerDownload('csv')} disabled={!!priceListLoading} className={`bg-transparent border-none text-[16px] font-semibold py-1 ${priceListLoading ? 'cursor-wait' : 'cursor-pointer'} ${priceListLoading === 'csv' ? 'text-vaya-green' : 'text-vaya-black'}`}>
                  {priceListLoading === 'csv' ? 'Downloading…' : 'CSV'}
                </button>
                <div className="w-[100px] h-[2px] bg-vaya-black" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <button onClick={() => triggerDownload('pdf')} disabled={!!priceListLoading} className={`bg-transparent border-none text-[16px] font-semibold py-1 ${priceListLoading ? 'cursor-wait' : 'cursor-pointer'} ${priceListLoading === 'pdf' ? 'text-vaya-green' : 'text-vaya-black'}`}>
                  {priceListLoading === 'pdf' ? 'Downloading…' : 'PDF'}
                </button>
                <div className="w-[100px] h-[2px] bg-vaya-black" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
