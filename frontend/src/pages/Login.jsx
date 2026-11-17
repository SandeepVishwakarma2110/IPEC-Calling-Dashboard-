import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../auth.jsx';

export default function Login() {
  const { client, login } = useAuth(); const go = useNavigate();
  const [f, setF] = useState({ email: '', password: '' }); const [show, setShow] = useState(false);
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  if (client) return <Navigate to="/call-logs" replace />;
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await login(f.email, f.password); go('/call-logs'); } catch (x) { setErr(x.message); setBusy(false); }
  };
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1.15fr_1fr]">
      <section className="hidden flex-col justify-center bg-gradient-to-br from-navy-800 to-navy px-10 xl:px-16 lg:flex">
        <img src="/college-image.png" alt="IPEC students and staff" className="w-full rounded-xl shadow-2xl ring-1 ring-white/20" />
        <h2 className="mt-8 font-serif text-3xl font-bold text-white">Call Management Console</h2>
        <p className="mt-3 max-w-lg leading-relaxed text-slate-300">Review call logs, track account activity and manage your agent settings for Inderprastha Engineering College.</p>
        <div className="mt-6 h-1 w-16 rounded bg-gold" />
      </section>
      <main className="flex items-center justify-center px-6 py-10">
        <form onSubmit={submit} className="w-full max-w-sm">
          <img src="/college-logo-1.png" alt="Inderprastha Engineering College" className="mb-10 w-full max-w-[340px]" />
          <h1 className="font-serif text-3xl font-bold text-navy">Sign in</h1>
          <p className="mb-6 mt-1 text-sm text-slate-500">Use the email and password of your client account.</p>
          <label className="mb-1.5 block text-sm font-semibold">Email</label>
          <input className="input" type="email" autoComplete="username" required autoFocus value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <label className="mb-1.5 mt-4 block text-sm font-semibold">Password</label>
          <div className="relative">
            <input className="input pr-11" type={show ? 'text' : 'password'} autoComplete="current-password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </div>
          <p role="alert" className="mt-3 min-h-[20px] text-sm text-maroon">{err}</p>
          <button className="btn mt-2 w-full" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
        </form>
      </main>
    </div>
  );
}
