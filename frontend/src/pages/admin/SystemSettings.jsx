import { useEffect, useRef, useState } from 'react';
import Icon from '../../components/Icon';
import { adminApi } from '../../services/adminApi';
import { useToast } from '../../contexts/ToastContext';

// ── Shared utilities ──────────────────────────────────────────────────────────

function fmtSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function fmtNum(n) {
  return typeof n === 'number' ? n.toLocaleString() : '—';
}

const COLLECTION_LABELS = {
  admin_users:            'Admin Users',
  permissions:            'Permissions',
  services:               'Services',
  service_history:        'Service History',
  social_links:           'Social Links',
  page_content:           'Page Content',
  page_content_history:   'Page History',
  contact_form_fields:    'Contact Form Fields',
  testimonials:           'Testimonials',
  contact_messages:       'Contacts',
  newsletter_subscribers: 'Newsletter',
  list_views:             'List Views',
  list_view_filters:      'List View Filters',
  list_view_pins:         'List View Pins',
  list_view_recents:      'List View Recents',
  audit_logs:             'Audit Logs',
};

const COLLECTION_GROUPS = [
  {
    label: 'Site Content',
    icon: 'solar:document-linear',
    names: ['page_content', 'page_content_history', 'services', 'service_history', 'social_links', 'contact_form_fields'],
  },
  {
    label: 'CRM',
    icon: 'solar:users-group-rounded-linear',
    names: ['contact_messages', 'newsletter_subscribers', 'testimonials'],
  },
  {
    label: 'Administration',
    icon: 'solar:shield-keyhole-linear',
    names: ['admin_users', 'permissions', 'audit_logs'],
  },
  {
    label: 'List Views',
    icon: 'solar:list-linear',
    names: ['list_views', 'list_view_filters', 'list_view_pins', 'list_view_recents'],
  },
];

// ── Selective Export Modal ────────────────────────────────────────────────────

