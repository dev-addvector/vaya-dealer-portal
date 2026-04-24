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
    <div className="bg-vaya-green rounded-[10px] py-6 px-5 w-full">
      <h3 className="text-white text-[18px] sm:text-[18px] font-normal mb-[18px] leading-[1.3]">
        Useful Links
      </h3>
      <ul className="list-none p-0 m-0">
        {links.map(({ to, label }) => {
          const active = pathname === to;
          return (
            <li
              key={to}
              onClick={() => navigate(to)}
              className="py-[12px] cursor-pointer border-b border-[rgba(255,255,255,0.25)] flex items-center gap-2"
            >
              <span className="text-white text-[12px] shrink-0">›</span>
              <span className={`text-white text-[14px] ${active ? 'font-bold' : 'font-normal'}`}>{label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
