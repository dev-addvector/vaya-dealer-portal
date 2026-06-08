import { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useLogout } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { canAccessAdminRoute, getDefaultAdminRoute } from '@/utils/permissions';

const navItems = [
  ['/admin/dashboard', 'Dashboard', (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor" opacity="0.9"/>
      <rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor" opacity="0.9"/>
      <rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor" opacity="0.9"/>
      <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" opacity="0.9"/>
    </svg>
  )],
  ['/admin/login-image', 'Login Image', (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="2" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="5.5" cy="6" r="1.5" fill="currentColor"/>
      <path d="M1 11l3.5-3.5 2.5 2.5 2-2 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )],
  ['/admin/smtp-setting', 'SMTP Setting', (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M1 4.5l7 5 7-5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )],
  ['/admin/max-reserve-days', 'Maximum Reserve Days', (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="2.5" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 1v3M11 1v3M1 7h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <rect x="4" y="9.5" width="2" height="2" rx="0.4" fill="currentColor"/>
      <rect x="7" y="9.5" width="2" height="2" rx="0.4" fill="currentColor"/>
      <rect x="10" y="9.5" width="2" height="2" rx="0.4" fill="currentColor"/>
    </svg>
  )],
  ['/admin/gst-setting', 'GST Setting', (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="1" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )],
  ['/admin/qr-setting', 'QR Redirection', (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="5.5" height="5.5" rx="0.8" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="9.5" y="1" width="5.5" height="5.5" rx="0.8" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="1" y="9.5" width="5.5" height="5.5" rx="0.8" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="2.5" y="2.5" width="2.5" height="2.5" fill="currentColor"/>
      <rect x="11" y="2.5" width="2.5" height="2.5" fill="currentColor"/>
      <rect x="2.5" y="11" width="2.5" height="2.5" fill="currentColor"/>
      <path d="M10 10h2v2h-2zM12 12h3M12 10h3v2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )],
  ['/admin/ads', 'Ads', (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 5.5h2v5H2z" fill="currentColor"/>
      <path d="M4 6l7-3.5v11L4 10z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M11 6.5a2 2 0 010 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M4 10l1 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )],
  ['/admin/ebrochures', 'E-Brochure', (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 1h7l3 3v11H3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M10 1v3h3" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M6 7h5M6 9.5h5M6 12h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )],
  ['/admin/brochures', 'India RRP Price List', (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 6h6M5 8.5h6M5 11h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M1 6h14" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  )],
  ['/admin/subadmins', 'Sub Admin', (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="13" cy="5" r="2" fill="currentColor" opacity="0.5"/>
      <path d="M12 7.5c.4-.1.8-.16 1-.16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )],
  ['/admin/stocks', 'Stocks', (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 1L15 4.5v7L8 15l-7-3.5v-7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M8 1v14M15 4.5L8 8l-7-3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )],
  ['/admin/users', 'View Users', (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="6" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M1 14c0-2.761 2.239-5 5-5s5 2.239 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M14 13c0-1.657-.895-3-2-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )],
  ['/admin/create-order', 'Create Order', (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 1h2l2 8h8l1.5-5H4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="7" cy="13" r="1.5" fill="currentColor"/>
      <circle cx="12" cy="13" r="1.5" fill="currentColor"/>
      <path d="M10 5.5v3M8.5 7H12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )],
];

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CollapseIcon = ({ collapsed }) => (
  collapsed ? (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 3l5 4.5L5 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 3L5 7.5 10 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
);

export default function AdminLayout() {
  const logout = useLogout();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const defaultRoute = getDefaultAdminRoute(user?.role);
  const visibleNavItems = navItems.filter(([to]) => canAccessAdminRoute(user?.role, to));

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex bg-gray-900 text-white flex-col shrink-0 h-screen sticky top-0 transition-all duration-200 ${
          collapsed ? 'w-[60px]' : 'w-60'
        }`}
      >
        <div className={`flex items-center border-b border-gray-700 h-[57px] shrink-0 ${collapsed ? 'justify-center px-0' : 'px-5'}`}>
          {!collapsed && <span className="font-bold text-lg tracking-wide flex-1">VAYA</span>}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-700"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <CollapseIcon collapsed={collapsed} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {visibleNavItems.map(([to, label, icon]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 py-2.5 text-sm transition-colors ${
                  collapsed ? 'justify-center px-0' : 'px-5'
                } ${
                  isActive ? 'bg-vaya-primary text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`
              }
              title={collapsed ? label : undefined}
            >
              <span className="shrink-0">{icon}</span>
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className={`border-t border-gray-700 ${collapsed ? 'p-2' : 'p-4'}`}>
          <button
            onClick={() => logout.mutate()}
            title={collapsed ? 'Log Out' : undefined}
            className={`w-full bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 rounded transition-colors flex items-center gap-2 ${
              collapsed ? 'justify-center px-0' : 'justify-center px-3'
            }`}
          >
            <LogoutIcon />
            {!collapsed && <span>Log Out</span>}
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
              onClick={() => navigate(defaultRoute)}
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
            {visibleNavItems.map(([to, label, icon]) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-5 py-3 text-[15px] transition-colors ${
                    isActive ? 'bg-vaya-primary text-white' : 'text-gray-200 hover:bg-gray-700 hover:text-white'
                  }`
                }
              >
                <span className="shrink-0">{icon}</span>
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-700">
            <button
              onClick={() => { setMobileMenuOpen(false); logout.mutate(); }}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 rounded transition-colors flex items-center justify-center gap-2"
            >
              <LogoutIcon />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        <main className="flex-1 p-4 sm:p-6 bg-gray-50 overflow-y-auto">
          <Outlet />
        </main>
        <footer className="shrink-0 py-3 border-t border-gray-200 text-center text-xs text-gray-400 bg-gray-50">
          2018–{new Date().getFullYear()} VAYA
        </footer>
      </div>
    </div>
  );
}
