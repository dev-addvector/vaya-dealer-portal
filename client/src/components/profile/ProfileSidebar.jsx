import { useLocation, useNavigate } from 'react-router-dom';

const links = [
  { to: '/profile/reset-password',      label: 'Reset Password' },
  { to: '/profile/reset-auth-password', label: 'Reset Authorization Password' },
  { to: '/addresses',                   label: 'Reset Default Address' },
  { to: '/contacts',                    label: 'Reset Default Contact' },
];

export default function ProfileSidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <div style={{ background: '#AEC148', borderRadius: '8px', padding: '24px 20px', minWidth: '220px' }}>
      <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 400, marginBottom: '18px', lineHeight: 1.3 }}>
        Useful Links
      </h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {links.map(({ to, label }) => {
          const active = pathname === to;
          return (
            <li key={to}
              onClick={() => navigate(to)}
              style={{ padding: '10px 0', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span style={{ color: '#fff', fontSize: '12px', flexShrink: 0 }}>›</span>
              <span style={{ color: '#fff', fontSize: '14px', fontWeight: active ? 700 : 400 }}>{label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