function SelectiveExportModal({ onClose }) {
  const { success, error: toastError } = useToast();
  const [collections, setCollections] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);
  const searchRef = useRef();

  useEffect(() => {
    adminApi.getDbCollections()
      .then(data => {
        setCollections(data.collections);
        setSelected(new Set(data.collections.map(c => c.name)));
      })
      .catch(e => setLoadError(e.message));
  }, []);

  useEffect(() => { searchRef.current?.focus(); }, [collections]);

  const q = search.trim().toLowerCase();
  const visible = (collections || []).filter(c =>
    !q ||
    (COLLECTION_LABELS[c.name] || c.name).toLowerCase().includes(q) ||
    c.name.toLowerCase().includes(q)
  );

  const allVisibleSelected = visible.length > 0 && visible.every(c => selected.has(c.name));
  const someSelected = selected.size > 0;
  const selectedCols = (collections || []).filter(c => selected.has(c.name));
  const totalSelectedRecords = selectedCols.reduce((s, c) => s + (c.count || 0), 0);

  const toggleAll = () => {
    setSelected(prev => {
      const n = new Set(prev);
      if (allVisibleSelected) visible.forEach(c => n.delete(c.name));
      else visible.forEach(c => n.add(c.name));
      return n;
    });
  };

  const toggle = (name) => setSelected(prev => {
    const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n;
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await adminApi.exportDatabase([...selected]);
      setExportResult(result);
      success('Selective export complete', `${result.collCount} collections · ${fmtNum(result.recordCount)} records · ${fmtSize(result.sizeBytes)}`);
    } catch (e) {
      toastError('Export failed', e.message);
      setExporting(false);
    }
  };

  // Success state
  if (exportResult) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="w-full max-w-sm bg-[#111113] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-6 py-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-success-500/15 border border-success-500/20 flex items-center justify-center">
              <Icon icon="solar:cloud-download-bold-duotone" width={28} className="text-success-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100 mb-1">Export complete</h3>
              <p className="text-sm text-zinc-400">{exportResult.filename}</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Collections', val: fmtNum(exportResult.collCount) },
                { label: 'Records', val: fmtNum(exportResult.recordCount) },
                { label: 'File size', val: fmtSize(exportResult.sizeBytes) },
              ].map(({ label, val }) => (
                <div key={label} className="bg-[#18181B] border border-zinc-800 rounded-xl px-3 py-2.5 text-center">
                  <p className="text-sm font-semibold text-zinc-100 font-mono">{val}</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            <button onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium transition-all">
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full sm:max-w-lg bg-[#111113] border border-zinc-800 sm:rounded-2xl shadow-2xl flex flex-col"
        style={{ maxHeight: 'min(680px, 92dvh)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-500/15 border border-primary-500/25 flex items-center justify-center">
              <Icon icon="solar:filter-bold-duotone" width={17} className="text-primary-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Selective Export</h2>
              <p className="text-[11px] text-zinc-500">Choose which collections to include</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all">
            <Icon icon="solar:close-circle-linear" width={18} />
          </button>
        </div>

        {/* Search + select all bar */}
        <div className="px-4 pt-4 pb-3 border-b border-zinc-800 space-y-3 shrink-0">
          <div className="relative">
            <Icon icon="solar:magnifer-linear" width={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            <input ref={searchRef} type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search collections…"
              className="w-full bg-[#18181B] border border-zinc-800 rounded-xl pl-8 pr-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-primary-500/50 transition-all" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200">
                <Icon icon="solar:close-circle-linear" width={14} />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none" onClick={toggleAll}>
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                allVisibleSelected ? 'border-primary-500 bg-primary-500' :
                visible.some(c => selected.has(c.name)) ? 'border-primary-500/60 bg-primary-500/20' :
                'border-zinc-600'
              }`}>
                {allVisibleSelected
                  ? <Icon icon="solar:check-read-linear" width={9} className="text-white" />
                  : visible.some(c => selected.has(c.name))
                    ? <span className="w-1.5 h-1.5 rounded-sm bg-primary-400" />
                    : null}
              </div>
              <span className="text-xs font-medium text-zinc-400">
                {allVisibleSelected ? 'Deselect all' : 'Select all'}
                {q ? ` (${visible.length} matching)` : ''}
              </span>
            </label>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="font-mono text-zinc-300">{selected.size}</span>
              <span>selected</span>
              <span className="text-zinc-700">·</span>
              <span className="font-mono text-zinc-400">{fmtNum(totalSelectedRecords)}</span>
              <span>records</span>
            </div>
          </div>
        </div>

        {/* Collection list */}
        <div className="overflow-y-auto flex-1 px-2 py-2">
          {loadError ? (
            <div className="px-4 py-8 text-center">
              <Icon icon="solar:danger-circle-linear" width={20} className="text-error-400 mx-auto mb-2" />
              <p className="text-sm text-error-400">{loadError}</p>
            </div>
          ) : !collections ? (
            <div className="px-4 py-8 flex items-center justify-center gap-2 text-zinc-500">
              <Icon icon="solar:loading-linear" width={16} className="animate-spin" />
              <span className="text-sm">Loading collections…</span>
            </div>
          ) : visible.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-zinc-600">No collections match "{search}"</div>
          ) : (
            COLLECTION_GROUPS.map(group => {
              const groupCols = visible.filter(c => group.names.includes(c.name));
              if (!groupCols.length) return null;
              return (
                <div key={group.label} className="mb-1">
                  <div className="flex items-center gap-1.5 px-3 py-1.5">
                    <Icon icon={group.icon} width={12} className="text-zinc-600" />
                    <span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">{group.label}</span>
                  </div>
                  {groupCols.map(col => {
                    const isSelected = selected.has(col.name);
                    return (
                      <label key={col.name}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                          isSelected ? 'bg-primary-500/5' : 'hover:bg-zinc-800/50'
                        }`}>
                        <div onClick={() => toggle(col.name)}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all shrink-0 ${
                            isSelected ? 'border-primary-500 bg-primary-500' : 'border-zinc-600'
                          }`}>
                          {isSelected && <Icon icon="solar:check-read-linear" width={9} className="text-white" />}
                        </div>
                        <input type="checkbox" checked={isSelected} onChange={() => toggle(col.name)} className="sr-only" />
                        <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                          <span className={`text-sm font-medium ${isSelected ? 'text-zinc-100' : 'text-zinc-400'}`}>
                            {COLLECTION_LABELS[col.name] || col.name}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            {col.count > 0 ? (
                              <span className={`text-xs font-mono tabular-nums ${isSelected ? 'text-zinc-300' : 'text-zinc-600'}`}>
                                {fmtNum(col.count)}
                              </span>
                            ) : (
                              <span className="text-[10px] text-zinc-700 font-mono">empty</span>
                            )}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-zinc-800 shrink-0">
          <div className="flex gap-3">
            <button onClick={onClose} disabled={exporting}
              className="flex-1 py-2.5 rounded-xl bg-[#18181B] border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-sm font-medium transition-all disabled:opacity-50">
              Cancel
            </button>
            <button onClick={handleExport} disabled={!someSelected || exporting || !collections}
              className="flex-[2] py-2.5 rounded-xl bg-success-500 hover:bg-success-400 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <Icon icon={exporting ? 'solar:loading-linear' : 'solar:cloud-download-linear'} width={15} className={exporting ? 'animate-spin' : ''} />
              {exporting
                ? 'Exporting…'
                : `Export${someSelected ? ` (${selected.size})` : ''}`}
            </button>
          </div>
          {!someSelected && collections && (
            <p className="text-center text-[11px] text-error-400 mt-2">Select at least one collection to export.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Import Results ────────────────────────────────────────────────────────────

const STRATEGIES = [
  {
    value: 'skip',
    label: 'Skip existing',
    desc: 'Import only new records. Any record that already exists is left unchanged.',
    icon: 'solar:skip-next-linear',
    color: 'text-success-400',
  },
  {
    value: 'replace',
    label: 'Replace existing',
    desc: 'Insert new records and overwrite all fields of existing records.',
    icon: 'solar:refresh-bold',
    color: 'text-warning-400',
  },
  {
    value: 'merge',
    label: 'Merge (fill gaps)',
    desc: 'Insert new records and fill only NULL fields in existing records.',
    icon: 'solar:merge-cells-bold',
    color: 'text-primary-400',
  },
];

function CollectionRow({ col }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-zinc-800/50 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-200">{COLLECTION_LABELS[col.name] || col.name}</p>
        {col.error && <p className="text-xs text-error-400 mt-0.5">{col.error}</p>}
        {col.errors?.map((e, i) => (
          <p key={i} className="text-[10px] font-mono text-error-400/70 truncate max-w-sm mt-0.5">{e}</p>
        ))}
      </div>
      <div className="flex items-center gap-3 shrink-0 text-xs">
        {col.created > 0 && <span className="flex items-center gap-1 text-success-400"><Icon icon="solar:add-circle-linear" width={12} />{col.created}</span>}
        {col.updated > 0 && <span className="flex items-center gap-1 text-warning-400"><Icon icon="solar:refresh-linear" width={12} />{col.updated}</span>}
        {col.skipped > 0 && <span className="flex items-center gap-1 text-zinc-500"><Icon icon="solar:skip-next-linear" width={12} />{col.skipped}</span>}
        {col.failed  > 0 && <span className="flex items-center gap-1 text-error-400"><Icon icon="solar:danger-circle-linear" width={12} />{col.failed}</span>}
        <span className="text-zinc-700">/{col.total}</span>
      </div>
    </div>
  );
}

function ImportResults({ result, onClose }) {
  const { summary, collections, strategy, sourceManifest } = result;
  const stratLabel = STRATEGIES.find(s => s.value === strategy)?.label || strategy;
  return (
    <div className="bg-[#111113] border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-success-500/15 border border-success-500/25 flex items-center justify-center">
            <Icon icon="solar:check-circle-bold" width={18} className="text-success-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Import Complete</h3>
            <p className="text-[11px] text-zinc-500">
              Strategy: {stratLabel} · {sourceManifest?.exportedAt ? new Date(sourceManifest.exportedAt).toLocaleString() : ''}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all">
          <Icon icon="solar:close-circle-linear" width={18} />
        </button>
      </div>
      <div className="grid grid-cols-4 divide-x divide-zinc-800 border-b border-zinc-800">
        {[
          { label: 'Created', val: summary.totalCreated, icon: 'solar:add-circle-linear',      color: 'text-success-400' },
          { label: 'Updated', val: summary.totalUpdated, icon: 'solar:refresh-linear',          color: 'text-warning-400' },
          { label: 'Skipped', val: summary.totalSkipped, icon: 'solar:skip-next-linear',        color: 'text-zinc-400' },
          { label: 'Failed',  val: summary.totalFailed,  icon: 'solar:danger-circle-linear',    color: summary.totalFailed > 0 ? 'text-error-400' : 'text-zinc-600' },
        ].map(({ label, val, icon, color }) => (
          <div key={label} className="px-4 py-4 text-center">
            <Icon icon={icon} width={16} className={`${color} mx-auto mb-1`} />
            <p className={`text-xl font-bold font-mono ${color}`}>{val}</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
      <div className="px-6 py-4 max-h-80 overflow-y-auto">
        {collections.map(col => <CollectionRow key={col.name} col={col} />)}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SystemSettings() {
  const { success, error: toastError } = useToast();

  // Export state
  const [exporting, setExporting] = useState(false);
  const [exportConfirm, setExportConfirm] = useState(false);
  const [selectiveOpen, setSelectiveOpen] = useState(false);

  // Import state
  const [importFile, setImportFile] = useState(null);
  const [strategy, setStrategy] = useState('skip');
  const [importing, setImporting] = useState(false);
  const [importConfirm, setImportConfirm] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef();

  // ── Full Export ─────────────────────────────────────────────────────────────
  const handleExportAll = async () => {
    setExportConfirm(false);
    setExporting(true);
    try {
      const result = await adminApi.exportDatabase();
      success('Full export complete', `${fmtNum(result.recordCount)} records · ${fmtSize(result.sizeBytes)}`);
    } catch (e) {
      toastError('Export failed', e.message);
    } finally {
      setExporting(false);
    }
  };

  // ── Import ──────────────────────────────────────────────────────────────────
  const handleFileDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith('.zip')) { setImportFile(file); setImportResult(null); setImportError(''); }
    else toastError('Invalid file', 'Please drop a .zip file.');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) { setImportFile(file); setImportResult(null); setImportError(''); }
    e.target.value = '';
  };

  const handleImport = async () => {
    setImportConfirm(false); setImporting(true); setImportError(''); setImportResult(null);
    try {
      const result = await adminApi.importDatabase(importFile, strategy);
      setImportResult(result);
      success('Import complete', `${result.summary.totalCreated} created · ${result.summary.totalUpdated} updated · ${result.summary.totalSkipped} skipped`);
    } catch (e) {
      setImportError(e.message);
      toastError('Import failed', e.message);
    } finally { setImporting(false); }
  };

  return (
    <>
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-display font-semibold text-2xl text-zinc-100">System Settings</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-error-500/10 border border-error-500/20 text-error-400 uppercase tracking-widest">Super Admin</span>
          </div>
          <p className="text-sm text-zinc-500">Database management and system-level operations.</p>
        </div>
      </div>

      {/* ── Database Management ───────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Icon icon="solar:database-linear" width={16} className="text-zinc-500" />
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Database Management</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* ── Export Card ───────────────────────────────────────────────── */}
          <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-6 flex flex-col gap-5">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-success-500/10 border border-success-500/20 flex items-center justify-center shrink-0">
                <Icon icon="solar:cloud-download-linear" width={20} className="text-success-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">Export Database</h3>
                <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                  Download a complete snapshot or choose specific collections to export. Each collection is packaged as JSON inside a ZIP with a manifest.
                </p>
              </div>
            </div>

            {/* What's included */}
            <div className="bg-[#18181B] border border-zinc-800 rounded-xl p-4">
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-2">All collections ({Object.keys(COLLECTION_LABELS).length})</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {Object.entries(COLLECTION_LABELS).map(([, label]) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Icon icon="solar:check-read-linear" width={10} className="text-success-500/70 shrink-0" />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            {exportConfirm ? (
              <div className="space-y-2">
                <div className="bg-warning-500/10 border border-warning-500/20 rounded-xl p-3 flex gap-2">
                  <Icon icon="solar:danger-triangle-linear" width={14} className="text-warning-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-zinc-400">Exports all data including hashed admin passwords. Keep the ZIP secure.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setExportConfirm(false)} className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-all">
                    Cancel
                  </button>
                  <button onClick={handleExportAll} className="flex-1 py-2 rounded-xl bg-success-500 hover:bg-success-400 text-white text-sm font-medium transition-all inline-flex items-center justify-center gap-2">
                    <Icon icon="solar:cloud-download-linear" width={14} />Confirm Export
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {/* Primary: Export All */}
                <button onClick={() => setExportConfirm(true)} disabled={exporting}
                  className="w-full inline-flex items-center justify-center gap-2 bg-success-500 hover:bg-success-400 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-60 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                  <Icon icon={exporting ? 'solar:loading-linear' : 'solar:cloud-download-linear'} width={15} className={exporting ? 'animate-spin' : ''} />
                  {exporting ? 'Exporting…' : 'Export Whole Database'}
                </button>

                {/* Secondary: Selective Export */}
                <button onClick={() => setSelectiveOpen(true)} disabled={exporting}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#18181B] border border-zinc-700 hover:border-primary-500/40 hover:bg-primary-500/5 text-zinc-300 hover:text-primary-300 rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-50">
                  <Icon icon="solar:filter-bold-duotone" width={15} className="text-primary-400" />
                  Selective Export…
                </button>
              </div>
            )}
          </div>

          {/* ── Import Card ───────────────────────────────────────────────── */}
          <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-6 flex flex-col gap-5">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center shrink-0">
                <Icon icon="solar:cloud-upload-linear" width={20} className="text-primary-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">Import Database</h3>
                <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                  Restore data from a previously exported ZIP. Choose how to handle conflicts with existing records.
                </p>
              </div>
            </div>

            {/* File drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => !importFile && fileInputRef.current?.click()}
              className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                dragOver ? 'border-primary-500 bg-primary-500/5' :
                importFile ? 'border-success-500/40 bg-success-500/5 cursor-default' :
                'border-zinc-700 hover:border-zinc-500 bg-[#18181B]'
              }`}>
              <input ref={fileInputRef} type="file" accept=".zip" className="hidden" onChange={handleFileSelect} />
              <div className="px-4 py-6 text-center">
                {importFile ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-left min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-success-500/15 flex items-center justify-center shrink-0">
                        <Icon icon="solar:zip-file-linear" width={18} className="text-success-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-200 truncate">{importFile.name}</p>
                        <p className="text-xs text-zinc-600">{fmtSize(importFile.size)}</p>
                      </div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); setImportFile(null); setImportResult(null); setImportError(''); }}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-error-400 hover:bg-error-500/10 transition-all shrink-0">
                      <Icon icon="solar:close-circle-linear" width={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Icon icon="solar:cloud-upload-linear" width={24} className="text-zinc-600 mx-auto mb-2" />
                    <p className="text-sm text-zinc-400">Drop your export ZIP here</p>
                    <p className="text-xs text-zinc-600 mt-0.5">or click to browse · max 100 MB</p>
                  </>
                )}
              </div>
            </div>

            {/* Conflict strategy */}
            <div>
              <p className="text-xs font-medium text-zinc-500 mb-2.5">Conflict resolution strategy</p>
              <div className="space-y-2">
                {STRATEGIES.map(s => (
                  <label key={s.value}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      strategy === s.value ? 'bg-primary-500/8 border-primary-500/25' : 'bg-[#18181B] border-zinc-800 hover:border-zinc-700'
                    }`}>
                    <input type="radio" name="strategy" value={s.value} checked={strategy === s.value}
                      onChange={() => setStrategy(s.value)} className="accent-primary-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Icon icon={s.icon} width={12} className={s.color} />
                        <span className={`text-xs font-semibold ${strategy === s.value ? 'text-primary-300' : 'text-zinc-300'}`}>{s.label}</span>
                      </div>
                      <p className="text-[10px] text-zinc-600 mt-0.5 leading-relaxed">{s.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {importError && (
              <div className="bg-error-500/10 border border-error-500/20 rounded-xl p-3 flex gap-2">
                <Icon icon="solar:danger-circle-linear" width={14} className="text-error-400 mt-0.5 shrink-0" />
                <p className="text-xs text-error-400 break-words">{importError}</p>
              </div>
            )}

            {importConfirm ? (
              <div className="space-y-2">
                <div className="bg-error-500/10 border border-error-500/20 rounded-xl p-3 flex gap-2">
                  <Icon icon="solar:danger-triangle-linear" width={14} className="text-error-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-zinc-400">
                    <span className="text-error-400 font-semibold">Warning:</span> This will modify live database records using the <strong>{STRATEGIES.find(s => s.value === strategy)?.label}</strong> strategy. This cannot be undone.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setImportConfirm(false)} className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-all">Cancel</button>
                  <button onClick={handleImport} className="flex-1 py-2 rounded-xl bg-error-500 hover:bg-error-400 text-white text-sm font-medium transition-all inline-flex items-center justify-center gap-2">
                    <Icon icon="solar:cloud-upload-linear" width={14} />Confirm Import
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setImportConfirm(true)} disabled={!importFile || importing}
                className="w-full inline-flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-400 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(51, 112, 246,0.15)]">
                <Icon icon={importing ? 'solar:loading-linear' : 'solar:cloud-upload-linear'} width={16} className={importing ? 'animate-spin' : ''} />
                {importing ? 'Importing…' : 'Import Database'}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Import Results ────────────────────────────────────────────────── */}
      {importResult && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Icon icon="solar:document-text-linear" width={16} className="text-zinc-500" />
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Import Results</h2>
          </div>
          <ImportResults result={importResult} onClose={() => setImportResult(null)} />
        </section>
      )}
    </div>

    {/* Selective Export Modal */}
    {selectiveOpen && <SelectiveExportModal onClose={() => setSelectiveOpen(false)} />}
    </>
  );
}
