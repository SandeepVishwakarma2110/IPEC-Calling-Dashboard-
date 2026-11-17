import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { api } from '../api';
import { DAYS } from '../format';
import { PageHeader, Spinner, ErrorBox, Toggle } from '../components/ui.jsx';

function Hours({ title, v, set, time }) {
  const flip = (i) => set({ ...v, days: v.days.includes(i) ? v.days.filter((x) => x !== i) : [...v.days, i].sort() });
  return (
    <div className="card p-6">
      <h3 className="font-serif text-lg font-semibold text-navy">{title}</h3>
      <Toggle label="All day" hint="Accept calls at any time on the selected days" checked={v.allDay} onChange={(allDay) => set({ ...v, allDay })} />
      <p className="mb-2 text-sm font-semibold">Active days</p>
      <div className="flex gap-1.5">{DAYS.map((d, i) => (
        <button key={d} type="button" aria-pressed={v.days.includes(i)} onClick={() => flip(i)}
          className={`flex-1 rounded-md border py-2 text-xs font-semibold transition ${v.days.includes(i) ? 'border-navy bg-navy text-white' : 'border-slate-300 text-slate-500 hover:bg-slate-50'}`}>{d}</button>))}
      </div>
      {time && (
        <div className="mt-5 grid grid-cols-2 gap-4">
          {[['start', 'From'], ['end', 'To']].map(([k, l]) => (
            <div key={k}><label className="mb-1.5 block text-sm font-semibold">{l}</label>
              <input type="time" className="input disabled:bg-slate-100 disabled:text-slate-400" disabled={v.allDay} value={v[k] || ''} onChange={(e) => set({ ...v, [k]: e.target.value })} /></div>))}
        </div>
      )}
    </div>
  );
}

export default function Settings() {
  const [saved, setSaved] = useState(null); const [f, setF] = useState(null); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const [ok, setOk] = useState(false);
  const norm = (d) => ({ agentActive: !!d.agentActive, isActiveIncoming: !!d.isActiveIncoming, isActiveOutbound: !!d.isActiveOutbound,
    hours: { inbound: { allDay: !!d.hours?.inbound?.allDay, days: d.hours?.inbound?.days || [] }, outbound: { allDay: !!d.hours?.outbound?.allDay, days: d.hours?.outbound?.days || [], start: d.hours?.outbound?.start || '', end: d.hours?.outbound?.end || '' } } });
  useEffect(() => { api('/settings').then((d) => { setSaved(norm(d)); setF(norm(d)); }).catch((e) => setErr(e.message)); }, []);
  if (err) return <ErrorBox msg={err} />;
  if (!f) return <Spinner />;
  const dirty = JSON.stringify(f) !== JSON.stringify(saved);
  const save = async () => {
    setBusy(true); setErr('');
    try { const d = norm(await api('/settings', { method: 'PATCH', body: f })); setSaved(d); setF(d); setOk(true); setTimeout(() => setOk(false), 2500); } catch (x) { setErr(x.message); }
    setBusy(false);
  };
  return (
    <>
      <PageHeader title="Settings" subtitle="Control your agent and calling hours">
        <div className="flex items-center gap-3">
          {ok && <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700"><CheckCircle2 size={16} />Saved</span>}
          <button className="btn-ghost" disabled={!dirty || busy} onClick={() => setF(saved)}>Discard</button>
          <button className="btn" disabled={!dirty || busy} onClick={save}>{busy ? 'Saving...' : 'Save changes'}</button>
        </div>
      </PageHeader>
      {err && <div className="mb-4"><ErrorBox msg={err} /></div>}
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card divide-y divide-slate-100 px-6 py-3 xl:col-span-2">
          <Toggle label="Agent active" hint="Turn the voice agent on or off" checked={f.agentActive} onChange={(v) => setF({ ...f, agentActive: v })} />
          <Toggle label="Incoming calls" hint="Let the agent answer inbound calls" checked={f.isActiveIncoming} onChange={(v) => setF({ ...f, isActiveIncoming: v })} />
          <Toggle label="Outgoing calls" hint="Let the agent place outbound calls" checked={f.isActiveOutbound} onChange={(v) => setF({ ...f, isActiveOutbound: v })} />
        </div>
        <Hours title="Inbound hours" v={f.hours.inbound} set={(v) => setF({ ...f, hours: { ...f.hours, inbound: v } })} />
        <Hours time title="Outbound hours" v={f.hours.outbound} set={(v) => setF({ ...f, hours: { ...f.hours, outbound: v } })} />
      </div>
    </>
  );
}
