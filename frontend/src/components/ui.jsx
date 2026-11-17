import { useEffect } from 'react';
import { X } from 'lucide-react';

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="font-serif text-3xl font-bold text-navy">{title}</h1>{subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}</div>{children}
    </div>
  );
}
export function Modal({ title, onClose, children, wide }) {
  useEffect(() => { const h = (e) => e.key === 'Escape' && onClose(); addEventListener('keydown', h); return () => removeEventListener('keydown', h); }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-800/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-modal="true" className={`card flex max-h-[85vh] w-full flex-col ${wide ? 'max-w-2xl' : 'max-w-md'}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="font-serif text-lg font-semibold text-navy">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
export function Toggle({ checked, onChange, label, hint }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div><p className="font-semibold text-slate-800">{label}</p>{hint && <p className="text-sm text-slate-500">{hint}</p>}</div>
      <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon focus-visible:ring-offset-2 ${checked ? 'bg-navy' : 'bg-slate-300'}`}>
        <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}
export const Spinner = () => <div className="py-16 text-center text-sm text-slate-500">Loading...</div>;
export const ErrorBox = ({ msg }) => <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{msg}</div>;
export function Pager({ page, pages, total, onPage }) {
  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
      <span>{total} records</span>
      <div className="flex items-center gap-2">
        <button className="btn-ghost !py-1.5" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
        <span>Page {page} of {pages}</span>
        <button className="btn-ghost !py-1.5" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}
