import { useEffect, useState } from 'react';
import { Play, PhoneIncoming, PhoneOutgoing, PhoneCall, Clock } from 'lucide-react';
import { api, apiBlob } from '../api';
import { fmtDate, fmtDur } from '../format';
import { PageHeader, Spinner, ErrorBox, Modal, Pager } from '../components/ui.jsx';

const Stat = ({ icon: Icon, label, value }) => (
  <div className="card flex items-center gap-4 p-5">
    <span className="grid h-11 w-11 place-items-center rounded-xl bg-navy-100 text-navy"><Icon size={20} /></span>
    <div><p className="text-sm text-slate-500">{label}</p><p className="font-serif text-2xl font-bold text-navy">{value}</p></div>
  </div>
);
const Dir = ({ d }) => <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${d === 'inbound' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>{d}</span>;

function Transcript({ text }) {
  const parts = String(text || '').split(/(?=\b(?:agent|caller):)/i).map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return <p className="text-sm text-slate-500">No transcript available.</p>;
  return (
    <div className="space-y-3">{parts.map((s, i) => {
      const m = s.match(/^(agent|caller):\s*([\s\S]*)$/i); const agent = m && m[1].toLowerCase() === 'agent';
      return (
        <div key={i} className={`flex ${agent ? 'justify-start' : 'justify-end'}`}>
          <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${agent ? 'rounded-tl-sm bg-navy-100 text-navy' : 'rounded-tr-sm bg-slate-100 text-slate-800'}`}>
            <p className="mb-0.5 text-xs font-semibold opacity-70">{agent ? 'Agent' : 'Caller'}</p>{m ? m[2] : s}
          </div>
        </div>
      );
    })}</div>
  );
}

export default function CallLogs() {
  const [d, setD] = useState(null); const [err, setErr] = useState('');
  const [page, setPage] = useState(1); const [direction, setDirection] = useState(''); const [q, setQ] = useState('');
  const [view, setView] = useState(null); const [play, setPlay] = useState(null);
  const [transcript, setTranscript] = useState({ loading: false, text: '', error: '' });
  const [recording, setRecording] = useState({ loading: false, url: '', error: '' });
  useEffect(() => {
    const t = setTimeout(() => api(`/logs?page=${page}&limit=10&direction=${direction}&q=${encodeURIComponent(q)}`).then(setD).catch((e) => setErr(e.message)), q ? 300 : 0);
    return () => clearTimeout(t);
  }, [page, direction, q]);
  useEffect(() => {
    if (!view) return;
    let active = true;
    setTranscript({ loading: true, text: '', error: '' });
    api(`/logs/${view._id}/transcript`).then(({ transcript: text }) => {
      if (active) setTranscript({ loading: false, text, error: '' });
    }).catch((e) => {
      if (active) setTranscript({ loading: false, text: '', error: e.message });
    });
    return () => { active = false; };
  }, [view]);
  useEffect(() => {
    if (!play?.recordingPath) return;
    let active = true; let objectUrl;
    setRecording({ loading: true, url: '', error: '' });
    apiBlob(play.recordingPath).then((blob) => {
      objectUrl = URL.createObjectURL(blob);
      if (active) setRecording({ loading: false, url: objectUrl, error: '' });
      else URL.revokeObjectURL(objectUrl);
    }).catch((e) => {
      if (active) setRecording({ loading: false, url: '', error: e.message });
    });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [play]);
  if (err) return <ErrorBox msg={err} />;
  if (!d) return <Spinner />;
  const th = 'whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-navy'; const td = 'px-4 py-3 align-middle';
  return (
    <>
      <PageHeader title="Call logs" subtitle="Every call handled by your agent" />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={PhoneCall} label="Total calls" value={d.stats.total} />
        <Stat icon={PhoneIncoming} label="Inbound" value={d.stats.inbound} />
        <Stat icon={PhoneOutgoing} label="Outbound" value={d.stats.outbound} />
        <Stat icon={Clock} label="Billed minutes" value={d.stats.talkMinutes.toFixed(1)} />
      </div>
      <div className="mb-4 flex flex-wrap gap-3">
        <select className="input !w-auto" value={direction} onChange={(e) => { setPage(1); setDirection(e.target.value); }}>
          <option value="">All directions</option><option value="inbound">Inbound</option><option value="outbound">Outbound</option>
        </select>
        <input className="input !w-64" placeholder="Search phone number" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} />
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1500px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50"><tr>
              {['Call SID', 'Phone number', 'Direction', 'Started at', 'Ended at', 'Duration', 'Billed seconds', 'Billed minutes', 'Transcript', 'Recording', 'Created at', 'Updated at'].map((h) => <th key={h} className={th}>{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {d.items.length === 0 && <tr><td colSpan={12} className="py-14 text-center text-slate-500">No calls match these filters.</td></tr>}
              {d.items.map((l) => (
                <tr key={l._id} className="hover:bg-slate-50/70">
                  <td className={`${td} font-mono text-xs`}>{l.callSid}</td>
                  <td className={`${td} whitespace-nowrap`}>{l.phoneNumber}</td>
                  <td className={td}><Dir d={l.direction} /></td>
                  <td className={`${td} whitespace-nowrap`}>{fmtDate(l.startedAt)}</td>
                  <td className={`${td} whitespace-nowrap`}>{fmtDate(l.endedAt)}</td>
                  <td className={`${td} whitespace-nowrap`}>{fmtDur(l.durationMs)}</td>
                  <td className={td}>{l.billedSeconds ?? '-'}</td>
                  <td className={td}>{l.billedMinutes != null ? Number(l.billedMinutes).toFixed(2) : '-'}</td>
                  <td className={td}>
                    <div className="flex max-w-[260px] items-center gap-2"><span className="truncate text-slate-600">{l.transcriptPreview || '-'}</span>
                      {l.hasTranscript && <button onClick={() => setView(l)} className="shrink-0 text-xs font-semibold text-maroon hover:underline">View more</button>}</div>
                  </td>
                  <td className={td}>
                    {l.hasRecording ? <button onClick={() => setPlay(l)} className="inline-flex items-center gap-1.5 rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-700"><Play size={12} fill="currentColor" />Play</button> : <span className="text-slate-400">None</span>}
                  </td>
                  <td className={`${td} whitespace-nowrap`}>{fmtDate(l.createdAt)}</td>
                  <td className={`${td} whitespace-nowrap`}>{fmtDate(l.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager page={d.page} pages={d.pages} total={d.total} onPage={setPage} />
      </div>
      {view && <Modal wide title="Full transcript" onClose={() => setView(null)}>
        <p className="mb-4 font-mono text-xs text-slate-500">{view.callSid}</p>
        {transcript.loading
          ? <p className="text-sm text-slate-600">Loading transcript...</p>
          : transcript.error
            ? <p role="alert" className="text-sm text-maroon">{transcript.error}</p>
            : <Transcript text={transcript.text} />}
      </Modal>}
      {play && (
        <Modal title="Call recording" onClose={() => setPlay(null)}>
          <p className="mb-4 font-mono text-xs text-slate-500">{play.callSid}</p>
          {play.recordingUrl
            ? <audio controls autoPlay src={play.recordingUrl} className="w-full" />
            : recording.loading
              ? <p className="text-sm text-slate-600">Loading recording...</p>
              : recording.url
                ? <audio controls autoPlay src={recording.url} className="w-full" onError={() => setRecording({ loading: false, url: '', error: 'The recording audio could not be played.' })} />
                : <p className="text-sm text-slate-600">{recording.error || 'This recording has no playable audio data.'}</p>}
        </Modal>
      )}
    </>
  );
}
