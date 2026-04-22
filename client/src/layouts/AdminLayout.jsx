import { Outlet, NavLink } from 'react-router-dom';
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
  ['/admin/subadmins', 'Sub Admin'],
  ['/admin/stocks', 'Stocks'],
  ['/admin/users', 'View Users'],
  ['/admin/create-order', 'Create Order'],
];

export default function AdminLayout() {
  const logout = useLogout();
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-60 bg-gray-900 text-white flex flex-col shrink-0 h-screen sticky top-0">
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
      <main className="flex-1 p-6 bg-gray-50 overflow-y-auto h-screen">
        <Outlet />
      </main>
    </div>
  );
}
