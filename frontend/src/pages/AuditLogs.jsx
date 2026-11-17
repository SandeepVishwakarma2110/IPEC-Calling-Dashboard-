import { useEffect, useState } from 'react';
import { LogIn, LogOut, KeyRound, SlidersHorizontal } from 'lucide-react';
import { api } from '../api';
import { fmtDate, DAYS } from '../format';
import { PageHeader, Spinner, ErrorBox, Pager } from '../components/ui.jsx';

const LABEL = { agentActive: 'Agent', isActiveIncoming: 'Incoming calls', isActiveOutbound: 'Outgoing calls', 'hours.inbound': 'Inbound hours', 'hours.outbound': 'Outbound hours' };
const parse = (v) => { try { return JSON.parse(v); } catch { return v; } };
const hrs = (h) => (h && typeof h === 'object' ? `${h.allDay ? 'All day' : `${h.start || ''} - ${h.end || ''}`} on ${(h.days || []).map((i) => DAYS[i]).join(', ') || 'no days'}` : '-');

function describe(a) {
  if (a.action === 'client.login') return { Icon: LogIn, tone: 'bg-emerald-50 text-emerald-700', title: 'Signed in' };
  if (a.action === 'client.logout') return { Icon: LogOut, tone: 'bg-slate-100 text-slate-600', title: 'Signed out' };
  if (a.action === 'password.changed') return { Icon: KeyRound, tone: 'bg-amber-50 text-amber-700', title: 'Changed password' };
  const b = parse(a.before), n = parse(a.after), name = LABEL[a.field] || a.field;
  if (typeof n === 'boolean') return { Icon: SlidersHorizontal, tone: 'bg-blue-50 text-blue-700', title: `${name} turned ${n ? 'on' : 'off'}`, detail: `Was ${b ? 'on' : 'off'}` };
  return { Icon: SlidersHorizontal, tone: 'bg-blue-50 text-blue-700', title: `${name} updated`, detail: `${hrs(b)}  \u2192  ${hrs(n)}` };
}
const TABS = [['', 'All activity'], ['auth', 'Sign-ins and security'], ['changes', 'Setting changes']];

export default function AuditLogs() {
  const [d, setD] = useState(null); const [err, setErr] = useState(''); const [page, setPage] = useState(1); const [type, setType] = useState('');
  useEffect(() => { api(`/audit-logs?page=${page}&limit=15&type=${type}`).then(setD).catch((e) => setErr(e.message)); }, [page, type]);
  if (err) return <ErrorBox msg={err} />;
  return (
    <>
      <PageHeader title="Audit logs" subtitle="Sign-in and sign-out times, and what you changed" />
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map(([v, l]) => <button key={v} onClick={() => { setPage(1); setType(v); }} className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${type === v ? 'border-navy bg-navy text-white' : 'border-slate-300 bg-white text-navy hover:bg-slate-50'}`}>{l}</button>)}
      </div>
      {!d ? <Spinner /> : (
        <div className="card overflow-hidden">
          {d.items.length === 0 && <p className="py-14 text-center text-sm text-slate-500">No activity recorded yet.</p>}
          <ul className="divide-y divide-slate-100">
            {d.items.map((a) => { const { Icon, tone, title, detail } = describe(a); return (
              <li key={a._id} className="flex items-start gap-4 px-5 py-4">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${tone}`}><Icon size={18} /></span>
                <div className="min-w-0 flex-1"><p className="font-semibold text-slate-800">{title}</p>{detail && <p className="text-sm text-slate-500">{detail}</p>}</div>
                <div className="text-right text-sm"><p className="font-medium text-slate-700">{fmtDate(a.createdAt)}</p>{a.actorIp && <p className="text-xs text-slate-400">{a.actorIp}</p>}</div>
              </li>); })}
          </ul>
          <Pager page={d.page} pages={d.pages} total={d.total} onPage={setPage} />
        </div>
      )}
    </>
  );
}
