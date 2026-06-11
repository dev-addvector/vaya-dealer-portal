import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useLogout } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { useCart } from '@/hooks/useProducts';
import { downloadPriceListCsv, downloadPriceListPdf } from '@/api/download.api';
import { getActiveAd } from '@/api/admin.api';
import Footer from '@/components/ui/Footer';
import ErpStatusIndicator from '@/components/ui/ErpStatusIndicator';

function IconGrid({ color = '#111111' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  );
}

function IconShoppingBag({ color = '#111111' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  );
}

function IconBookmark({ color = '#111111' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
    </svg>
  );
}

function IconDownload({ color = '#111111' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}

function IconUser({ color = '#111111' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function IconFileText({ color = '#111111' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  );
}

function IconBook({ color = '#111111' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  );
}

function IconInfo({ color = '#111111' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  );
}

function IconLogOut({ color = '#111111' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}

export default function AppLayout() {
  const logout = useLogout();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: cart } = useCart();
  const { data: adRes } = useQuery({ queryKey: ['active-ad'], queryFn: getActiveAd, staleTime: 5 * 60 * 1000, enabled: user?.role === 'user' });
  const activeAd = adRes?.data ?? null;
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

  const navIconBase = 'nav-icon w-[30px] h-[30px] md:w-[34px] md:h-[34px] flex items-center justify-center border border-[rgba(0,0,0,0.07)] rounded-full no-underline shrink-0';
  const dropdownItemBase = 'px-4 py-[10px] cursor-pointer text-vaya-gray text-sm flex items-center gap-2 hover:bg-vaya-green hover:text-vaya-black';

  const mobileNavItems = [
    { label: 'Home', to: '/products', icon: <IconGrid color="#555" /> },
    { label: 'My Order', to: '/orders/my-orders', icon: <IconFileText color="#555" /> },
    { label: 'My Open Order', to: '/orders/open-orders', icon: <IconShoppingBag color="#555" /> },
    { label: 'My Reservations', to: '/orders/reserved-orders', icon: <IconBookmark color="#555" /> },
    { label: 'My Profile', to: '/profile', icon: <IconUser color="#555" /> },
    { label: 'Download e-brochure', to: '/downloads/ebrochures', icon: <IconBook color="#555" /> },
    { label: 'Download Price list', action: () => { setMobileMenuOpen(false); setPriceListModal(true); }, icon: <IconDownload color="#555" /> },
    { label: 'About Us', action: () => { window.open('https://vayahome.com/', '_blank'); setMobileMenuOpen(false); }, icon: <IconInfo color="#555" /> },
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
          background-color: #ffffff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.07);
          transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
        }
        .nav-icon:hover {
          background-color: rgba(128,122,82,0.10) !important;
          border-color: #807A52 !important;
          box-shadow: 0 2px 8px rgba(128,122,82,0.22), 0 4px 14px rgba(128,122,82,0.14) !important;
          opacity: 1 !important;
        }
        .nav-icon-active {
          box-shadow: 0 0 0 2.5px rgba(128,122,82,0.35), 0 2px 10px rgba(128,122,82,0.28), 0 4px 18px rgba(128,122,82,0.16) !important;
        }
        .cart-btn:hover { background-color: #9aae37 !important; }
        .mobile-drawer {
          transform: translateX(-100%);
          transition: transform 0.28s ease;
        }
        .mobile-drawer.open {
          transform: translateX(0);
        }
        .support-tab {
          position: fixed;
          right: 0;
          top: 52%;
          transform: translateY(-50%) translateX(0);
          z-index: 200;
          display: flex;
          align-items: center;
          text-decoration: none;
          transition: transform 0.28s cubic-bezier(0.34, 1.2, 0.64, 1);
          filter: drop-shadow(-3px 2px 10px rgba(0,0,0,0.22));
        }
        .support-tab:hover {
          transform: translateY(-50%) translateX(-6px);
          filter: drop-shadow(-4px 3px 14px rgba(128,122,82,0.45));
        }
        .support-tab-body {
          background: #807A52;
          border-radius: 10px 0 0 10px;
          padding: 14px 10px 14px 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: #fff;
        }
        .support-tab-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.8px;
          writing-mode: vertical-rl;
          text-orientation: mixed;
          transform: rotate(180deg);
          color: rgba(255,255,255,0.88);
          text-transform: uppercase;
        }
        .support-tab-icon {
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        @media (max-width: 767px) {
          .support-tab-label { display: none; }
          .support-tab-body { padding: 9px 7px; }
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

            {/* Products / Stock Check */}
            <NavLink to="/products" title="Stock Check" className={({ isActive }) => `${navIconBase} ${isActive ? 'nav-icon-active opacity-100 !border-[#807A52]' : 'opacity-60'}`}>
              {({ isActive }) => <IconGrid color={isActive ? '#807A52' : '#111111'} />}
            </NavLink>

            {/* Open Orders */}
            <NavLink to="/orders/open-orders" title="Open Orders" className={({ isActive }) => `${navIconBase} ${isActive ? 'nav-icon-active opacity-100 !border-[#807A52]' : 'opacity-60'}`}>
              {({ isActive }) => <IconShoppingBag color={isActive ? '#807A52' : '#111111'} />}
            </NavLink>

            {/* Reserved Orders */}
            <NavLink to="/orders/reserved-orders" title="Reserved Orders" className={({ isActive }) => `${navIconBase} ${isActive ? 'nav-icon-active opacity-100 !border-[#807A52]' : 'opacity-60'}`}>
              {({ isActive }) => <IconBookmark color={isActive ? '#807A52' : '#111111'} />}
            </NavLink>

            {/* Downloads */}
            <div ref={downloadsRef} className="relative" onMouseEnter={() => setDownloadsOpen(true)} onMouseLeave={() => setDownloadsOpen(false)}>
              <button
                title="Downloads"
                className={`nav-icon w-[30px] h-[30px] md:w-[34px] md:h-[34px] border border-[rgba(0,0,0,0.07)] rounded-full cursor-pointer p-0 flex items-center justify-center shrink-0 ${downloadsOpen ? 'opacity-100' : 'opacity-60'}`}
              >
                <IconDownload color="#111111" />
              </button>
              {downloadsOpen && (
                <div className="absolute top-full right-0 pt-2 min-w-[160px] z-[100]">
                <div className="bg-white shadow-[0px_3px_20px_rgba(0,0,0,0.32)] rounded-[4px]">
                  <div onClick={() => { setDownloadsOpen(false); navigate('/downloads/ebrochures'); }} className={`${dropdownItemBase} border-b border-[rgba(92,92,92,0.1)]`}>
                    <IconBook color="currentColor" />
                    E-Brochure
                  </div>
                  <div onClick={() => { setDownloadsOpen(false); setPriceListModal(true); }} className={dropdownItemBase}>
                    <IconFileText color="currentColor" />
                    Price List
                  </div>
                </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div ref={profileRef} className="relative" onMouseEnter={() => setProfileOpen(true)} onMouseLeave={() => setProfileOpen(false)}>
              <button title="Profile" className={`nav-icon w-[30px] h-[30px] md:w-[34px] md:h-[34px] border border-[rgba(0,0,0,0.07)] rounded-full p-0 cursor-pointer flex items-center justify-center ${profileOpen ? 'opacity-100' : 'opacity-60'}`}>
                <IconUser color="#111111" />
              </button>
              {profileOpen && (
                <div className="absolute top-full right-0 pt-2 min-w-[160px] z-[100]">
                <div className="bg-white shadow-[0px_3px_20px_rgba(0,0,0,0.32)] rounded-[4px]">
                  <div onClick={() => { setProfileOpen(false); navigate('/profile'); }} className={`${dropdownItemBase} border-b border-[rgba(92,92,92,0.1)]`}>
                    <IconUser color="currentColor" />
                    Profile
                  </div>
                  <div onClick={() => { setProfileOpen(false); navigate('/orders/my-orders'); }} className={`${dropdownItemBase} border-b border-[rgba(92,92,92,0.1)]`}>
                    <IconFileText color="currentColor" />
                    All Orders
                  </div>
                  <div onClick={() => { setProfileOpen(false); logout.mutate(); }} className={dropdownItemBase}>
                    <IconLogOut color="currentColor" />
                    Logout
                  </div>
                </div>
                </div>
              )}
            </div>

            <button onClick={() => navigate('/cart')} title="Cart" className="cart-btn bg-vaya-green w-[30px] h-[30px] md:w-[34px] md:h-[34px] border-none cursor-pointer relative flex items-center justify-center shrink-0 rounded-[6px]">
              <img src="/images/shopping-cart.png" alt="Cart" className="w-[16px] md:w-[18px]" />
              {cartCount >= 0 && (
                <span className="absolute w-[15px] h-[15px] bg-vaya-black text-vaya-green rounded-full text-center text-[10px] leading-[15px] -right-1 -top-1">
                  {cartCount}
                </span>
              )}
            </button>
            {/* <ErpStatusIndicator /> */}
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
          <div className="flex items-center">
            <button
              onClick={() => navigate('/cart')}
              className="cart-btn bg-vaya-green h-14 px-4 border-none cursor-pointer relative flex items-center justify-center"
            >
              <img src="/images/shopping-cart.png" alt="Cart" className="w-[22px]" />
              <span className="absolute w-[16px] h-[16px] bg-vaya-black text-vaya-green rounded-full text-center text-[11px] leading-[16px] right-1 top-1">
                {cartCount}
              </span>
            </button>
            {/* <ErpStatusIndicator /> */}
          </div>
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
              className="w-full text-left px-6 py-4 text-[15px] text-[#333] border-b border-[#e8e8e8] bg-transparent cursor-pointer hover:bg-gray-50 flex items-center gap-3"
            >
              <span className="w-5 flex items-center justify-center shrink-0">{item.icon}</span>
              {item.label}
            </button>
          ))}
          <button
            onClick={() => { setMobileMenuOpen(false); logout.mutate(); }}
            className="w-full text-left px-6 py-4 text-[15px] text-[#333] border-b border-[#e8e8e8] bg-transparent cursor-pointer hover:bg-gray-50 flex items-center gap-3"
          >
            <span className="w-5 flex items-center justify-center shrink-0"><IconLogOut color="#555" /></span>
            Logout
          </button>
        </nav>
      </div>

      {/* Ad banner — users only */}
      {user?.role === 'user' && activeAd?.title && (
        <div className="bg-[#807A52] text-white text-sm py-1.5 overflow-hidden">
          <marquee behavior="scroll" direction="left" scrollamount="5">
            {activeAd.title}
          </marquee>
        </div>
      )}

      <main className="flex-1">
        <div id="wrapper" className="bg-white min-h-[calc(100vh-64px)]">
          <Outlet />
        </div>
      </main>

      <Footer />

      {/* Hanging support tab */}
      <a href="mailto:sales@vayahome.com" className="support-tab" title="Contact Support — sales@vayahome.com">
        <div className="support-tab-body">
          <span className="support-tab-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/>
              <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
            </svg>
          </span>
          <span className="support-tab-label">Support</span>
        </div>
      </a>

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
