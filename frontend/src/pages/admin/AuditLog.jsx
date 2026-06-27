import { useCallback, useEffect, useState } from 'react';
import Icon from '../../components/Icon';
import { adminApi } from '../../services/adminApi';

const LIMIT = 50;

const ACTION_LABELS = {
  'user.login':               'Login',
  'contact.status_update':    'Status Updated',
  'contact.bulk_status_update': 'Bulk Status Update',
  'contact.delete':           'Contact Deleted',
  'newsletter.delete':        'Subscriber Deleted',
  'service.create':           'Service Created',
  'service.update':           'Service Updated',
  'service.delete':           'Service Deleted',
  'service.toggle_enabled':   'Service Toggled',
  'admin_user.create':        'User Created',
  'admin_user.update':        'User Updated',
  'admin_user.delete':        'User Deleted',
  'permission.update':        'Permission Changed',
  'permission.bulk_update':   'Permissions Bulk Updated',
};

const ACTION_ICONS = {
  'user.login':               { icon: 'solar:login-3-linear',                  color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  'contact.status_update':    { icon: 'solar:tag-linear',                       color: 'text-indigo-400',  bg: 'bg-indigo-500/10'  },
  'contact.bulk_status_update':{ icon: 'solar:tag-linear',                      color: 'text-indigo-400',  bg: 'bg-indigo-500/10'  },
  'contact.delete':           { icon: 'solar:trash-bin-minimalistic-linear',    color: 'text-rose-400',    bg: 'bg-rose-500/10'    },
  'newsletter.delete':        { icon: 'solar:trash-bin-minimalistic-linear',    color: 'text-rose-400',    bg: 'bg-rose-500/10'    },
  'service.create':           { icon: 'solar:add-circle-linear',               color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  'service.update':           { icon: 'solar:pen-linear',                       color: 'text-amber-400',   bg: 'bg-amber-500/10'   },
  'service.delete':           { icon: 'solar:trash-bin-minimalistic-linear',    color: 'text-rose-400',    bg: 'bg-rose-500/10'    },
  'service.toggle_enabled':   { icon: 'solar:eye-linear',                       color: 'text-sky-400',     bg: 'bg-sky-500/10'     },
  'admin_user.create':        { icon: 'solar:user-plus-rounded-linear',         color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  'admin_user.update':        { icon: 'solar:user-check-rounded-linear',        color: 'text-amber-400',   bg: 'bg-amber-500/10'   },
  'admin_user.delete':        { icon: 'solar:user-minus-rounded-linear',        color: 'text-rose-400',    bg: 'bg-rose-500/10'    },
  'permission.update':        { icon: 'solar:shield-keyhole-linear',            color: 'text-violet-400',  bg: 'bg-violet-500/10'  },
  'permission.bulk_update':   { icon: 'solar:shield-keyhole-linear',            color: 'text-violet-400',  bg: 'bg-violet-500/10'  },
};

const OBJECT_TYPE_LABELS = {
  contact:    'Contact',
  newsletter: 'Subscriber',
  service:    'Service',
  admin_user: 'User',
  permission: 'Permission',
};

const ALL_ACTIONS = Object.keys(ACTION_LABELS);
const OBJECT_TYPES = Object.keys(OBJECT_TYPE_LABELS);

function useDebounce(v, d = 300) {
  const [dv, setDv] = useState(v);
  useEffect(() => { const t = setTimeout(() => setDv(v), d); return () => clearTimeout(t); }, [v, d]);
  return dv;
}

function ActionBadge({ action }) {
  const cfg = ACTION_ICONS[action] || { icon: 'solar:info-circle-linear', color: 'text-zinc-400', bg: 'bg-zinc-700/40' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-medium ${cfg.bg} ${cfg.color}`}>
      <Icon icon={cfg.icon} width={11} />
      {ACTION_LABELS[action] || action}
    </span>
  );
}

function DetailsPopover({ details }) {
  const [open, setOpen] = useState(false);
  if (!details) return <span className="text-zinc-700 text-xs">—</span>;
  const str = JSON.stringify(details, null, 2);
  return (
    <div className="relative inline-block">
      <button onClick={() => setOpen((o) => !o)}
        className="text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors">
        view
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <pre className="absolute z-40 left-0 top-full mt-1 w-64 max-h-48 overflow-auto bg-[#18181B] border border-zinc-700 rounded-xl p-3 text-[10px] text-zinc-300 shadow-2xl whitespace-pre-wrap font-mono">
            {str}
          </pre>
        </>
      )}
    </div>
  );
}

export default function AuditLog() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterObject, setFilterObject] = useState('');
  const debouncedAction = useDebounce(filterAction);
  const debouncedObject = useDebounce(filterObject);

  const load = useCallback(() => {
    setError('');
    adminApi.auditLogs({
      page,
      limit: LIMIT,
      ...(debouncedAction ? { action: debouncedAction } : {}),
      ...(debouncedObject ? { objectType: debouncedObject } : {}),
    })
      .then(setData)
      .catch((err) => setError(err.message));
  }, [page, debouncedAction, debouncedObject]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [debouncedAction, debouncedObject]);

  const rows = data?.data ?? [];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-semibold text-2xl text-zinc-100">Audit Log</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {data ? `${data.pagination.total.toLocaleString()} events · limited to most recent 10 000` : '—'}
          </p>
        </div>
        <button onClick={load}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70 border border-zinc-800 transition-all self-start sm:self-auto">
          <Icon icon="solar:refresh-linear" width={13} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)}
          className="bg-[#18181B] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/50 min-w-[180px]">
          <option value="">All actions</option>
          {ALL_ACTIONS.map((a) => <option key={a} value={a}>{ACTION_LABELS[a]}</option>)}
        </select>
        <select value={filterObject} onChange={(e) => setFilterObject(e.target.value)}
          className="bg-[#18181B] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500/50 min-w-[150px]">
          <option value="">All object types</option>
          {OBJECT_TYPES.map((t) => <option key={t} value={t}>{OBJECT_TYPE_LABELS[t]}</option>)}
        </select>
        {(filterAction || filterObject) && (
          <button onClick={() => { setFilterAction(''); setFilterObject(''); }}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-700 transition-all">
            <Icon icon="solar:close-circle-linear" width={13} />
            Clear
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-sm text-rose-400">{error}</div>
      )}

      <div className="bg-[#111113] border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#18181B] border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider whitespace-nowrap">Timestamp</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Action</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider whitespace-nowrap">Object</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">By</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {!data ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-zinc-600">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-zinc-600">No events found.</td></tr>
              ) : rows.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-800/20 transition-colors">
                  <td className="px-4 py-3 text-zinc-500 font-mono text-xs whitespace-nowrap">
                    <span title={new Date(row.created_at).toISOString()}>
                      {new Date(row.created_at).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <ActionBadge action={row.action} />
                  </td>
                  <td className="px-4 py-3">
                    {row.object_label ? (
                      <div>
                        <p className="text-zinc-200 text-xs font-medium">{row.object_label}</p>
                        {row.object_type && (
                          <p className="text-zinc-600 text-[10px]">{OBJECT_TYPE_LABELS[row.object_type] || row.object_type}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-700 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-zinc-300 text-xs font-medium">{row.user_name || '—'}</p>
                      {row.user_email && <p className="text-zinc-600 text-[10px]">{row.user_email}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <DetailsPopover details={row.details} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data && data.pagination.pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-zinc-400">
          <span className="text-xs font-mono text-zinc-600">
            Page {data.pagination.page} of {data.pagination.pages}
          </span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg bg-[#18181B] border border-zinc-800 hover:border-zinc-600 transition-all disabled:opacity-40 text-xs">
              Previous
            </button>
            <button onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))} disabled={page === data.pagination.pages}
              className="px-3 py-1.5 rounded-lg bg-[#18181B] border border-zinc-800 hover:border-zinc-600 transition-all disabled:opacity-40 text-xs">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
