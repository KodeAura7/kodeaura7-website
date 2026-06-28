import { useRef, useState } from 'react';
import Icon from '../../components/Icon';
import { adminApi } from '../../services/adminApi';
import { useToast } from '../../contexts/ToastContext';

const STRATEGIES = [
  {
    value: 'skip',
    label: 'Skip existing',
    desc: 'Import only new records. Any record that already exists (matched by primary key) is left unchanged.',
    icon: 'solar:skip-next-linear',
    color: 'text-emerald-400',
  },
  {
    value: 'replace',
    label: 'Replace existing',
    desc: 'Insert new records and overwrite all fields of existing records. Use to fully sync from the backup.',
    icon: 'solar:refresh-bold',
    color: 'text-amber-400',
  },
  {
    value: 'merge',
    label: 'Merge (fill gaps)',
    desc: 'Insert new records and only fill NULL fields in existing records. Existing data is never overwritten.',
    icon: 'solar:merge-cells-bold',
    color: 'text-indigo-400',
  },
];

const COLLECTION_LABELS = {
  admin_users: 'Admin Users',
  permissions: 'Permissions',
  services: 'Services',
  service_history: 'Service History',
  social_links: 'Social Links',
  page_content: 'Page Content',
  page_content_history: 'Page History',
  contact_form_fields: 'Contact Form Fields',
  testimonials: 'Testimonials',
  contact_messages: 'Contacts',
  newsletter_subscribers: 'Newsletter',
  list_views: 'List Views',
  list_view_filters: 'List View Filters',
  list_view_pins: 'List View Pins',
  list_view_recents: 'List View Recents',
  audit_logs: 'Audit Logs',
};

