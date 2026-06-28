import { useCallback, useEffect, useState } from 'react';
import Icon from '../../components/Icon';
import { adminApi } from '../../services/adminApi';
import { TableToolbar } from '../../components/admin/TableToolbar';
import { useColumnVisibility } from '../../hooks/useColumnVisibility';
import { useToast } from '../../contexts/ToastContext';
import { usePermissions } from '../../contexts/PermissionsContext';
import { useListViews } from '../../hooks/useListViews';
import ListViewSelector from '../../components/admin/listviews/ListViewSelector';
import MigrateModal from '../../components/admin/MigrateModal';

const COLS = [
  { key: 'email', label: 'Email' },
  { key: 'subscribed_at', label: 'Subscribed' },
];

const SORT_OPTIONS = [
  { value: 'subscribed_at', label: 'Subscribed Date' },
  { value: 'email', label: 'Email' },
];

const LIMIT = 20;

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Newsletter() {
  const { success, error: toastError } = useToast();
  const { canDo } = usePermissions();
  const lv = useListViews('newsletter');
  const [data, setData] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('subscribed_at');
  const [dir, setDir] = useState('desc');
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [checkedIds, setCheckedIds] = useState(new Set());
  const [migrateOpen, setMigrateOpen] = useState(false);
  const debouncedSearch = useDebounce(search);
  const { visibleCols, toggle: toggleCol, reset: resetCols } = useColumnVisibility('newsletter', COLS);

  const rows = (data?.data ?? []);
  const allChecked = rows.length > 0 && rows.every((r) => checkedIds.has(r.id));
  const someChecked = rows.some((r) => checkedIds.has(r.id)) && !allChecked;
  const toggleAll = () => {
    if (allChecked) setCheckedIds((p) => { const n = new Set(p); rows.forEach((r) => n.delete(r.id)); return n; });
    else setCheckedIds((p) => { const n = new Set(p); rows.forEach((r) => n.add(r.id)); return n; });
  };
  const toggleOne = (id) => setCheckedIds((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const load = useCallback(() => {
    setError('');
    adminApi
      .newsletter({ page, limit: LIMIT, search: debouncedSearch, sort, dir, list_view_id: lv.activeId || '' })
      .then((d) => { setData(d); setCheckedIds(new Set()); })
      .catch((err) => setError(err.message));
  }, [page, debouncedSearch, sort, dir, lv.activeId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [debouncedSearch, lv.activeId]);

  const handleSort = (col) => {
    if (sort === col) setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSort(col); setDir('asc'); }
    setPage(1);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this subscriber? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await adminApi.deleteNewsletter(id);
      success('Subscriber removed');
      load();
    } catch (err) {
      setError(err.message); toastError('Delete failed', err.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try { await adminApi.exportNewsletter(); success('Exported', 'CSV downloaded.'); }
    catch (err) { setError(err.message); toastError('Export failed', err.message); }
    finally { setExporting(false); }
  };

  const SortIcon = ({ col }) =>
    sort === col ? (
      <Icon icon={dir === 'asc' ? 'solar:sort-from-bottom-to-top-linear' : 'solar:sort-from-top-to-bottom-linear'} width={13} className="text-indigo-400" />
    ) : (
      <Icon icon="solar:sort-linear" width={13} className="text-zinc-600" />
    );

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-semibold text-2xl text-zinc-100">Newsletter</h1>
          <p className="text-sm text-zinc-500 mt-1">{data ? `${data.pagination.total} subscribers` : '—'}</p>
        </div>
      </div>

      <ListViewSelector
        views={lv.views}
        recentViews={lv.recentViews}
        activeId={lv.activeId}
        fieldConfig={lv.fieldConfig}
        loading={lv.loading}
        onSelect={lv.setActiveView}
        onCreate={lv.createView}
        onEdit={(id, data) => lv.updateView(id, data)}
        onDuplicate={lv.duplicateView}
        onDelete={lv.deleteView}
        onSetDefault={lv.setDefault}
        onFavorite={lv.toggleFavorite}
        onPin={lv.togglePin}
      />

      {error ? <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-sm text-rose-400 mb-4">{error}</div> : null}

      {/* Bulk toolbar */}
      {checkedIds.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-3">
          <span className="text-xs text-indigo-400 font-medium">{checkedIds.size} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => setMigrateOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181B] border border-zinc-700 hover:border-indigo-500/50 text-zinc-300 hover:text-indigo-300 text-xs font-medium transition-all">
              <Icon icon="solar:transfer-horizontal-linear" width={13} />
              Migrate
            </button>
            <button onClick={() => setCheckedIds(new Set())}
              className="px-3 py-1.5 rounded-lg bg-[#18181B] border border-zinc-700 hover:border-zinc-500 text-zinc-400 text-xs transition-all">
              Deselect all
            </button>
          </div>
        </div>
      )}

      {migrateOpen && (
        <MigrateModal
          objectName="newsletter"
          selectedIds={checkedIds}
          onClose={() => setMigrateOpen(false)}
          onSuccess={() => { setMigrateOpen(false); setCheckedIds(new Set()); load(); }}
        />
      )}

      <TableToolbar
        search={search} onSearch={setSearch}
        onRefresh={load}
        sortOptions={SORT_OPTIONS} sort={sort} dir={dir}
        onSort={(col, d) => { setSort(col); setDir(d); setPage(1); }}
        columns={COLS} visibleCols={visibleCols} onColumnsToggle={toggleCol} onColumnsReset={resetCols}
        placeholder="Search by email…"
      >
        {canDo('newsletter.export') && (
          <button onClick={handleExport} disabled={exporting}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70 border border-transparent transition-all disabled:opacity-50">
            <Icon icon={exporting ? 'solar:loading-linear' : 'solar:download-linear'} width={13} className={exporting ? 'animate-spin' : ''} />
            Export
          </button>
        )}
      </TableToolbar>

      <div className="bg-[#111113] border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#18181B] border-b border-zinc-800">
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={allChecked} ref={(el) => { if (el) el.indeterminate = someChecked; }}
                    onChange={toggleAll} className="w-3.5 h-3.5 rounded border-zinc-600 bg-[#18181B] accent-indigo-500 cursor-pointer" />
                </th>
                {COLS.filter((c) => visibleCols.has(c.key)).map(({ key, label }) => (
                  <th key={key} onClick={() => handleSort(key)}
                    className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-300 transition-colors select-none">
                    <span className="flex items-center gap-1.5">
                      {label} <SortIcon col={key} />
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {!data ? (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-zinc-600">Loading…</td></tr>
              ) : data.data.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-zinc-600">No subscribers found.</td></tr>
              ) : (
                data.data.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={checkedIds.has(s.id)} onChange={() => toggleOne(s.id)}
                        className="w-3.5 h-3.5 rounded border-zinc-600 bg-[#18181B] accent-indigo-500 cursor-pointer" />
                    </td>
                    {visibleCols.has('email') && <td className="px-4 py-3 text-zinc-200">{s.email}</td>}
                    {visibleCols.has('subscribed_at') && <td className="px-4 py-3 text-zinc-500 font-mono text-xs whitespace-nowrap">{new Date(s.subscribed_at).toLocaleDateString()}</td>}
                    {canDo('newsletter.delete') && (
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleDelete(s.id)} disabled={deleting === s.id}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all disabled:opacity-40" title="Delete">
                          <Icon icon="solar:trash-bin-minimalistic-linear" width={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {data && data.pagination.pages > 1 ? (
        <div className="mt-4 flex items-center justify-between text-sm text-zinc-400">
          <span className="text-xs font-mono text-zinc-600">
            Page {data.pagination.page} of {data.pagination.pages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg bg-[#18181B] border border-zinc-800 hover:border-zinc-600 transition-all disabled:opacity-40 text-xs"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
              disabled={page === data.pagination.pages}
              className="px-3 py-1.5 rounded-lg bg-[#18181B] border border-zinc-800 hover:border-zinc-600 transition-all disabled:opacity-40 text-xs"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
