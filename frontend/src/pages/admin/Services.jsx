import { useEffect, useRef, useState } from 'react';
import Icon from '../../components/Icon';
import { adminApi } from '../../services/adminApi';
import { TableToolbar } from '../../components/admin/TableToolbar';
import { useColumnVisibility } from '../../hooks/useColumnVisibility';
import { useToast } from '../../contexts/ToastContext';
import { usePermissions } from '../../contexts/PermissionsContext';
import { useListViews } from '../../hooks/useListViews';
import ListViewSelector from '../../components/admin/listviews/ListViewSelector';
import MigrateModal from '../../components/admin/MigrateModal';

const SVC_COLS = [
  { key: 'num', label: '#' },
  { key: 'order', label: 'Order' },
  { key: 'service', label: 'Service' },
  { key: 'features', label: 'Features', default: false },
  { key: 'home', label: 'Home' },
  { key: 'last_modified', label: 'Last Modified', default: false },
  { key: 'site', label: 'Site' },
];

const SVC_FILTER_GROUPS = [
  {
    key: 'enabled',
    label: 'Site Visibility',
    options: [
      { value: 'true', label: 'Enabled' },
      { value: 'false', label: 'Disabled' },
    ],
  },
  {
    key: 'home',
    label: 'Home Page',
    options: [
      { value: 'true', label: 'Shown on Home' },
      { value: 'false', label: 'Hidden from Home' },
    ],
  },
];

const SVC_SORT_OPTIONS = [
  { value: 'sort_order', label: 'Sort Order' },
  { value: 'name', label: 'Name' },
  { value: 'updated_at', label: 'Last Modified' },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const INPUT = 'w-full bg-[#18181B] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all';
const TEXTAREA = INPUT + ' resize-none';

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  slug: '', name: '', icon: 'solar:code-square-linear',
  accent: '#6366F1', light: '#A5B4FC', description: '',
  p1: '', p2: '', cta_label: '',
  features: [],
  metrics: [{ value: '', label: '' }, { value: '', label: '' }, { value: '', label: '' }],
  sort_order: 0, enabled: true, show_on_home: true
};

const FIELD_LABELS = {
  slug: 'Slug', name: 'Name', icon: 'Icon', accent: 'Accent Color', light: 'Light Color',
  description: 'Short Description', p1: 'Paragraph 1', p2: 'Paragraph 2',
  cta_label: 'CTA Label', sort_order: 'Sort Order', enabled: 'Enabled',
  show_on_home: 'Show on Home', features: 'Features', metrics: 'Metrics'
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function padMetrics(metrics) {
  const filled = (metrics || []).slice(0, 3);
  while (filled.length < 3) filled.push({ value: '', label: '' });
  return filled;
}

function parseFieldValue(field, raw) {
  if (field === 'enabled' || field === 'show_on_home') return raw === 'true';
  if (field === 'sort_order') return parseInt(raw) || 0;
  if (field === 'features') { try { return JSON.parse(raw); } catch { return []; } }
  if (field === 'metrics') { try { return padMetrics(JSON.parse(raw)); } catch { return padMetrics([]); } }
  return raw ?? '';
}

function historyDisplayValue(field, value) {
  if (value === null || value === undefined || value === '') return '(empty)';
  if (field === 'features' || field === 'metrics') {
    try { const a = JSON.parse(value); return `${a.length} item${a.length !== 1 ? 's' : ''}`; } catch { return '…'; }
  }
  if (field === 'enabled' || field === 'show_on_home') return value === 'true' ? 'Yes' : 'No';
  const s = String(value);
  return s.length > 32 ? s.slice(0, 32) + '…' : s;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function formFromItem(item) {
  return {
    ...item,
    metrics: padMetrics(item.metrics),
    features: item.features || [],
    cta_label: item.cta_label || '',
    show_on_home: item.show_on_home !== false,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ColorInput({ label, value, onChange }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-zinc-400">{label}</label>
      <div className="flex items-center gap-2">
        <label className="relative w-10 h-10 rounded-xl border border-zinc-700 overflow-hidden cursor-pointer shrink-0">
          <div className="w-full h-full" style={{ background: value }} />
          <input type="color" value={value} onChange={e => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
        </label>
        <input type="text" value={value} onChange={e => onChange(e.target.value)} className={INPUT + ' font-mono text-xs'} />
      </div>
    </div>
  );
}

function Toggle({ value, onChange, colorOn = 'bg-emerald-500' }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${value ? colorOn : 'bg-zinc-700'}`}>
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${value ? 'translate-x-4' : 'translate-x-1'}`} />
    </button>
  );
}

function StatusBadge({ on, onLabel, offLabel, colorOn = 'bg-emerald-500/10 text-emerald-400', dotOn = 'bg-emerald-400' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${on ? colorOn : 'bg-zinc-800 text-zinc-500'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${on ? dotOn : 'bg-zinc-600'}`} />
      {on ? onLabel : offLabel}
    </span>
  );
}

function ViewField({ label, value, mono = false, children }) {
  return (
    <div>
      <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mb-1">{label}</p>
      {children ?? <p className={`text-sm text-zinc-200 leading-relaxed ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>}
    </div>
  );
}

function OrderCell({ id, initialOrder, onSaved, onError }) {
  const [val, setVal] = useState(String(initialOrder ?? 0));
  const [saving, setSaving] = useState(false);
  const ref = useRef(null);
  const commit = async () => {
    const num = parseInt(val);
    if (isNaN(num) || num === (initialOrder ?? 0)) return;
    setSaving(true);
    try { await adminApi.setServiceOrder(id, num); onSaved(id, num); }
    catch (e) { onError(e.message); setVal(String(initialOrder ?? 0)); }
    finally { setSaving(false); }
  };
  return (
    <div className="flex items-center gap-1.5">
      <input ref={ref} type="number" min="0" value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit(); ref.current?.blur(); } }}
        disabled={saving}
        className="w-14 bg-[#18181B] border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-200 text-center focus:outline-none focus:border-indigo-500/50 disabled:opacity-50" />
      {saving ? <Icon icon="solar:loading-linear" width={12} className="text-zinc-600 animate-spin" /> : null}
    </div>
  );
}