function CollectionRow({ col }) {
  const hasFailed = col.failed > 0;
  const hasErrors = col.errors?.length > 0;

  return (
    <div className={`flex items-start justify-between gap-4 py-2.5 border-b border-zinc-800/50 last:border-0 ${hasFailed ? 'opacity-90' : ''}`}>
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-200">{COLLECTION_LABELS[col.name] || col.name}</p>
        {col.error && <p className="text-xs text-rose-400 mt-0.5">{col.error}</p>}
        {hasErrors && (
          <div className="mt-1 space-y-0.5">
            {col.errors.map((e, i) => (
              <p key={i} className="text-[10px] font-mono text-rose-400/70 truncate max-w-sm">{e}</p>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0 text-xs">
        {col.created > 0 && (
          <span className="flex items-center gap-1 text-emerald-400">
            <Icon icon="solar:add-circle-linear" width={12} />{col.created}
          </span>
        )}
        {col.updated > 0 && (
          <span className="flex items-center gap-1 text-amber-400">
            <Icon icon="solar:refresh-linear" width={12} />{col.updated}
          </span>
        )}
        {col.skipped > 0 && (
          <span className="flex items-center gap-1 text-zinc-500">
            <Icon icon="solar:skip-next-linear" width={12} />{col.skipped}
          </span>
        )}
        {col.failed > 0 && (
          <span className="flex items-center gap-1 text-rose-400">
            <Icon icon="solar:danger-circle-linear" width={12} />{col.failed}
          </span>
        )}
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
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
            <Icon icon="solar:check-circle-bold" width={18} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Import Complete</h3>
            <p className="text-[11px] text-zinc-500">Strategy: {stratLabel} · Exported {sourceManifest?.exportedAt ? new Date(sourceManifest.exportedAt).toLocaleString() : ''}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all">
          <Icon icon="solar:close-circle-linear" width={18} />
        </button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-4 divide-x divide-zinc-800 border-b border-zinc-800">
        {[
          { label: 'Created', val: summary.totalCreated, icon: 'solar:add-circle-linear', color: 'text-emerald-400' },
          { label: 'Updated', val: summary.totalUpdated, icon: 'solar:refresh-linear',    color: 'text-amber-400' },
          { label: 'Skipped', val: summary.totalSkipped, icon: 'solar:skip-next-linear',  color: 'text-zinc-400' },
          { label: 'Failed',  val: summary.totalFailed,  icon: 'solar:danger-circle-linear', color: summary.totalFailed > 0 ? 'text-rose-400' : 'text-zinc-600' },
        ].map(({ label, val, icon, color }) => (
          <div key={label} className="px-4 py-4 text-center">
            <Icon icon={icon} width={16} className={`${color} mx-auto mb-1`} />
            <p className={`text-xl font-bold font-mono ${color}`}>{val}</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Per-collection breakdown */}
      <div className="px-6 py-4 max-h-80 overflow-y-auto">
        {collections.map(col => <CollectionRow key={col.name} col={col} />)}
      </div>
    </div>
  );
}

export default function SystemSettings() {
  const { success, error: toastError } = useToast();

  // Export state
  const [exporting, setExporting] = useState(false);
  const [exportConfirm, setExportConfirm] = useState(false);

  // Import state
  const [importFile, setImportFile] = useState(null);
  const [strategy, setStrategy] = useState('skip');
  const [importing, setImporting] = useState(false);
  const [importConfirm, setImportConfirm] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef();

  // ── Export ──────────────────────────────────────────────────────────────────

  const handleExport = async () => {
    setExportConfirm(false);
    setExporting(true);
    try {
      await adminApi.exportDatabase();
      success('Export complete', 'ZIP file downloaded successfully.');
    } catch (e) {
      toastError('Export failed', e.message);
    } finally {
      setExporting(false);
    }
  };

  // ── Import ──────────────────────────────────────────────────────────────────

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
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
    setImportConfirm(false);
    setImporting(true);
    setImportError('');
    setImportResult(null);
    try {
      const result = await adminApi.importDatabase(importFile, strategy);
      setImportResult(result);
      success('Import complete', `${result.summary.totalCreated} created · ${result.summary.totalUpdated} updated · ${result.summary.totalSkipped} skipped`);
    } catch (e) {
      setImportError(e.message);
      toastError('Import failed', e.message);
    } finally {
      setImporting(false);
    }
  };

  const fmtSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-display font-semibold text-2xl text-zinc-100">System Settings</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 uppercase tracking-widest">Super Admin</span>
          </div>
          <p className="text-sm text-zinc-500">Database management and system-level operations.</p>
        </div>
      </div>

      {/* ── Database Management ──────────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Icon icon="solar:database-linear" width={16} className="text-zinc-500" />
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Database Management</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* ── Export Card ─────────────────────────────────────────────────── */}
          <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-6 flex flex-col gap-5">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Icon icon="solar:cloud-download-linear" width={20} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">Export Database</h3>
                <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                  Download a complete snapshot of all application data as a ZIP archive. Each collection is exported as a separate JSON file with a manifest.
                </p>
              </div>
            </div>

            {/* What's included */}
            <div className="bg-[#18181B] border border-zinc-800 rounded-xl p-4">
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-2">Includes</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {Object.entries(COLLECTION_LABELS).map(([, label]) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Icon icon="solar:check-read-linear" width={10} className="text-emerald-500/70 shrink-0" />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {!exportConfirm ? (
              <button onClick={() => setExportConfirm(true)} disabled={exporting}
                className="w-full inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-60 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                <Icon icon={exporting ? 'solar:loading-linear' : 'solar:cloud-download-linear'} width={16} className={exporting ? 'animate-spin' : ''} />
                {exporting ? 'Exporting…' : 'Export Database'}
              </button>
            ) : (
              <div className="space-y-2">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-2">
                  <Icon icon="solar:danger-triangle-linear" width={14} className="text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-zinc-400">This will download all data including admin accounts (passwords are hashed). Keep the ZIP file secure.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setExportConfirm(false)} className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-all">Cancel</button>
                  <button onClick={handleExport} className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium transition-all inline-flex items-center justify-center gap-2">
                    <Icon icon="solar:cloud-download-linear" width={14} />Confirm Export
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Import Card ─────────────────────────────────────────────────── */}
          <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-6 flex flex-col gap-5">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <Icon icon="solar:cloud-upload-linear" width={20} className="text-indigo-400" />
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
                dragOver ? 'border-indigo-500 bg-indigo-500/5' :
                importFile ? 'border-emerald-500/40 bg-emerald-500/5 cursor-default' :
                'border-zinc-700 hover:border-zinc-500 bg-[#18181B]'
              }`}
            >
              <input ref={fileInputRef} type="file" accept=".zip" className="hidden" onChange={handleFileSelect} />
              <div className="px-4 py-6 text-center">
                {importFile ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-left min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                        <Icon icon="solar:zip-file-linear" width={18} className="text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-200 truncate">{importFile.name}</p>
                        <p className="text-xs text-zinc-600">{fmtSize(importFile.size)}</p>
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setImportFile(null); setImportResult(null); setImportError(''); }}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all shrink-0">
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
                      strategy === s.value
                        ? 'bg-indigo-500/8 border-indigo-500/25'
                        : 'bg-[#18181B] border-zinc-800 hover:border-zinc-700'
                    }`}>
                    <input type="radio" name="strategy" value={s.value} checked={strategy === s.value}
                      onChange={() => setStrategy(s.value)} className="accent-indigo-500 mt-0.5 shrink-0" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Icon icon={s.icon} width={12} className={s.color} />
                        <span className={`text-xs font-semibold ${strategy === s.value ? 'text-indigo-300' : 'text-zinc-300'}`}>{s.label}</span>
                      </div>
                      <p className="text-[10px] text-zinc-600 mt-0.5 leading-relaxed">{s.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {importError && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex gap-2">
                <Icon icon="solar:danger-circle-linear" width={14} className="text-rose-400 mt-0.5 shrink-0" />
                <p className="text-xs text-rose-400 break-words">{importError}</p>
              </div>
            )}

            {!importConfirm ? (
              <button onClick={() => setImportConfirm(true)} disabled={!importFile || importing}
                className="w-full inline-flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                <Icon icon={importing ? 'solar:loading-linear' : 'solar:cloud-upload-linear'} width={16} className={importing ? 'animate-spin' : ''} />
                {importing ? 'Importing…' : 'Import Database'}
              </button>
            ) : (
              <div className="space-y-2">
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex gap-2">
                  <Icon icon="solar:danger-triangle-linear" width={14} className="text-rose-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-zinc-400">
                    <span className="text-rose-400 font-semibold">Warning:</span> This will modify live database records using the <strong>{STRATEGIES.find(s => s.value === strategy)?.label}</strong> strategy. This cannot be undone.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setImportConfirm(false)} className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-all">Cancel</button>
                  <button onClick={handleImport} className="flex-1 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-sm font-medium transition-all inline-flex items-center justify-center gap-2">
                    <Icon icon="solar:cloud-upload-linear" width={14} />Confirm Import
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Import Results ──────────────────────────────────────────────────── */}
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
  );
}
