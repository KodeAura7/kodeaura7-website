import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContactStatusBadge from '../../components/ContactStatusBadge';
import { CONTACT_STATUSES } from '../../utils/contactStatusConfig';
import Icon from '../../components/Icon';
import { adminApi } from '../../services/adminApi';
import { TableToolbar } from '../../components/admin/TableToolbar';
import { useColumnVisibility } from '../../hooks/useColumnVisibility';
import { useToast } from '../../contexts/ToastContext';
import { usePermissions } from '../../contexts/PermissionsContext';
import { useListViews } from '../../hooks/useListViews';
import ListViewSelector from '../../components/admin/listviews/ListViewSelector';

const LIMIT = 20;

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function SortIcon({ col, sort, dir }) {
  if (sort !== col) return <Icon icon="solar:sort-linear" width={13} className="text-zinc-600" />;
  return <Icon icon={dir === 'asc' ? 'solar:sort-from-bottom-to-top-linear' : 'solar:sort-from-top-to-bottom-linear'} width={13} className="text-indigo-400" />;
}

const STATUS_LABEL = { new: 'New', in_progress: 'In Progress', completed: 'Completed', closed: 'Closed' };

const COLS = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'service', label: 'Service' },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Date' },
  { key: 'updated_at', label: 'Updated', default: false },
];

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Date Created' },
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'status', label: 'Status' },
  { value: 'updated_at', label: 'Last Updated' },
];

const FILTER_GROUPS = [
  {
    key: 'status',
    label: 'Status',
    options: [
      { value: 'new', label: 'New' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'completed', label: 'Completed' },
      { value: 'closed', label: 'Closed' },
    ],
  },
];

