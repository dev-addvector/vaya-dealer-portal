import { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useLogout } from '@/hooks/useAuth';

const navItems = [
  ['/admin/dashboard', 'Dashboard'],
  ['/admin/login-image', 'Login Image'],
  ['/admin/smtp-setting', 'SMTP Setting'],
  ['/admin/max-reserve-days', 'Maximum Reserve Days'],
  ['/admin/gst-setting', 'GST Setting'],
  ['/admin/qr-setting', 'QR Redirection'],
  ['/admin/ads', 'Ads'],
  ['/admin/ebrochures', 'E-Brochure'],
  ['/admin/brochures', 'India RRP Price List'],
  ['/admin/subadmins', 'Sub Admin'],
  ['/admin/stocks', 'Stocks'],
  ['/admin/users', 'View Users'],
  ['/admin/create-order', 'Create Order'],
];

export default function AdminLayout() {
  const logout = useLogout();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 bg-gray-900 text-white flex-col shrink-0 h-screen sticky top-0">
        <div className="px-5 py-4 border-b border-gray-700">
          <span className="font-bold text-lg tracking-wide">VAYA</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {navItems.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-5 py-2.5 text-sm transition-colors ${
                  isActive ? 'bg-vaya-primary text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`
              }
            >
              <span className="w-1.5 h-1.5 rounded-sm bg-current opacity-60 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => logout.mutate()}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 rounded transition-colors"
          >
            Log Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden bg-white border-b border-[#eee] sticky top-0 z-40">
          <div className="h-14 flex items-center justify-between px-2">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="h-14 px-3 bg-transparent border-none cursor-pointer flex items-center justify-center"
              aria-label="Open menu"
            >
              <svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect y="0" width="22" height="2" rx="1" fill="#333"/>
                <rect y="7" width="22" height="2" rx="1" fill="#333"/>
                <rect y="14" width="22" height="2" rx="1" fill="#333"/>
              </svg>
            </button>

            <button
              onClick={() => navigate('/admin/dashboard')}
              className="bg-transparent border-none cursor-pointer text-[#111] font-semibold"
              aria-label="Go to dashboard"
            >
              VAYA
            </button>

            <div className="w-[46px]" />
          </div>
        </header>

        {/* Mobile overlay */}
        {mobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 z-50 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile drawer */}
        <div
          className={`md:hidden fixed top-0 left-0 h-full w-[300px] bg-gray-900 text-white z-[60] flex flex-col transform transition-transform duration-200 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center h-14 shrink-0 border-b border-gray-700">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="h-14 px-4 bg-transparent border-none cursor-pointer flex items-center justify-center text-white"
              aria-label="Close menu"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L17 17M17 1L1 17" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <span className="font-bold text-[16px] tracking-wide">Admin</span>
          </div>

          <nav className="flex-1 overflow-y-auto py-2">
            {navItems.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-5 py-3 text-[15px] transition-colors ${
                    isActive ? 'bg-vaya-primary text-white' : 'text-gray-200 hover:bg-gray-700 hover:text-white'
                  }`
                }
              >
                <span className="w-1.5 h-1.5 rounded-sm bg-current opacity-60 shrink-0" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-700">
            <button
              onClick={() => { setMobileMenuOpen(false); logout.mutate(); }}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 rounded transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>

        <main className="flex-1 p-4 sm:p-6 bg-gray-50 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
