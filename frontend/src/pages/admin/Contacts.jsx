import { useCallback, useEffect, useState } from 'react';
import Icon from '../../components/Icon';
import { adminApi } from '../../services/adminApi';

const LIMIT = 20;

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function Modal({ contact, onClose }) {
  if (!contact) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div
        className="bg-[#111113] border border-zinc-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <h3 className="font-display font-semibold text-lg text-zinc-100">Contact Details</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 transition-colors">
            <Icon icon="solar:close-circle-linear" width={20} />
          </button>
        </div>
        <dl className="space-y-3 text-sm">
          {[
            { label: 'Name', value: contact.name },
            { label: 'Email', value: contact.email },
            { label: 'Service', value: contact.service },
            { label: 'Status', value: contact.status },
            { label: 'Source', value: contact.source },
            { label: 'Date', value: new Date(contact.created_at).toLocaleString() }
          ].map(({ label, value }) => (
            <div key={label} className="flex gap-3">
              <dt className="w-20 shrink-0 text-zinc-500 font-mono text-xs pt-0.5">{label}</dt>
              <dd className="text-zinc-200 flex-1 break-words">{value}</dd>
            </div>
          ))}
          <div className="flex gap-3">
            <dt className="w-20 shrink-0 text-zinc-500 font-mono text-xs pt-0.5">Message</dt>
            <dd className="text-zinc-200 flex-1 break-words whitespace-pre-wrap">{contact.message}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

export default function Contacts() {
  const [data, setData] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('created_at');
  const [dir, setDir] = useState('desc');
  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const debouncedSearch = useDebounce(search);

  const load = useCallback(() => {
    setError('');
    adminApi
      .contacts({ page, limit: LIMIT, search: debouncedSearch, sort, dir })
      .then(setData)
      .catch((err) => setError(err.message));
  }, [page, debouncedSearch, sort, dir]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const handleSort = (col) => {
    if (sort === col) setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSort(col); setDir('asc'); }
    setPage(1);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this contact? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await adminApi.deleteContact(id);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try { await adminApi.exportContacts(); }
    catch (err) { setError(err.message); }
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
      {selected ? <Modal contact={selected} onClose={() => setSelected(null)} /> : null}

      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-semibold text-2xl text-zinc-100">Contacts</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {data ? `${data.pagination.total} total` : '—'}
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 bg-[#18181B] border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-zinc-100 rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-50"
        >
          <Icon icon="solar:download-linear" width={16} />
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      {error ? (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-sm text-rose-400 mb-4">{error}</div>
      ) : null}

      {/* Search */}
      <div className="relative mb-4">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
          <Icon icon="solar:magnifer-linear" width={16} />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or service…"
          className="w-full bg-[#111113] border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
        />
      </div>

      {/* Table */}
      <div className="bg-[#111113] border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#18181B] border-b border-zinc-800">
                {[
                  { col: 'name', label: 'Name' },
                  { col: 'email', label: 'Email' },
                  { col: 'service', label: 'Service' },
                  { col: 'created_at', label: 'Date' }
                ].map(({ col, label }) => (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-300 transition-colors select-none"
                  >
                    <span className="flex items-center gap-1.5">
                      {label} <SortIcon col={col} />
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {!data ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-zinc-600">Loading…</td>
                </tr>
              ) : data.data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-zinc-600">No contacts found.</td>
                </tr>
              ) : (
                data.data.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3 text-zinc-200 font-medium whitespace-nowrap">{c.name}</td>
                    <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{c.email}</td>
                    <td className="px-4 py-3 text-zinc-400 whitespace-nowrap max-w-[160px] truncate">{c.service}</td>
                    <td className="px-4 py-3 text-zinc-500 whitespace-nowrap font-mono text-xs">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelected(c)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                          title="View details"
                        >
                          <Icon icon="solar:eye-linear" width={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={deleting === c.id}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all disabled:opacity-40"
                          title="Delete"
                        >
                          <Icon icon="solar:trash-bin-minimalistic-linear" width={16} />
                        </button>
                      </div>
                    </td>
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
