import { useEffect, useState } from 'react';
import Icon from '../Icon';
import { adminApi } from '../../services/adminApi';

export default function PageHistorySidebar({ page, historyKey, actionLabel = 'saved changes' }) {
  const [history, setHistory] = useState(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setHistory(null);
    adminApi.getPageHistory(page).then(setHistory).catch(() => setHistory([]));
  }, [page, historyKey]);

  return (
    <aside
      className={`shrink-0 border-l border-zinc-800 bg-[#0A0A0C] sticky top-0 h-screen overflow-y-auto transition-all duration-200 ${
        open ? 'w-64' : 'w-10'
      }`}
    >
      {/* Toggle button */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-zinc-800/60">
        {open && (
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
            Edit History
          </span>
        )}
        <button
          onClick={() => setOpen((v) => !v)}
          title={open ? 'Collapse history' : 'Show history'}
          className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/60 transition-all ml-auto"
        >
          <Icon
            icon={open ? 'solar:alt-arrow-right-linear' : 'solar:alt-arrow-left-linear'}
            width={14}
          />
        </button>
      </div>

      {open && (
        <div className="px-3 py-3">
          {!history ? (
            <div className="flex items-center gap-2 py-6 text-zinc-600 justify-center">
              <Icon icon="solar:loading-linear" width={14} className="animate-spin" />
              <span className="text-xs">Loading…</span>
            </div>
          ) : history.length === 0 ? (
            <p className="text-xs text-zinc-600 text-center py-6">No history yet.</p>
          ) : (
            <div className="space-y-0.5">
              {history.map((h) => (
                <div key={h.id} className="py-3 border-b border-zinc-800/50 last:border-0">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary-500/15 border border-primary-500/25 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon icon="solar:user-linear" width={11} className="text-primary-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-zinc-300 font-medium truncate">
                        {h.changed_by_name || 'Unknown'}
                      </p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">{actionLabel}</p>
                      <p className="text-[10px] text-zinc-700 font-mono mt-1">
                        {new Date(h.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
