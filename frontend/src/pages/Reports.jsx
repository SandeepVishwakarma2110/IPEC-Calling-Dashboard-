import { useEffect, useState } from 'react';
import { Download, FileText, PhoneCall, PhoneIncoming, PhoneOutgoing, Clock, Timer, ChevronDown } from 'lucide-react';
import { api } from '../api';
import { PageHeader, Spinner, ErrorBox } from '../components/ui.jsx';

const istToday = () => new Date(Date.now() + 19800000).toISOString().slice(0, 10);
const daysAgo = (n) => new Date(Date.now() + 19800000 - n * 864e5).toISOString().slice(0, 10);
const label = (d) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const stamp = (d) => new Date(d).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const hourLabel = (h) => `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`;
const mmss = (s) => `${Math.floor(s / 60)}m ${String(Math.round(s % 60)).padStart(2, '0')}s`;
const PRESETS = [[7, 'Last 7 days'], [30, 'Last 30 days'], [90, 'Last 90 days']];

const Stat = ({ icon: Icon, label: l, value }) => (
  <div className="card flex items-center gap-4 p-5">
    <span className="grid h-11 w-11 place-items-center rounded-xl bg-navy-100 text-navy"><Icon size={20} /></span>
    <div><p className="text-sm text-slate-500">{l}</p><p className="font-serif text-2xl font-bold text-navy">{value}</p></div>
  </div>
);
const Legend = () => (
  <div className="flex gap-4 text-xs text-slate-600">
    <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-sm bg-navy" />Inbound</span>
    <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded-sm bg-gold" />Outbound</span>
  </div>
);

