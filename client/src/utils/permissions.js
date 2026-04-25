// Routes each role can access (super_admin has no entry = unrestricted)
const ROLE_ROUTES = {
  sub_admin: [
    '/admin/dashboard',
    '/admin/users',
    '/admin/users/:unc/orders',
    '/admin/stocks',
    '/admin/create-order',
    '/admin/subadmins',
  ],
  qr_admin: [
    '/admin/qr-setting',
    '/admin/brochures',
  ],
  zone_admin: [
    '/admin/create-order',
  ],
};

export const ROLE_DEFAULT_ROUTE = {
  super_admin: '/admin/dashboard',
  sub_admin: '/admin/dashboard',
  qr_admin: '/admin/qr-setting',
  zone_admin: '/admin/create-order',
};

export function getDefaultAdminRoute(role) {
  return ROLE_DEFAULT_ROUTE[role] ?? '/admin/dashboard';
}

function matchPattern(pattern, pathname) {
  const regex = new RegExp('^' + pattern.replace(/:[^/]+/g, '[^/]+') + '(/.*)?$');
  return regex.test(pathname);
}

export function canAccessAdminRoute(role, pathname) {
  if (role === 'super_admin') return true;
  const allowed = ROLE_ROUTES[role];
  if (!allowed) return false;
  return allowed.some((pattern) => matchPattern(pattern, pathname));
}