export default function Contacts() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const { canDo } = usePermissions();
  const lv = useListViews('contacts');
  const [data, setData] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('created_at');
  const [dir, setDir] = useState('desc');
  const [filters, setFilters] = useState({});
  const [checkedIds, setCheckedIds] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState('in_progress');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const debouncedSearch = useDebounce(search);
  const { visibleCols, toggle: toggleCol, reset: resetCols } = useColumnVisibility('contacts', COLS);

  const load = useCallback(() => {
    setError('');
    adminApi
      .contacts({ page, limit: LIMIT, search: debouncedSearch, sort, dir, status: filters.status || '', list_view_id: lv.activeId || '' })
      .then((d) => { setData(d); setCheckedIds(new Set()); })
      .catch((err) => setError(err.message));
  }, [page, debouncedSearch, sort, dir, filters, lv.activeId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [debouncedSearch, filters, lv.activeId]);

  const handleSort = (col) => {
    if (sort === col) setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSort(col); setDir('asc'); }
    setPage(1);
  };

  const handleFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val }));

  // Multi-select
  const rows = data?.data ?? [];
  const allChecked = rows.length > 0 && rows.every((r) => checkedIds.has(r.id));
  const someChecked = rows.some((r) => checkedIds.has(r.id)) && !allChecked;

  const toggleAll = () => {
    if (allChecked) {
      setCheckedIds((prev) => { const next = new Set(prev); rows.forEach((r) => next.delete(r.id)); return next; });
    } else {
      setCheckedIds((prev) => { const next = new Set(prev); rows.forEach((r) => next.add(r.id)); return next; });
    }
  };

  const toggleOne = (id) => {
    setCheckedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const handleBulkStatus = async () => {
    setBulkLoading(true);
    try {
      await adminApi.bulkUpdateContactStatus(Array.from(checkedIds), bulkStatus);
      success('Status updated', `${checkedIds.size} contact${checkedIds.size !== 1 ? 's' : ''} updated.`);
      load();
    } catch (err) {
      setError(err.message); toastError('Update failed', err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this contact? This cannot be undone.')) return;
    setDeleting(id);
    try { await adminApi.deleteContact(id); success('Contact deleted'); load(); }
    catch (err) { setError(err.message); toastError('Delete failed', err.message); }
    finally { setDeleting(null); }
  };

  const handleExport = async () => {
    setExporting(true);
    try { await adminApi.exportContacts(); success('Exported', 'CSV downloaded.'); }
    catch (err) { setError(err.message); toastError('Export failed', err.message); }
    finally { setExporting(false); }
  };

  const visibleColCount = COLS.filter((c) => visibleCols.has(c.key)).length;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-semibold text-2xl text-zinc-100">Contacts</h1>
          <p className="text-sm text-zinc-500 mt-1">{data ? `${data.pagination.total} total` : '—'}</p>
        </div>
      </div>

      {/* List View Selector */}
      <ListViewSelector
        views={lv.views}
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
      />

      {error ? (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-sm text-rose-400 mb-4">{error}</div>
      ) : null}

      {/* Bulk toolbar — only shown when user can update status */}
      {checkedIds.size > 0 && canDo('contacts.status_update') ? (
        <div className="mb-4 flex flex-wrap items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-3">
          <span className="text-xs text-indigo-400 font-medium">{checkedIds.size} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="bg-[#18181B] border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500/50"
            >
              {CONTACT_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
            <button onClick={handleBulkStatus} disabled={bulkLoading}
              className="px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-medium transition-all disabled:opacity-60">
              {bulkLoading ? 'Applying…' : 'Apply'}
            </button>
            <button onClick={() => setCheckedIds(new Set())}
              className="px-3 py-1.5 rounded-lg bg-[#18181B] border border-zinc-700 hover:border-zinc-500 text-zinc-400 text-xs transition-all">
              Deselect all
            </button>
          </div>
        </div>
      ) : null}

      <TableToolbar
        search={search} onSearch={(v) => setSearch(v)}
        onRefresh={load}
        sortOptions={SORT_OPTIONS} sort={sort} dir={dir}
        onSort={(col, d) => { setSort(col); setDir(d); setPage(1); }}
        filterGroups={FILTER_GROUPS} filters={filters} onFilter={handleFilter}
        columns={COLS} visibleCols={visibleCols} onColumnsToggle={toggleCol} onColumnsReset={resetCols}
        placeholder="Search by name, email or service…"
      >
        {canDo('contacts.export') && (
          <button onClick={handleExport} disabled={exporting}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70 border border-transparent transition-all disabled:opacity-50">
            <Icon icon={exporting ? 'solar:loading-linear' : 'solar:download-linear'} width={13} className={exporting ? 'animate-spin' : ''} />
            Export
          </button>
        )}
      </TableToolbar>

      {/* Table */}
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
                      {label} <SortIcon col={key} sort={sort} dir={dir} />
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {!data ? (
                <tr><td colSpan={visibleColCount + 2} className="px-4 py-10 text-center text-sm text-zinc-600">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={visibleColCount + 2} className="px-4 py-10 text-center text-sm text-zinc-600">No contacts found.</td></tr>
              ) : (
                rows.map((c) => (
                  <tr key={c.id} onClick={() => navigate(`/admin/contacts/${c.id}`)}
                    className="hover:bg-zinc-800/30 transition-colors cursor-pointer">
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={checkedIds.has(c.id)} onChange={() => toggleOne(c.id)}
                        className="w-3.5 h-3.5 rounded border-zinc-600 bg-[#18181B] accent-indigo-500 cursor-pointer" />
                    </td>
                    {visibleCols.has('name') && <td className="px-4 py-3 text-zinc-200 font-medium whitespace-nowrap">{c.name}</td>}
                    {visibleCols.has('email') && <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{c.email}</td>}
                    {visibleCols.has('service') && <td className="px-4 py-3 text-zinc-400 whitespace-nowrap max-w-[140px] truncate">{c.service}</td>}
                    {visibleCols.has('status') && <td className="px-4 py-3 whitespace-nowrap"><ContactStatusBadge status={c.status} /></td>}
                    {visibleCols.has('created_at') && <td className="px-4 py-3 text-zinc-500 whitespace-nowrap font-mono text-xs">{new Date(c.created_at).toLocaleDateString()}</td>}
                    {visibleCols.has('updated_at') && <td className="px-4 py-3 text-zinc-500 whitespace-nowrap font-mono text-xs">{c.updated_at ? new Date(c.updated_at).toLocaleDateString() : '—'}</td>}
                    {canDo('contacts.delete') && (
                      <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button onClick={(e) => handleDelete(e, c.id)} disabled={deleting === c.id}
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

      {/* Pagination */}
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
