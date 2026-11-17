import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { UserCircle, PhoneCall, ShieldCheck, BarChart3, Settings as Cog, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../auth.jsx';

const nav = [['/call-logs', 'Call logs', PhoneCall], ['/audit-logs', 'Audit logs', ShieldCheck], ['/reports', 'Reports', BarChart3], ['/settings', 'Settings', Cog]];

export default function Layout() {
  const { client, logout } = useAuth(); const go = useNavigate();
  const [open, setOpen] = useState(false); const ref = useRef();
  useEffect(() => {
    const h = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.documentElement.classList.add('dashboard-no-scrollbars');
    addEventListener('click', h);
    return () => {
      document.documentElement.classList.remove('dashboard-no-scrollbars');
      removeEventListener('click', h);
    };
  }, []);
  const out = async () => { await logout(); go('/login'); };
  const link = ({ isActive }) => `flex items-center gap-3 rounded-lg border-l-[3px] px-3.5 py-2.5 text-sm font-medium transition ${isActive ? 'border-gold bg-white/10 text-white' : 'border-transparent text-slate-300 hover:bg-white/5 hover:text-white'}`;
  return (
    <div className="min-h-screen">
      <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b-[3px] border-maroon bg-white px-4 sm:px-6">
        <img src="/college-logo-1.png" alt="Inderprastha Engineering College" className="h-11 w-auto" />
        <div className="flex items-center gap-2">
          <NavLink to="/settings" aria-label="Settings" className="rounded-full p-2 text-navy hover:bg-slate-100"><Cog size={20} /></NavLink>
          <div ref={ref} className="relative">
            <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3 hover:bg-slate-50">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-navy text-sm font-bold text-white">{client.name?.[0]?.toUpperCase()}</span>
              <span className="hidden max-w-[160px] truncate text-sm font-semibold text-navy sm:block">{client.name}</span><ChevronDown size={16} className="text-slate-500" />
            </button>
            {open && (
              <div className="card absolute right-0 mt-2 w-64 p-2 shadow-lg">
                <div className="border-b border-slate-100 px-3 py-2"><p className="truncate text-sm font-semibold text-navy">{client.name}</p><p className="truncate text-xs text-slate-500">{client.email}</p></div>
                <NavLink to="/profile" onClick={() => setOpen(false)} className="mt-1 flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-slate-50"><UserCircle size={16} />My profile</NavLink>
                <button onClick={out} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-maroon hover:bg-red-50"><LogOut size={16} />Sign out</button>
              </div>
            )}
          </div>
        </div>
      </header>
      <aside className="fixed bottom-0 left-0 top-[67px] hidden w-60 flex-col gap-1 bg-navy p-4 lg:flex">
        <p className="px-3.5 pb-2 pt-1 text-xs font-semibold text-slate-400">Menu</p>
        {nav.map(([to, label, Icon]) => <NavLink key={to} to={to} className={link}><Icon size={18} />{label}</NavLink>)}
      </aside>
      <nav className="fixed inset-x-0 top-[67px] z-20 flex gap-1 overflow-x-auto bg-navy p-2 lg:hidden">
        {nav.map(([to, label, Icon]) => <NavLink key={to} to={to} className={link}><Icon size={16} />{label}</NavLink>)}
      </nav>
      <main className="px-4 pb-12 pt-[130px] sm:px-8 lg:ml-60 lg:pt-[96px]"><Outlet /></main>
    </div>
  );
}