// ─── History Sidebar ──────────────────────────────────────────────────────────

function HistorySidebar({ serviceId, editMode, onRevert, open, onToggle, historyKey }) {
  const [history, setHistory] = useState(null);

  useEffect(() => {
    if (!serviceId) return;
    setHistory(null);
    adminApi.getServiceHistory(serviceId).then(setHistory).catch(() => setHistory([]));
  }, [serviceId, historyKey]);

  return (
    <aside className={`sticky top-0 h-screen border-l border-zinc-800 bg-[#0A0A0C] shrink-0 flex flex-col overflow-hidden transition-all duration-300 ${open ? 'w-80' : 'w-10'}`}>
      <div className={`flex items-center px-3 py-4 border-b border-zinc-800 shrink-0 ${open ? 'justify-between' : 'justify-center'}`}>
        {open ? <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Edit History</span> : null}
        <button onClick={onToggle} title={open ? 'Collapse history' : 'Show history'}
          className="p-1 text-zinc-600 hover:text-zinc-300 transition-colors shrink-0">
          <Icon icon={open ? 'solar:alt-arrow-right-linear' : 'solar:alt-arrow-left-linear'} width={14} />
        </button>
      </div>

      {open ? (
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/40 min-w-[320px]">
          {!history ? (
            <p className="p-5 text-xs text-zinc-600 text-center">Loading…</p>
          ) : history.length === 0 ? (
            <p className="p-5 text-xs text-zinc-600 text-center">No edit history yet.</p>
          ) : (
            history.map(entry => (
              <div key={entry.id} className="p-4">
                <div className="mb-3">
                  <p className="text-xs font-medium text-zinc-200">{entry.updated_by_name}</p>
                  <p className="text-[10px] text-zinc-600 font-mono mt-0.5">{fmtDate(entry.updated_at)}</p>
                </div>
                <div className="space-y-2">
                  {(entry.changes || []).map((c, i) => (
                    <div key={i} className="rounded-lg bg-zinc-900/60 border border-zinc-800/50 p-2.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono font-medium text-zinc-500">{FIELD_LABELS[c.field] || c.field}</span>
                        {editMode ? (
                          <button onClick={() => onRevert(c.field, c.from)}
                            className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 px-1.5 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 transition-all shrink-0 ml-2">
                            Revert
                          </button>
                        ) : null}
                      </div>
                      <div className="flex items-start gap-1.5 text-[10px]">
                        <span className="text-rose-400 line-through break-all">{historyDisplayValue(c.field, c.from)}</span>
                        <Icon icon="solar:arrow-right-linear" width={8} className="text-zinc-700 mt-0.5 shrink-0" />
                        <span className="text-emerald-400 break-all">{historyDisplayValue(c.field, c.to)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}
    </aside>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminServices() {
  const { success, error: toastError } = useToast();
  const { canDo } = usePermissions();
  const lv = useListViews('services');
  const [view, setView] = useState('list');
  const [editMode, setEditMode] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [historyKey, setHistoryKey] = useState(0);

  const [items, setItems] = useState(null);
  const [currentItem, setCurrentItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selected, setSelected] = useState(new Set());
  const [migrateOpen, setMigrateOpen] = useState(false);

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState({ type: '', text: '' });
  const importInputRef = useRef(null);

  const [svcSearch, setSvcSearch] = useState('');
  const [svcSort, setSvcSort] = useState('sort_order');
  const [svcDir, setSvcDir] = useState('asc');
  const [svcFilters, setSvcFilters] = useState({});
  const { visibleCols: svcCols, visibleOrdered: svcVisibleOrdered, allOrdered: svcAllOrdered, toggle: toggleSvcCol, reset: resetSvcCols, reorder: reorderSvcCols } = useColumnVisibility('services', SVC_COLS);

  const handleSvcFilter = (key, val) => setSvcFilters(f => ({ ...f, [key]: val }));

  const loadAll = () => {
    setError('');
    adminApi.services({ list_view_id: lv.activeId || '' })
      .then(setItems)
      .catch(e => setError(e.message));
  };
  useEffect(() => { loadAll(); }, [lv.activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openRecord = item => {
    setCurrentItem(item);
    setForm(formFromItem(item));
    setEditMode(false);
    setError('');
    setView('record');
  };

  const openNew = () => {
    setCurrentItem(null);
    setForm({ ...EMPTY_FORM });
    setEditMode(true);
    setError('');
    setView('record');
  };

  const enterEdit = () => { setEditMode(true); setError(''); };

  const cancelEdit = () => {
    setError('');
    if (currentItem) { setForm(formFromItem(currentItem)); setEditMode(false); }
    else backToList();
  };

  const backToList = () => { setView('list'); setCurrentItem(null); setEditMode(false); setError(''); };

  const handleRevert = (field, fromValue) => setField(field, parseFieldValue(field, fromValue));

  const addFeature = () => setForm(f => ({ ...f, features: [...f.features, { label: '', enabled: true }] }));
  const removeFeature = i => setForm(f => ({ ...f, features: f.features.filter((_, idx) => idx !== i) }));
  const setFeatureLabel = (i, label) => setForm(f => ({ ...f, features: f.features.map((feat, idx) => idx === i ? { ...feat, label } : feat) }));
  const toggleFeature = i => setForm(f => ({ ...f, features: f.features.map((feat, idx) => idx === i ? { ...feat, enabled: !feat.enabled } : feat) }));
  const setMetric = (i, key, val) => setForm(f => ({ ...f, metrics: f.metrics.map((m, idx) => idx === i ? { ...m, [key]: val } : m) }));

  const toggleSelect = id => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allSelected = !!(items && items.length > 0 && selected.size === items.length);
  const someSelected = selected.size > 0;

  const handleToggleEnabled = async (id, current) => {
    setToggling(id);
    try {
      await adminApi.setServiceEnabled(id, !current);
      setItems(prev => prev.map(s => s.id === id ? { ...s, enabled: !current } : s));
      success(!current ? 'Service enabled' : 'Service disabled');
    }
    catch (e) { setError(e.message); toastError('Failed', e.message); }
    finally { setToggling(null); }
  };

  const handleOrderSaved = (id, newOrder) =>
    setItems(prev => [...prev.map(s => s.id === id ? { ...s, sort_order: newOrder } : s)].sort((a, b) => a.sort_order - b.sort_order));

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const payload = { ...form, metrics: form.metrics.filter(m => m.value || m.label), features: form.features.filter(f => f.label) };
      if (currentItem) {
        const updated = await adminApi.updateService(currentItem.id, payload);
        setCurrentItem(updated);
        setForm(formFromItem(updated));
        setItems(prev => prev ? prev.map(s => s.id === currentItem.id ? updated : s) : prev);
        setHistoryKey(k => k + 1);
        setEditMode(false);
        success('Service updated', `${updated.name} saved.`);
      } else {
        const created = await adminApi.createService(payload);
        setItems(prev => [...(prev || []), created].sort((a, b) => a.sort_order - b.sort_order));
        setCurrentItem(created);
        setForm(formFromItem(created));
        setHistoryKey(k => k + 1);
        setEditMode(false);
        success('Service created', `${created.name} added.`);
      }
    } catch (e) { setError(e.message); toastError('Save failed', e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!currentItem || !window.confirm(`Delete "${currentItem.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await adminApi.deleteService(currentItem.id);
      setItems(prev => prev.filter(s => s.id !== currentItem.id));
      success('Service deleted', `"${currentItem.name}" removed.`);
      backToList();
    }
    catch (e) { setError(e.message); toastError('Delete failed', e.message); }
    finally { setDeleting(false); }
  };

  const handleExport = async () => {
    setExporting(true);
    try { await adminApi.exportServices([...selected]); success('Exported', 'CSV downloaded.'); }
    catch (e) { setError(e.message); toastError('Export failed', e.message); }
    finally { setExporting(false); }
  };

  const handleBulkDelete = async () => {
    setBulkDeleteConfirm(false);
    setBulkDeleting(true);
    try {
      const result = await adminApi.bulkDeleteServices([...selected]);
      setSelected(new Set());
      success('Deleted', `${result.deleted} service${result.deleted !== 1 ? 's' : ''} removed.`);
      loadAll();
    } catch (e) {
      toastError('Delete failed', e.message);
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleImportFile = async e => {
    const file = e.target.files?.[0];
    if (importInputRef.current) importInputRef.current.value = '';
    if (!file) return;
    setImporting(true); setImportMsg({ type: '', text: '' });
    try {
      const csv = await file.text();
      const result = await adminApi.importServices(csv);
      setImportMsg({ type: 'success', text: `Imported ${result.imported} service${result.imported !== 1 ? 's' : ''}.` });
      success('Import complete', `${result.imported} service${result.imported !== 1 ? 's' : ''} imported.`);
      loadAll();
    } catch (e) { setImportMsg({ type: 'error', text: e.message }); toastError('Import failed', e.message); }
    finally { setImporting(false); }
  };

  // ─── RECORD PAGE ────────────────────────────────────────────────────────────

  if (view === 'record') {
    const isNew = !currentItem;

    return (
      <div className="flex min-h-screen">
        {/* Main scrollable area */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="p-6 md:p-8 max-w-3xl">

            {/* Header */}
            <div className="mb-6 flex items-center gap-3 flex-wrap">
              <button onClick={backToList} className="p-2 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 transition-all shrink-0">
                <Icon icon="solar:arrow-left-linear" width={18} />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="font-display font-semibold text-2xl text-zinc-100 truncate">
                  {isNew ? 'New Service' : currentItem.name}
                </h1>
                {!isNew ? <p className="text-xs text-zinc-600 font-mono mt-0.5">{currentItem.num} · {currentItem.slug}</p> : null}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!editMode && !isNew ? (
                  <>
                    <button onClick={() => setHistoryOpen(v => !v)}
                      className={`inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium border transition-all ${historyOpen ? 'bg-zinc-800 border-zinc-600 text-zinc-100' : 'bg-[#18181B] border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:border-zinc-500'}`}>
                      <Icon icon="solar:history-linear" width={15} />
                      History
                    </button>
                    <button onClick={enterEdit} className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl px-5 py-2.5 text-sm font-medium transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                      <Icon icon="solar:pen-linear" width={15} />Edit
                    </button>
                  </>
                ) : (
                  <>
                    {currentItem && canDo('services.delete') ? (
                      <button onClick={handleDelete} disabled={deleting} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium border bg-[#18181B] border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-all disabled:opacity-50">
                        <Icon icon={deleting ? 'solar:loading-linear' : 'solar:trash-bin-minimalistic-linear'} width={15} className={deleting ? 'animate-spin' : ''} />
                        Delete
                      </button>
                    ) : null}
                    <button onClick={cancelEdit} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium border bg-[#18181B] border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 transition-all">
                      Cancel
                    </button>
                    <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl px-5 py-2.5 text-sm font-medium transition-all disabled:opacity-60 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                      <Icon icon={saving ? 'solar:loading-linear' : 'solar:floppy-disk-linear'} width={15} className={saving ? 'animate-spin' : ''} />
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {error ? <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-sm text-rose-400 mb-6">{error}</div> : null}

            {/* ─── VIEW MODE ─── */}
            {!editMode && !isNew ? (
              <div className="space-y-5">
                <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-6">
                  <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-5">Identity</h2>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                    <ViewField label="Name" value={currentItem.name} />
                    <ViewField label="Slug" value={currentItem.slug} mono />
                    <ViewField label="Icon" value={currentItem.icon} mono />
                    <ViewField label="CTA Label">
                      {currentItem.cta_label
                        ? <p className="text-sm text-zinc-200">{currentItem.cta_label}</p>
                        : <p className="text-sm text-zinc-600 italic">Auto: Start a {currentItem.name} Project</p>}
                    </ViewField>
                  </div>
                </div>

                <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-6">
                  <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-5">Style</h2>
                  <div className="grid grid-cols-2 gap-6 mb-5">
                    <ViewField label="Accent Color">
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-6 h-6 rounded-md border border-zinc-700" style={{ background: currentItem.accent }} />
                        <span className="text-sm font-mono text-zinc-200">{currentItem.accent}</span>
                      </div>
                    </ViewField>
                    <ViewField label="Light Color">
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-6 h-6 rounded-md border border-zinc-700" style={{ background: currentItem.light }} />
                        <span className="text-sm font-mono text-zinc-200">{currentItem.light}</span>
                      </div>
                    </ViewField>
                  </div>
                  <div className="rounded-xl p-4 border" style={{ background: `color-mix(in srgb,${currentItem.accent} 8%,transparent)`, borderColor: `color-mix(in srgb,${currentItem.accent} 22%,transparent)` }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#18181B] border border-zinc-800 flex items-center justify-center shrink-0" style={{ color: currentItem.accent }}>
                        <Icon icon={currentItem.icon || 'solar:code-square-linear'} width={20} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-100">{currentItem.name}</p>
                        <p className="text-xs text-zinc-500">{currentItem.cta_label || `Start a ${currentItem.name} Project →`}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-6">
                  <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-5">Description</h2>
                  <div className="space-y-5">
                    <ViewField label="Short Description" value={currentItem.description} />
                    <ViewField label="Paragraph 1" value={currentItem.p1} />
                    <ViewField label="Paragraph 2" value={currentItem.p2} />
                  </div>
                </div>

                <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-6">
                  <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">What's Included</h2>
                  {(currentItem.features || []).length === 0
                    ? <p className="text-xs text-zinc-600">No features defined.</p>
                    : (
                      <ul className="space-y-2">
                        {(currentItem.features || []).map((feat, i) => {
                          const label = typeof feat === 'string' ? feat : feat.label;
                          const on = typeof feat === 'string' ? true : feat.enabled !== false;
                          return (
                            <li key={i} className={`flex items-center gap-2.5 text-sm ${on ? 'text-zinc-200' : 'text-zinc-600 line-through'}`}>
                              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${on ? 'border-indigo-500 bg-indigo-500' : 'border-zinc-700'}`}>
                                {on ? <Icon icon="solar:check-read-linear" width={10} className="text-white" /> : null}
                              </div>
                              {label}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                </div>

                {(currentItem.metrics || []).filter(m => m.value || m.label).length > 0 ? (
                  <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-6">
                    <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Metrics</h2>
                    <div className="grid grid-cols-3 gap-3">
                      {(currentItem.metrics || []).filter(m => m.value || m.label).map((m, i) => (
                        <div key={i} className="bg-[#18181B] border border-zinc-800 rounded-xl px-3 py-3 text-center">
                          <p className="font-display text-xl font-semibold text-zinc-100">{m.value}</p>
                          <p className="text-[11px] text-zinc-500 mt-1">{m.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-6">
                  <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-5">Settings</h2>
                  <div className="grid grid-cols-3 gap-6">
                    <ViewField label="Sort Order" value={String(currentItem.sort_order)} mono />
                    <ViewField label="Visible on Site">
                      <StatusBadge on={currentItem.enabled} onLabel="Enabled" offLabel="Hidden" />
                    </ViewField>
                    <ViewField label="Show on Home">
                      <StatusBadge on={currentItem.show_on_home} onLabel="Shown" offLabel="Hidden" colorOn="bg-indigo-500/10 text-indigo-400" dotOn="bg-indigo-400" />
                    </ViewField>
                  </div>
                </div>
              </div>
            ) : (
              /* ─── EDIT / NEW FORM ─── */
              <div className="space-y-5">
                <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-6 space-y-4">
                  <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Identity</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-400">Name <span className="text-rose-500">*</span></label>
                      <input type="text" value={form.name}
                        onChange={e => { setField('name', e.target.value); if (!currentItem) setField('slug', toSlug(e.target.value)); }}
                        className={INPUT} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-400">Slug <span className="text-rose-500">*</span></label>
                      <input type="text" value={form.slug} onChange={e => setField('slug', e.target.value)} className={INPUT + ' font-mono text-xs'} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-400">Icon (Iconify ID)</label>
                      <input type="text" value={form.icon} onChange={e => setField('icon', e.target.value)} className={INPUT + ' font-mono text-xs'} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-400">CTA Label</label>
                      <input type="text" value={form.cta_label} onChange={e => setField('cta_label', e.target.value)}
                        placeholder={`Start a ${form.name || 'Service'} Project`} className={INPUT} />
                      <p className="text-[10px] text-zinc-700">Leave empty to auto-generate.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-6 space-y-4">
                  <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Style</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ColorInput label="Accent Color" value={form.accent} onChange={v => setField('accent', v)} />
                    <ColorInput label="Light Color" value={form.light} onChange={v => setField('light', v)} />
                  </div>
                  <div className="rounded-xl p-4 border" style={{ background: `color-mix(in srgb,${form.accent} 8%,transparent)`, borderColor: `color-mix(in srgb,${form.accent} 22%,transparent)` }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#18181B] border border-zinc-800 flex items-center justify-center shrink-0" style={{ color: form.accent }}>
                        <Icon icon={form.icon || 'solar:code-square-linear'} width={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-100 truncate">{form.name || 'Service Name'}</p>
                        <p className="text-xs text-zinc-500 truncate">{form.cta_label || `Start a ${form.name || 'Service'} Project →`}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-6 space-y-4">
                  <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Description</h2>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400">Short Description</label>
                    <textarea value={form.description} onChange={e => setField('description', e.target.value)} rows={2} className={TEXTAREA} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400">Paragraph 1</label>
                    <textarea value={form.p1} onChange={e => setField('p1', e.target.value)} rows={3} className={TEXTAREA} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400">Paragraph 2</label>
                    <textarea value={form.p2} onChange={e => setField('p2', e.target.value)} rows={3} className={TEXTAREA} />
                  </div>
                </div>

                <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">What's Included</h2>
                      <p className="text-[11px] text-zinc-700 mt-0.5">Check = visible. First 3 enabled appear on home cards.</p>
                    </div>
                    <button onClick={addFeature} className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                      <Icon icon="solar:add-circle-linear" width={14} />Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form.features.map((feat, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <button type="button" onClick={() => toggleFeature(i)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${feat.enabled ? 'border-indigo-500 bg-indigo-500' : 'border-zinc-600'}`}>
                          {feat.enabled ? <Icon icon="solar:check-read-linear" width={11} className="text-white" /> : null}
                        </button>
                        <input type="text" value={feat.label} onChange={e => setFeatureLabel(i, e.target.value)}
                          placeholder="Feature item" className={`flex-1 ${INPUT} ${!feat.enabled ? 'opacity-50' : ''}`} />
                        <button onClick={() => removeFeature(i)} className="p-1.5 text-zinc-600 hover:text-rose-400 transition-colors shrink-0">
                          <Icon icon="solar:close-circle-linear" width={16} />
                        </button>
                      </div>
                    ))}
                    {form.features.length === 0 ? <p className="text-xs text-zinc-600 text-center py-2">No items yet.</p> : null}
                  </div>
                </div>

                <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-6 space-y-4">
                  <div>
                    <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Metrics</h2>
                    <p className="text-[11px] text-zinc-700 mt-0.5">Up to 3 stat tiles in the service visual panel.</p>
                  </div>
                  {[0, 1, 2].map(i => (
                    <div key={i} className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-500">Tile {i + 1} — Value</label>
                        <input type="text" value={form.metrics[i]?.value || ''} onChange={e => setMetric(i, 'value', e.target.value)} placeholder="e.g. 50ms" className={INPUT} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-500">Tile {i + 1} — Label</label>
                        <input type="text" value={form.metrics[i]?.label || ''} onChange={e => setMetric(i, 'label', e.target.value)} placeholder="e.g. Avg Load" className={INPUT} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-6 space-y-4">
                  <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Settings</h2>
                  <div className="flex flex-wrap items-end gap-8">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-400">Sort Order</label>
                      <input type="number" value={form.sort_order} onChange={e => setField('sort_order', parseInt(e.target.value) || 0)}
                        className="w-24 bg-[#18181B] border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 text-center focus:outline-none focus:border-indigo-500/50 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-400">Visible on site</label>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Toggle value={form.enabled} onChange={v => setField('enabled', v)} />
                        <span className="text-xs text-zinc-400">{form.enabled ? 'Enabled' : 'Hidden'}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-400">Show on home page</label>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Toggle value={form.show_on_home} onChange={v => setField('show_on_home', v)} colorOn="bg-indigo-500" />
                        <span className="text-xs text-zinc-400">{form.show_on_home ? 'Shown' : 'Hidden from home'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* History sidebar */}
        {!isNew ? (
          <HistorySidebar
            serviceId={currentItem?.id}
            editMode={editMode}
            onRevert={handleRevert}
            open={historyOpen}
            onToggle={() => setHistoryOpen(v => !v)}
            historyKey={historyKey}
          />
        ) : null}
      </div>
    );
  }

  // ─── LIST VIEW ────────────────────────────────────────────────────────────────

  const enabledCount = items ? items.filter(s => s.enabled).length : 0;
  const homeCount = items ? items.filter(s => s.enabled && s.show_on_home).length : 0;

  const q = svcSearch.toLowerCase();
  const svcFiltered = (items || [])
    .filter(s =>
      (!q || s.name.toLowerCase().includes(q) || (s.slug || '').includes(q)) &&
      (!svcFilters.enabled || String(s.enabled) === svcFilters.enabled) &&
      (!svcFilters.home || String(s.show_on_home) === svcFilters.home)
    )
    .sort((a, b) => {
      if (svcSort === 'name') return svcDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      if (svcSort === 'updated_at') return svcDir === 'asc' ? new Date(a.updated_at) - new Date(b.updated_at) : new Date(b.updated_at) - new Date(a.updated_at);
      return svcDir === 'asc' ? (a.sort_order ?? 0) - (b.sort_order ?? 0) : (b.sort_order ?? 0) - (a.sort_order ?? 0);
    });

  return (
    <>
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-semibold text-2xl text-zinc-100">Services</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {items ? `${items.length} total · ${enabledCount} on site · ${homeCount} on home` : '—'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canDo('services.edit') && (
            <>
              <input ref={importInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportFile} />
              <button onClick={() => importInputRef.current?.click()} disabled={importing}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium border bg-[#18181B] border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-zinc-100 disabled:opacity-50 transition-all">
                <Icon icon={importing ? 'solar:loading-linear' : 'solar:import-linear'} width={16} className={importing ? 'animate-spin' : ''} />
                Import
              </button>
              <button onClick={openNew} className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                <Icon icon="solar:add-circle-linear" width={16} />Add Service
              </button>
            </>
          )}
        </div>
      </div>

      {/* List View Selector */}
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

      {importMsg.text ? (
        <div className={`border rounded-xl p-3 text-sm mb-4 flex items-center gap-2 ${importMsg.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
          <Icon icon={importMsg.type === 'error' ? 'solar:danger-circle-linear' : 'solar:check-circle-linear'} width={15} />
          {importMsg.text}
        </div>
      ) : null}
      {error ? <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-sm text-rose-400 mb-4">{error}</div> : null}

      <TableToolbar
        search={svcSearch} onSearch={setSvcSearch}
        onRefresh={loadAll}
        sortOptions={SVC_SORT_OPTIONS} sort={svcSort} dir={svcDir}
        onSort={(col, d) => { setSvcSort(col); setSvcDir(d); }}
        filterGroups={SVC_FILTER_GROUPS} filters={svcFilters} onFilter={handleSvcFilter}
        columns={SVC_COLS} allOrdered={svcAllOrdered} visibleCols={svcCols}
        onColumnsToggle={toggleSvcCol} onColumnsReset={resetSvcCols} onColumnsReorder={reorderSvcCols}
        placeholder="Search by name or slug…"
      >
        {canDo('services.view') && (
          <button onClick={handleExport} disabled={exporting || !items}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70 border border-transparent transition-all disabled:opacity-50">
            <Icon icon={exporting ? 'solar:loading-linear' : 'solar:export-linear'} width={13} className={exporting ? 'animate-spin' : ''} />
            {someSelected ? `Export (${selected.size})` : 'Export'}
          </button>
        )}
        <button onClick={() => setMigrateOpen(true)} disabled={!someSelected}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-transparent transition-all disabled:opacity-40 disabled:cursor-not-allowed">
          <Icon icon="solar:transfer-horizontal-linear" width={13} />
          {someSelected ? `Migrate (${selected.size})` : 'Migrate'}
        </button>
        {canDo('services.delete') && someSelected && (
          bulkDeleteConfirm ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-500">Delete {selected.size}?</span>
              <button onClick={handleBulkDelete} disabled={bulkDeleting}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-rose-500 text-white hover:bg-rose-400 transition-all disabled:opacity-50">
                <Icon icon={bulkDeleting ? 'solar:loading-linear' : 'solar:check-read-linear'} width={11} className={bulkDeleting ? 'animate-spin' : ''} />
                {bulkDeleting ? 'Deleting…' : 'Confirm'}
              </button>
              <button onClick={() => setBulkDeleteConfirm(false)} disabled={bulkDeleting}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setBulkDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent transition-all">
              <Icon icon="solar:trash-bin-minimalistic-linear" width={13} />
              Delete ({selected.size})
            </button>
          )
        )}
      </TableToolbar>

      <div className="bg-[#111113] border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#18181B] border-b border-zinc-800">
                <th className="px-4 py-3 w-10">
                  <button onClick={() => setSelected(allSelected ? new Set() : new Set((items || []).map(s => s.id)))}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${allSelected ? 'border-indigo-500 bg-indigo-500' : 'border-zinc-600'}`}>
                    {allSelected ? <Icon icon="solar:check-read-linear" width={9} className="text-white" /> : null}
                  </button>
                </th>
                {svcVisibleOrdered.map(c => (
                  <th key={c.key} className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider whitespace-nowrap">{c.label}</th>
                ))}
                <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {!items ? (
                <tr><td colSpan={svcCols.size + 2} className="px-4 py-10 text-center text-sm text-zinc-600">Loading…</td></tr>
              ) : svcFiltered.length === 0 ? (
                <tr><td colSpan={svcCols.size + 2} className="px-4 py-10 text-center text-sm text-zinc-600">No services found.</td></tr>
              ) : (
                svcFiltered.map((svc, idx) => (
                  <tr key={svc.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => toggleSelect(svc.id)}
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${selected.has(svc.id) ? 'border-indigo-500 bg-indigo-500' : 'border-zinc-600'}`}>
                        {selected.has(svc.id) ? <Icon icon="solar:check-read-linear" width={9} className="text-white" /> : null}
                      </button>
                    </td>
                    {svcVisibleOrdered.map(({ key }) => {
                      if (key === 'num') return <td key={key} className="px-4 py-3"><span className="font-mono text-xs text-zinc-500">{String(idx + 1).padStart(2, '0')}</span></td>;
                      if (key === 'order') return <td key={key} className="px-4 py-3"><OrderCell id={svc.id} initialOrder={svc.sort_order} onSaved={handleOrderSaved} onError={setError} /></td>;
                      if (key === 'service') return (
                        <td key={key} className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                              style={{ background: `color-mix(in srgb,${svc.accent} 15%,transparent)`, color: svc.accent, border: `1px solid color-mix(in srgb,${svc.accent} 25%,transparent)` }}>
                              <Icon icon={svc.icon || 'solar:code-square-linear'} width={16} />
                            </div>
                            <div>
                              <button onClick={() => openRecord(svc)} className="text-zinc-200 font-medium hover:text-indigo-400 transition-colors text-left block leading-tight">{svc.name}</button>
                              <p className="text-[10px] text-zinc-600 font-mono">{svc.slug}</p>
                            </div>
                          </div>
                        </td>
                      );
                      if (key === 'features') return (
                        <td key={key} className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">
                          <span className="text-zinc-300">{svc.features?.filter(f => f.enabled).length ?? 0}</span>
                          <span className="text-zinc-600"> / {svc.features?.length ?? 0}</span>
                        </td>
                      );
                      if (key === 'home') return (
                        <td key={key} className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${svc.show_on_home ? 'bg-indigo-500/10 text-indigo-400' : 'bg-zinc-800 text-zinc-600'}`}>
                            {svc.show_on_home ? 'shown' : 'hidden'}
                          </span>
                        </td>
                      );
                      if (key === 'last_modified') return (
                        <td key={key} className="px-4 py-3 whitespace-nowrap min-w-[140px]">
                          {svc.updated_at ? (
                            <div><p className="text-xs text-zinc-400">{fmtDate(svc.updated_at)}</p>{svc.last_modified_by ? <p className="text-[10px] text-zinc-600">{svc.last_modified_by}</p> : null}</div>
                          ) : <span className="text-zinc-700 text-xs">—</span>}
                        </td>
                      );
                      if (key === 'site') return (
                        <td key={key} className="px-4 py-3 whitespace-nowrap">
                          <button onClick={() => handleToggleEnabled(svc.id, svc.enabled)} disabled={toggling === svc.id}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${svc.enabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${svc.enabled ? 'translate-x-4' : 'translate-x-1'}`} />
                          </button>
                        </td>
                      );
                      return null;
                    })}
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => { openRecord(svc); enterEdit(); }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all">
                        <Icon icon="solar:pen-linear" width={13} />Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    {migrateOpen && (
      <MigrateModal
        objectName="services"
        selectedIds={selected}
        onClose={() => setMigrateOpen(false)}
        onSuccess={() => { setSelected(new Set()); loadAll(); }}
      />
    )}
    </>
  );
}
