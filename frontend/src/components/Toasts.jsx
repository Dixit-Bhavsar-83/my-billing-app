import React from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';

const ICONS = {
  success: <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />,
  error:   <XCircle    size={16} className="text-red-400    flex-shrink-0" />,
  info:    <Info       size={16} className="text-indigo-400 flex-shrink-0" />,
};

export default function Toasts({ toasts }) {
  return (
    <div className="fixed bottom-6 right-4 z-[999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className="animate-slide-up flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl text-sm text-slate-200 max-w-xs"
        >
          {ICONS[t.type] || ICONS.info}
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