export default function Reports() {
  const [from, setFrom] = useState(daysAgo(29)); const [to, setTo] = useState(istToday());
  const [preset, setPreset] = useState(30);
  const [d, setD] = useState(null); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState('');

  useEffect(() => {
    if (!from || !to || from > to) return;
    setErr('');
    api(`/reports?from=${from}&to=${to}`).then(setD).catch((e) => setErr(e.message));
  }, [from, to]);

  const pick = (n) => { setPreset(n); setFrom(daysAgo(n - 1)); setTo(istToday()); };

  const downloadCsv = () => {
    const rows = [['Date', 'Inbound', 'Outbound', 'Total', 'Billed minutes'], ...d.days.map((x) => [x.date, x.inbound, x.outbound, x.total, x.minutes.toFixed(2)]),
      [], ['Purpose', 'Calls', 'Inbound', 'Outbound'], ...d.purposes.map((p) => [p.label, p.count, p.inbound, p.outbound]),
      [], ['Purpose', 'Phone number', 'Calls', 'Last call'], ...d.purposes.flatMap((p) => p.callers.map((c) => [p.label, c.phone, c.calls, stamp(c.lastAt)]))];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `IPEC-call-report-${d.from}-to-${d.to}.csv`; a.click(); URL.revokeObjectURL(a.href);
  };

  const downloadPdf = async () => {
    setBusy(true);
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
      const doc = new jsPDF(); const head = { fillColor: [27, 42, 74] }; const t = d.totals;
      doc.setFontSize(17); doc.setTextColor(27, 42, 74); doc.text('Inderprastha Engineering College', 14, 18);
      doc.setFontSize(11); doc.setTextColor(90); doc.text(`Call report: ${label(d.from)} to ${label(d.to)}`, 14, 26);
      autoTable(doc, { startY: 32, head: [['Summary', 'Value']], headStyles: head, theme: 'grid',
        body: [['Total calls', t.calls], ['Inbound calls', t.inbound], ['Outbound calls', t.outbound], ['Billed minutes', t.minutes.toFixed(1)], ['Average call length', mmss(t.avgSeconds)]] });
      autoTable(doc, { startY: doc.lastAutoTable.finalY + 8, head: [['Purpose of call', 'Calls', 'Inbound', 'Outbound', 'Share']], headStyles: head, theme: 'grid',
        body: d.purposes.map((p) => [p.label, p.count, p.inbound, p.outbound, `${Math.round((p.count / (t.calls || 1)) * 100)}%`]) });
      autoTable(doc, { startY: doc.lastAutoTable.finalY + 8, head: [['Purpose of call', 'Phone number', 'Calls', 'Last call']], headStyles: head, theme: 'striped',
        body: d.purposes.flatMap((p) => p.callers.map((c) => [p.label, c.phone, c.calls, stamp(c.lastAt)])) });
      autoTable(doc, { startY: doc.lastAutoTable.finalY + 8, head: [['Date', 'Inbound', 'Outbound', 'Total', 'Billed min']], headStyles: head, theme: 'striped',
        body: [...d.days].reverse().map((x) => [label(x.date), x.inbound, x.outbound, x.total, x.minutes.toFixed(1)]) });
      doc.save(`IPEC-call-report-${d.from}-to-${d.to}.pdf`);
    } catch { setErr('Could not create the PDF. Please try again.'); }
    setBusy(false);
  };

  const max = d ? Math.max(1, ...d.days.map((x) => x.total)) : 1;
  const step = d ? Math.ceil(d.days.length / 10) : 1;
  const maxP = d ? Math.max(1, ...d.purposes.map((p) => p.count)) : 1;
  const maxH = d ? Math.max(1, ...d.hours) : 1;
  const peak = d ? d.hours.indexOf(Math.max(...d.hours)) : 0;

  return (
    <>
      <PageHeader title="Reports" subtitle="Day-wise calls and the reason people called">
        <div className="flex gap-2">
          <button className="btn-ghost" disabled={!d} onClick={downloadCsv}><Download size={16} />CSV</button>
          <button className="btn" disabled={!d || busy} onClick={downloadPdf}><FileText size={16} />{busy ? 'Preparing...' : 'Download PDF'}</button>
        </div>
      </PageHeader>

      <div className="card mb-6 flex flex-wrap items-end gap-3 p-4">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(([n, l]) => (
            <button key={n} onClick={() => pick(n)} className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${preset === n ? 'border-navy bg-navy text-white' : 'border-slate-300 text-navy hover:bg-slate-50'}`}>{l}</button>
          ))}
        </div>
        <div className="ml-auto flex items-end gap-3">
          <div><label className="mb-1 block text-xs font-semibold text-slate-500">From</label><input type="date" className="input" max={to} value={from} onChange={(e) => { setPreset(0); setFrom(e.target.value); }} /></div>
          <div><label className="mb-1 block text-xs font-semibold text-slate-500">To</label><input type="date" className="input" min={from} value={to} onChange={(e) => { setPreset(0); setTo(e.target.value); }} /></div>
        </div>
      </div>

      {err && <div className="mb-4"><ErrorBox msg={err} /></div>}
      {!d && !err && <Spinner />}
      {d && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Stat icon={PhoneCall} label="Total calls" value={d.totals.calls} />
            <Stat icon={PhoneIncoming} label="Inbound" value={d.totals.inbound} />
            <Stat icon={PhoneOutgoing} label="Outbound" value={d.totals.outbound} />
            <Stat icon={Clock} label="Billed minutes" value={d.totals.minutes.toFixed(1)} />
            <Stat icon={Timer} label="Avg call length" value={mmss(d.totals.avgSeconds)} />
          </div>

          <section className="card p-6">
            <div className="mb-4 flex items-center justify-between"><h3 className="font-serif text-lg font-semibold text-navy">Calls per day</h3><Legend /></div>
            <div className="flex">
              <span className="mr-2 w-6 text-right text-xs text-slate-400">{max}</span>
              <div className="flex-1">
                <div className="flex h-56 items-end gap-[3px] border-b border-slate-200">
                  {d.days.map((x) => (
                    <div key={x.date} title={`${label(x.date)}: ${x.inbound} inbound, ${x.outbound} outbound`} className="flex h-full min-w-0 flex-1 flex-col justify-end hover:opacity-80">
                      <div className="bg-gold" style={{ height: `${(x.outbound / max) * 100}%` }} />
                      <div className="rounded-t-sm bg-navy" style={{ height: `${(x.inbound / max) * 100}%` }} />
                    </div>
                  ))}
                </div>
                <div className="mt-1.5 flex gap-[3px]">
                  {d.days.map((x, i) => <span key={x.date} className="min-w-0 flex-1 overflow-visible whitespace-nowrap text-[10px] text-slate-500">{i % step === 0 ? label(x.date) : ''}</span>)}
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="card p-6">
              <div className="mb-1 flex items-center justify-between"><h3 className="font-serif text-lg font-semibold text-navy">Why people called</h3><Legend /></div>
              <p className="mb-4 text-sm text-slate-500">Click a reason to see the phone numbers</p>
              {d.purposes.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No calls in this period.</p>}
              <div className="space-y-2">
                {d.purposes.map((p) => {
                  const isOpen = open === p.label;
                  return (
                    <div key={p.label} className={`rounded-lg border transition ${isOpen ? 'border-navy/30 bg-slate-50' : 'border-transparent'}`}>
                      <button onClick={() => setOpen(isOpen ? '' : p.label)} aria-expanded={isOpen} className="w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50">
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1.5 font-semibold text-slate-800"><ChevronDown size={16} className={`text-slate-400 transition ${isOpen ? 'rotate-180' : ''}`} />{p.label}</span>
                          <span className="text-slate-500">{p.count} ({Math.round((p.count / (d.totals.calls || 1)) * 100)}%)</span>
                        </div>
                        <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100" style={{ width: `${(p.count / maxP) * 100}%` }}>
                          <div className="bg-navy" style={{ width: `${(p.inbound / p.count) * 100}%` }} /><div className="bg-gold" style={{ width: `${(p.outbound / p.count) * 100}%` }} />
                        </div>
                      </button>
                      {isOpen && (
                        <div className="px-3 pb-3">
                          <p className="mb-2 mt-1 text-xs font-semibold text-slate-500">{p.callers.length} phone number{p.callers.length === 1 ? '' : 's'}</p>
                          <ul className="max-h-60 divide-y divide-slate-200 overflow-y-auto rounded-md border border-slate-200 bg-white text-sm">
                            {p.callers.map((c) => (
                              <li key={c.phone} className="flex items-center justify-between gap-3 px-3 py-2">
                                <span className="font-medium text-slate-800">{c.phone}</span>
                                <span className="text-right text-xs text-slate-500"><b className="text-navy">{c.calls}</b> call{c.calls === 1 ? '' : 's'} &middot; last {stamp(c.lastAt)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="card p-6">
              <div className="mb-1 flex items-center justify-between"><h3 className="font-serif text-lg font-semibold text-navy">Busiest hours</h3></div>
              <p className="mb-4 text-sm text-slate-500">{d.totals.calls ? `Most calls happen around ${hourLabel(peak)}` : 'No calls in this period'}</p>
              <div className="flex h-40 items-end gap-1 border-b border-slate-200">
                {d.hours.map((c, h) => <div key={h} title={`${hourLabel(h)}: ${c} calls`} className={`flex-1 rounded-t-sm ${h === peak && c ? 'bg-maroon' : 'bg-navy/70'}`} style={{ height: `${(c / maxH) * 100}%` }} />)}
              </div>
              <div className="mt-1.5 flex justify-between text-[10px] text-slate-500">{[0, 6, 12, 18, 23].map((h) => <span key={h}>{hourLabel(h)}</span>)}</div>
              <h4 className="mb-2 mt-6 text-sm font-semibold text-navy">Top repeat callers</h4>
              {d.topCallers.length === 0 ? <p className="text-sm text-slate-500">No repeat callers in this period.</p> : (
                <ul className="divide-y divide-slate-100 text-sm">
                  {d.topCallers.map((c) => <li key={c.phone} className="flex justify-between py-2"><span>{c.phone}</span><span className="font-semibold text-navy">{c.calls} calls</span></li>)}
                </ul>
              )}
            </section>
          </div>

          <section className="card overflow-hidden">
            <h3 className="border-b border-slate-200 px-6 py-4 font-serif text-lg font-semibold text-navy">Day-wise report</h3>
            <div className="max-h-96 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50"><tr>{['Date', 'Inbound', 'Outbound', 'Total', 'Billed minutes'].map((h) => <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-navy">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {[...d.days].reverse().map((x) => (
                    <tr key={x.date} className="hover:bg-slate-50/70"><td className="px-6 py-2.5 font-medium">{label(x.date)}</td><td className="px-6 py-2.5">{x.inbound}</td><td className="px-6 py-2.5">{x.outbound}</td><td className="px-6 py-2.5 font-semibold">{x.total}</td><td className="px-6 py-2.5">{x.minutes.toFixed(1)}</td></tr>
                  ))}
                </tbody>
                <tfoot className="sticky bottom-0 bg-slate-50 font-semibold text-navy"><tr><td className="px-6 py-3">Total</td><td className="px-6 py-3">{d.totals.inbound}</td><td className="px-6 py-3">{d.totals.outbound}</td><td className="px-6 py-3">{d.totals.calls}</td><td className="px-6 py-3">{d.totals.minutes.toFixed(1)}</td></tr></tfoot>
              </table>
            </div>
          </section>
        </div>
      )}
    </>
  );
}