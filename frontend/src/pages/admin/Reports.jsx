import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
import { adminApi } from '../../services/adminApi';
import { useToast } from '../../contexts/ToastContext';

const TYPE_ICONS = {
  tabular: 'solar:table-linear',
  summary: 'solar:chart-square-linear',
  matrix:  'solar:widget-linear',
};
const TYPE_LABELS = { tabular: 'Tabular', summary: 'Summary', matrix: 'Matrix' };
const SOURCE_COLORS = {
  contacts: 'text-primary-400',
  newsletter: 'text-secondary-400',
  services: 'text-success-400',
  testimonials: 'text-warning-400',
  users: 'text-accent-400',
};

function ReportCard({ report, onDelete, onFavorite, onRun }) {
  const [running, setRunning] = useState(false);
  const navigate = useNavigate();

  const handleRun = async (e) => {
    e.preventDefault();
    setRunning(true);
    try {
      await onRun(report.id);
      navigate(`/admin/reports/${report.id}/view`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="group relative bg-[#111113] border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 flex flex-col gap-3 transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
            <Icon icon={TYPE_ICONS[report.report_type] ?? TYPE_ICONS.tabular} width={16} className="text-zinc-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-sm text-zinc-100 truncate">{report.name}</h3>
            <p className="text-xs text-zinc-600 truncate">{TYPE_LABELS[report.report_type]}</p>
          </div>
        </div>
        <button onClick={() => onFavorite(report.id)} title={report.is_favorite ? 'Unfavorite' : 'Favorite'}
          className="p-1.5 rounded-lg text-zinc-600 hover:text-warning-400 transition-colors flex-shrink-0">
          <Icon icon={report.is_favorite ? 'solar:star-bold' : 'solar:star-linear'} width={14}
            className={report.is_favorite ? 'text-warning-400' : ''} />
        </button>
      </div>

      {report.description && (
        <p className="text-xs text-zinc-500 line-clamp-2">{report.description}</p>
      )}

      <div className="flex items-center gap-2 text-xs">
        <span className={`font-medium ${SOURCE_COLORS[report.config?.source] ?? 'text-zinc-400'}`}>
          {report.config?.source ?? 'unknown'}
        </span>
        {report.run_count > 0 && (
          <span className="text-zinc-700">· Run {report.run_count}×</span>
        )}
        {report.is_public && (
          <span className="ml-auto px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-500">Public</span>
        )}
      </div>

      <div className="flex items-center gap-2 mt-auto pt-2 border-t border-zinc-800/60">
        <button onClick={handleRun} disabled={running}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-medium transition-all disabled:opacity-50">
          <Icon icon={running ? 'solar:loading-linear' : 'solar:play-circle-linear'} width={13} className={running ? 'animate-spin' : ''} />
          {running ? 'Running…' : 'Run'}
        </button>
        <Link to={`/admin/reports/${report.id}/edit`}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-zinc-200 text-xs transition-all">
          <Icon icon="solar:pen-linear" width={12} />
          Edit
        </Link>
        <button onClick={() => onDelete(report.id, report.name)}
          className="p-1.5 rounded-lg border border-zinc-800 hover:border-error-500/40 text-zinc-600 hover:text-error-400 hover:bg-error-500/10 transition-all">
          <Icon icon="solar:trash-bin-minimalistic-linear" width={13} />
        </button>
      </div>
    </div>
  );
}

export default function Reports() {
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const [reports, setReports] = useState(null);
  const [folders, setFolders] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [activeFolder, setActiveFolder] = useState(null);
  const [view, setView] = useState('grid');
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = useCallback(async () => {
    try {
      const rRes = await adminApi.listReports({ folder_id: activeFolder || undefined });
      setReports(rRes.reports);
    } catch (err) {
      toastError('Failed to load reports', err.message);
    }
    // Folders load independently — failure doesn't break the report list
    try {
      const fRes = await adminApi.listReportFolders();
      setFolders(fRes.folders);
    } catch {
      // Folders are non-critical; silently skip on error
    }
  }, [activeFolder, toastError]);

  useEffect(() => { load(); }, [load]);

  const filtered = (reports ?? []).filter((r) => {
    if (search && !r.name.toLowerCase().includes(search.toLowerCase()) &&
        !(r.description ?? '').toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType !== 'all' && r.report_type !== filterType) return false;
    if (filterSource !== 'all' && r.config?.source !== filterSource) return false;
    return true;
  });

  const favorites = filtered.filter((r) => r.is_favorite);
  const rest = filtered.filter((r) => !r.is_favorite);
  const grouped = [...favorites, ...rest];

  const handleFavorite = async (id) => {
    try {
      const { report } = await adminApi.toggleReportFavorite(id);
      setReports((prev) => prev.map((r) => r.id === id ? { ...r, is_favorite: report.is_favorite } : r));
    } catch (err) { toastError('Failed', err.message); }
  };

  const handleDelete = (id, name) => setDeleteConfirm({ id, name });

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await adminApi.deleteReport(deleteConfirm.id);
      success('Deleted', `"${deleteConfirm.name}" removed.`);
      setReports((prev) => prev.filter((r) => r.id !== deleteConfirm.id));
    } catch (err) { toastError('Delete failed', err.message); }
    setDeleteConfirm(null);
  };

  const handleRun = async (id) => {
    await adminApi.runReport(id);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const { folder } = await adminApi.createReportFolder(newFolderName.trim());
      setFolders((prev) => [...prev, folder]);
      setNewFolderName('');
      setShowFolderForm(false);
      success('Folder created');
    } catch (err) { toastError('Failed', err.message); }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display font-semibold text-2xl text-zinc-100">Reports</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {reports ? `${reports.length} reports` : '—'}
          </p>
        </div>
        <Link to="/admin/reports/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-all shadow-lg shadow-primary-900/30">
          <Icon icon="solar:add-circle-linear" width={16} />
          New Report
        </Link>
      </div>

      <div className="flex gap-6">
        {/* Sidebar — folders */}
        <aside className="hidden lg:flex flex-col gap-1 w-52 flex-shrink-0">
          <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider px-2 mb-2">Folders</div>
          <button onClick={() => setActiveFolder(null)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all text-left w-full
              ${!activeFolder ? 'bg-primary-500/15 text-primary-300 border border-primary-500/20' : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200'}`}>
            <Icon icon="solar:home-linear" width={14} />
            All Reports
          </button>
          {folders.map((f) => (
            <button key={f.id} onClick={() => setActiveFolder(f.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all text-left w-full
                ${activeFolder === f.id ? 'bg-primary-500/15 text-primary-300 border border-primary-500/20' : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200'}`}>
              <Icon icon="solar:folder-linear" width={14} />
              <span className="truncate">{f.name}</span>
            </button>
          ))}
          {showFolderForm ? (
            <div className="flex flex-col gap-1.5 px-2 mt-1">
              <input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                placeholder="Folder name" autoFocus
                className="w-full px-2 py-1.5 rounded-lg bg-[#18181B] border border-zinc-700 text-xs text-zinc-200 outline-none focus:border-primary-500/60 transition-all" />
              <div className="flex gap-1">
                <button onClick={handleCreateFolder}
                  className="flex-1 py-1 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs transition-all">
                  Create
                </button>
                <button onClick={() => { setShowFolderForm(false); setNewFolderName(''); }}
                  className="flex-1 py-1 rounded-lg border border-zinc-700 text-zinc-400 text-xs hover:text-zinc-200 transition-all">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowFolderForm(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-600 hover:text-zinc-400 transition-all mt-1">
              <Icon icon="solar:add-square-linear" width={13} />
              New Folder
            </button>
          )}
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Icon icon="solar:magnifer-linear" width={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reports…"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#18181B] border border-zinc-800 focus:border-primary-500/60 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-all" />
            </div>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#18181B] border border-zinc-800 text-sm text-zinc-300 outline-none transition-all focus:border-primary-500/40">
              <option value="all">All Types</option>
              <option value="tabular">Tabular</option>
              <option value="summary">Summary</option>
            </select>
            <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#18181B] border border-zinc-800 text-sm text-zinc-300 outline-none transition-all focus:border-primary-500/40">
              <option value="all">All Sources</option>
              <option value="contacts">Contacts</option>
              <option value="newsletter">Newsletter</option>
              <option value="services">Services</option>
              <option value="testimonials">Testimonials</option>
              <option value="users">Users</option>
            </select>
            <div className="flex rounded-xl border border-zinc-800 overflow-hidden ml-auto">
              {['grid', 'list'].map((v) => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-3 py-2 text-xs transition-all ${view === v ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'}`}>
                  <Icon icon={v === 'grid' ? 'solar:widget-linear' : 'solar:list-linear'} width={14} />
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          {!reports ? (
            <div className="flex flex-col items-center gap-3 py-16 text-zinc-700">
              <Icon icon="solar:loading-linear" width={28} className="animate-spin" />
              <span className="text-sm">Loading reports…</span>
            </div>
          ) : grouped.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20 text-zinc-700">
              <Icon icon="solar:chart-square-linear" width={40} />
              <div className="text-center">
                <p className="text-sm font-medium text-zinc-500">
                  {search || filterType !== 'all' || filterSource !== 'all' ? 'No reports match your filters' : 'No reports yet'}
                </p>
                {!search && filterType === 'all' && filterSource === 'all' && (
                  <Link to="/admin/reports/new"
                    className="inline-flex items-center gap-1.5 mt-3 text-xs text-primary-400 hover:text-primary-300 transition-colors">
                    <Icon icon="solar:add-circle-linear" width={13} />
                    Create your first report
                  </Link>
                )}
              </div>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {grouped.map((r) => (
                <ReportCard key={r.id} report={r} onDelete={handleDelete} onFavorite={handleFavorite} onRun={handleRun} />
              ))}
            </div>
          ) : (
            <div className="bg-[#111113] border border-zinc-800 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#18181B] border-b border-zinc-800">
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Report</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Source</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Runs</th>
                    <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {grouped.map((r) => (
                    <tr key={r.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {r.is_favorite && <Icon icon="solar:star-bold" width={12} className="text-warning-400 flex-shrink-0" />}
                          <div>
                            <p className="text-sm text-zinc-200 font-medium">{r.name}</p>
                            {r.description && <p className="text-xs text-zinc-600 truncate max-w-xs">{r.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-400">{TYPE_LABELS[r.report_type]}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${SOURCE_COLORS[r.config?.source] ?? 'text-zinc-400'}`}>
                          {r.config?.source}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-600 font-mono">{r.run_count}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => { handleRun(r.id).then(() => navigate(`/admin/reports/${r.id}/view`)); }}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-primary-400 hover:bg-primary-500/10 transition-all" title="Run">
                            <Icon icon="solar:play-circle-linear" width={15} />
                          </button>
                          <Link to={`/admin/reports/${r.id}/edit`}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all" title="Edit">
                            <Icon icon="solar:pen-linear" width={15} />
                          </Link>
                          <button onClick={() => handleFavorite(r.id)}
                            className={`p-1.5 rounded-lg transition-all ${r.is_favorite ? 'text-warning-400' : 'text-zinc-600 hover:text-warning-400'}`} title="Favorite">
                            <Icon icon={r.is_favorite ? 'solar:star-bold' : 'solar:star-linear'} width={15} />
                          </button>
                          <button onClick={() => handleDelete(r.id, r.name)}
                            className="p-1.5 rounded-lg text-zinc-600 hover:text-error-400 hover:bg-error-500/10 transition-all" title="Delete">
                            <Icon icon="solar:trash-bin-minimalistic-linear" width={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-error-500/15 flex items-center justify-center">
                <Icon icon="solar:trash-bin-minimalistic-linear" width={18} className="text-error-400" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-100">Delete Report</h3>
                <p className="text-xs text-zinc-500">This cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-zinc-400 mb-5">
              Delete <span className="text-zinc-200 font-medium">"{deleteConfirm.name}"</span>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:text-zinc-100 hover:border-zinc-600 text-sm font-medium transition-all">
                Cancel
              </button>
              <button onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 rounded-xl bg-error-600 hover:bg-error-500 text-white text-sm font-medium transition-all">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
