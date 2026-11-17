import { useEffect, useState } from 'react';
import { Mail, Phone, Clock, KeyRound, CheckCircle2 } from 'lucide-react';
import { api } from '../api';
import { PageHeader, Spinner, ErrorBox } from '../components/ui.jsx';

const Field = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 rounded-lg border border-slate-200 p-4">
    <span className="grid h-9 w-9 place-items-center rounded-lg bg-navy-100 text-navy"><Icon size={18} /></span>
    <div className="min-w-0"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="truncate font-semibold text-slate-800">{value || '-'}</p></div>
  </div>
);

export default function Profile() {
  const [p, setP] = useState(null); const [err, setErr] = useState('');
  const [f, setF] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [msg, setMsg] = useState({ ok: false, text: '' }); const [busy, setBusy] = useState(false);
  useEffect(() => { api('/profile').then(setP).catch((e) => setErr(e.message)); }, []);
  if (err) return <ErrorBox msg={err} />;
  if (!p) return <Spinner />;
  const change = async (e) => {
    e.preventDefault(); setMsg({ ok: false, text: '' });
    if (f.newPassword !== f.confirm) return setMsg({ ok: false, text: 'New password and confirmation do not match' });
    setBusy(true);
    try { await api('/auth/change-password', { method: 'POST', body: { currentPassword: f.currentPassword, newPassword: f.newPassword } }); setMsg({ ok: true, text: 'Password changed successfully' }); setF({ currentPassword: '', newPassword: '', confirm: '' }); }
    catch (x) { setMsg({ ok: false, text: x.message }); }
    setBusy(false);
  };
  return (
    <>
      <PageHeader title="Profile" subtitle="Your account details and security" />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="card overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-gray-400 to-gray-700" />
          <div className="px-6 pb-6">
            <div className="-mt-10 mb-5 flex items-end gap-4">
              <span className="grid h-20 w-20 place-items-center rounded-2xl border-4 border-white bg-maroon font-serif text-3xl font-bold text-white shadow">{p.name?.[0]}</span>
              <div className="pb-1"><h2 className="font-serif text-2xl font-bold text-navy">{p.name}</h2><p className="text-sm text-slate-500">Client account</p></div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field icon={Mail} label="Email" value={p.email} />
              <Field icon={Phone} label="Phone number" value={p.phoneNumber} />
              <Field icon={Clock} label="Talktime (minutes)" value={p.talktimeMinutes != null ? Number(p.talktimeMinutes).toFixed(2) : '-'} />
            </div>
          </div>
        </section>
        <section className="card p-6">
          <div className="mb-4 flex items-center gap-2"><KeyRound size={18} className="text-maroon" /><h3 className="font-serif text-lg font-semibold text-navy">Change password</h3></div>
          <form onSubmit={change} className="space-y-4">
            {[['currentPassword', 'Current password', 'current-password'], ['newPassword', 'New password (min 8 characters)', 'new-password'], ['confirm', 'Confirm new password', 'new-password']].map(([k, l, ac]) => (
              <div key={k}><label className="mb-1.5 block text-sm font-semibold">{l}</label>
                <input className="input" type="password" autoComplete={ac} required value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>
            ))}
            {msg.text && <p role="status" className={`flex items-center gap-2 text-sm ${msg.ok ? 'text-emerald-700' : 'text-maroon'}`}>{msg.ok && <CheckCircle2 size={16} />}{msg.text}</p>}
            <button className="btn w-full from-gray-400 to-gray-700" disabled={busy}>{busy ? 'Saving...' : 'Update password'}</button>
          </form>
        </section>
      </div>
    </>
  );
}
