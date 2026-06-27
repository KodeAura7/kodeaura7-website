import { useEffect, useRef, useState } from 'react';
import Icon from '../../components/Icon';
import { adminApi } from '../../services/adminApi';

const INPUT = 'w-full bg-[#18181B] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all';
const TEXTAREA = 'w-full bg-[#18181B] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all resize-none';

const EMPTY_FORM = {
  slug: '', num: '', name: '', icon: 'solar:code-square-linear',
  accent: '#6366F1', light: '#A5B4FC', description: '',
  p1: '', p2: '',
  features: [],
  metrics: [{ value: '', label: '' }, { value: '', label: '' }, { value: '', label: '' }],
  sort_order: 0, enabled: true
};

function toSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function padMetrics(metrics) {
  const filled = (metrics || []).slice(0, 3);
  while (filled.length < 3) filled.push({ value: '', label: '' });
  return filled;
}

function ColorInput({ label, value, onChange }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-zinc-400">{label}</label>
      <div className="flex items-center gap-2">
        <label className="relative w-10 h-10 rounded-xl border border-zinc-700 overflow-hidden cursor-pointer shrink-0">
          <div className="w-full h-full rounded-xl" style={{ background: value }} />
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={INPUT + ' font-mono text-xs'}
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

function OrderCell({ id, initialOrder, onSaved, onError }) {
  const [val, setVal] = useState(String(initialOrder ?? 0));
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  const commit = async () => {
    const num = parseInt(val);
    if (isNaN(num) || num === (initialOrder ?? 0)) return;
    setSaving(true);
    try {
      await adminApi.setServiceOrder(id, num);
      onSaved(id, num);
    } catch (err) {
      onError(err.message);
      setVal(String(initialOrder ?? 0));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <input
        ref={inputRef}
        type="number"
        min="0"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); inputRef.current?.blur(); } }}
        disabled={saving}
        className="w-14 bg-[#18181B] border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-200 text-center focus:outline-none focus:border-indigo-500/50 transition-all disabled:opacity-50"
      />
      {saving ? <Icon icon="solar:loading-linear" width={12} className="text-zinc-600 animate-spin shrink-0" /> : null}
    </div>
  );
}

export default function AdminServices() {
  const [view, setView] = useState('list');
  const [items, setItems] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selected, setSelected] = useState(new Set());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState({ type: '', text: '' });
  const importInputRef = useRef(null);

  const loadAll = () => {
    setError('');
    adminApi.services().then(setItems).catch((e) => setError(e.message));
  };

  useEffect(() => { loadAll(); }, []);

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ ...item, metrics: padMetrics(item.metrics), features: item.features || [] });
    setError('');
    setView('edit');
  };

  const openNew = () => {
    setEditItem(null);
    setForm({ ...EMPTY_FORM });
    setError('');
    setView('edit');
  };

  const backToList = () => {
    setView('list');
    setEditItem(null);
    setError('');
  };

  // Feature helpers
  const addFeature = () => setForm((f) => ({ ...f, features: [...f.features, { label: '', enabled: true }] }));
  const removeFeature = (i) => setForm((f) => ({ ...f, features: f.features.filter((_, idx) => idx !== i) }));
  const setFeatureLabel = (i, label) =>
    setForm((f) => ({ ...f, features: f.features.map((feat, idx) => idx === i ? { ...feat, label } : feat) }));
  const toggleFeature = (i) =>
    setForm((f) => ({ ...f, features: f.features.map((feat, idx) => idx === i ? { ...feat, enabled: !feat.enabled } : feat) }));

  const setMetric = (i, key, val) =>
    setForm((f) => ({ ...f, metrics: f.metrics.map((m, idx) => idx === i ? { ...m, [key]: val } : m) }));

  // Selection
  const toggleSelect = (id) =>
    setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const allSelected = !!(items && items.length > 0 && selected.size === items.length);
  const someSelected = selected.size > 0;

  const handleToggleEnabled = async (id, current) => {
    setToggling(id);
    try {
      await adminApi.setServiceEnabled(id, !current);
      setItems((prev) => prev.map((s) => s.id === id ? { ...s, enabled: !current } : s));
    } catch (e) {
      setError(e.message);
    } finally {
      setToggling(null);
    }
  };

  const handleOrderSaved = (id, newOrder) => {
    setItems((prev) =>
      [...prev.map((s) => s.id === id ? { ...s, sort_order: newOrder } : s)].sort((a, b) => a.sort_order - b.sort_order)
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        metrics: form.metrics.filter((m) => m.value || m.label),
        features: form.features.filter((f) => f.label)
      };
      if (editItem) {
        const updated = await adminApi.updateService(editItem.id, payload);
        setItems((prev) => prev.map((s) => s.id === editItem.id ? updated : s));
      } else {
        const created = await adminApi.createService(payload);
        setItems((prev) => [...(prev || []), created].sort((a, b) => a.sort_order - b.sort_order));
      }
      backToList();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editItem || !window.confirm(`Delete "${editItem.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await adminApi.deleteService(editItem.id);
      setItems((prev) => prev.filter((s) => s.id !== editItem.id));
      backToList();
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await adminApi.exportServices([...selected]);
    } catch (e) {
      setError(e.message);
    } finally {
      setExporting(false);
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (importInputRef.current) importInputRef.current.value = '';
    if (!file) return;
    setImporting(true);
    setImportMsg({ type: '', text: '' });
    try {
      const csv = await file.text();
      const result = await adminApi.importServices(csv);
      setImportMsg({ type: 'success', text: `Imported ${result.imported} service${result.imported !== 1 ? 's' : ''}.` });
      loadAll();
    } catch (e) {
      setImportMsg({ type: 'error', text: e.message });
    } finally {
      setImporting(false);
    }
  };

  // ─── EDIT VIEW ───────────────────────────────────────────────────────────────
  if (view === 'edit') {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4 flex-wrap">
          <button
            onClick={backToList}
            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 transition-all shrink-0"
          >
            <Icon icon="solar:arrow-left-linear" width={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-semibold text-2xl text-zinc-100 truncate">
              {editItem ? `Edit — ${editItem.name}` : 'New Service'}
            </h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {editItem ? (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium border bg-[#18181B] border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-all disabled:opacity-50"
              >
                <Icon icon={deleting ? 'solar:loading-linear' : 'solar:trash-bin-minimalistic-linear'} width={15} className={deleting ? 'animate-spin' : ''} />
                Delete
              </button>
            ) : null}
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl px-5 py-2.5 text-sm font-medium transition-all disabled:opacity-60 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
            >
              <Icon icon={saving ? 'solar:loading-linear' : 'solar:floppy-disk-linear'} width={15} className={saving ? 'animate-spin' : ''} />
              {saving ? 'Saving…' : 'Save Service'}
            </button>
          </div>
        </div>

        {error ? (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-sm text-rose-400 mb-6">{error}</div>
        ) : null}

        <div className="space-y-5">
          {/* IDENTITY */}
          <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Identity</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Number</label>
                <input type="text" value={form.num} onChange={(e) => setField('num', e.target.value)} placeholder="01" className={INPUT} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    setField('name', e.target.value);
                    if (!editItem) setField('slug', toSlug(e.target.value));
                  }}
                  placeholder="Web Development"
                  className={INPUT}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Slug <span className="text-rose-500">*</span></label>
                <input type="text" value={form.slug} onChange={(e) => setField('slug', e.target.value)} placeholder="web-dev" className={INPUT + ' font-mono text-xs'} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Icon <span className="text-zinc-600 font-normal">(Iconify ID)</span></label>
                <input type="text" value={form.icon} onChange={(e) => setField('icon', e.target.value)} placeholder="solar:code-square-linear" className={INPUT + ' font-mono text-xs'} />
              </div>
            </div>
          </div>

          {/* STYLE */}
          <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Style</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ColorInput label="Accent Color" value={form.accent} onChange={(v) => setField('accent', v)} />
              <ColorInput label="Light Color" value={form.light} onChange={(v) => setField('light', v)} />
            </div>
            {/* Live mini-preview */}
            <div
              className="rounded-xl p-4 border mt-2"
              style={{
                background: `color-mix(in srgb,${form.accent} 8%,transparent)`,
                borderColor: `color-mix(in srgb,${form.accent} 22%,transparent)`
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl bg-[#18181B] border border-zinc-800 flex items-center justify-center shrink-0"
                  style={{ color: form.accent }}
                >
                  <Icon icon={form.icon || 'solar:code-square-linear'} width={20} />
                </div>
                <div className="min-w-0">
                  <span className="font-mono text-xs" style={{ color: form.accent }}>{form.num || '00'}</span>
                  <p className="text-sm font-semibold text-zinc-100 truncate">{form.name || 'Service Name'}</p>
                </div>
                <div className="ml-auto shrink-0">
                  <div className="w-8 h-1 rounded-full" style={{ background: `linear-gradient(to right,${form.accent},transparent)` }} />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                {padMetrics(form.metrics).filter((m) => m.value || m.label).map((m, i) => (
                  <div key={i} className="flex-1 bg-[#18181B] border border-zinc-800 rounded-lg px-2 py-2 text-center">
                    <p className="font-display text-sm font-semibold text-zinc-100">{m.value || '—'}</p>
                    <p className="text-[10px] text-zinc-500">{m.label || '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Description</h2>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Short Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                rows={2}
                placeholder="Brief description for cards and SEO…"
                className={TEXTAREA}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Paragraph 1</label>
              <textarea
                value={form.p1}
                onChange={(e) => setField('p1', e.target.value)}
                rows={3}
                placeholder="First content paragraph shown on the services page…"
                className={TEXTAREA}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Paragraph 2</label>
              <textarea
                value={form.p2}
                onChange={(e) => setField('p2', e.target.value)}
                rows={3}
                placeholder="Second content paragraph…"
                className={TEXTAREA}
              />
            </div>
          </div>

          {/* FEATURES */}
          <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">What's Included</h2>
                <p className="text-[11px] text-zinc-700 mt-0.5">Check items to enable them on the site. Uncheck to hide without deleting.</p>
              </div>
              <button
                onClick={addFeature}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <Icon icon="solar:add-circle-linear" width={14} />
                Add Item
              </button>
            </div>
            {form.features.length === 0 ? (
              <p className="text-xs text-zinc-600 text-center py-4">No items yet. Click "Add Item" to start.</p>
            ) : null}
            <div className="space-y-2">
              {form.features.map((feat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleFeature(i)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                      feat.enabled ? 'border-indigo-500 bg-indigo-500' : 'border-zinc-600 bg-transparent'
                    }`}
                    title={feat.enabled ? 'Disable on site' : 'Enable on site'}
                  >
                    {feat.enabled ? <Icon icon="solar:check-read-linear" width={11} className="text-white" /> : null}
                  </button>
                  <input
                    type="text"
                    value={feat.label}
                    onChange={(e) => setFeatureLabel(i, e.target.value)}
                    placeholder="Feature description"
                    className={`flex-1 ${INPUT} ${!feat.enabled ? 'opacity-50' : ''}`}
                  />
                  <button
                    onClick={() => removeFeature(i)}
                    className="p-1.5 text-zinc-600 hover:text-rose-400 transition-colors shrink-0"
                    title="Remove"
                  >
                    <Icon icon="solar:close-circle-linear" width={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* METRICS */}
          <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div>
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Side Panel Metrics</h2>
              <p className="text-[11px] text-zinc-700 mt-0.5">Up to 3 tiles shown in the visual panel beside the service content.</p>
            </div>
            {[0, 1, 2].map((i) => (
              <div key={i} className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500">Tile {i + 1} — Value</label>
                  <input
                    type="text"
                    value={form.metrics[i]?.value || ''}
                    onChange={(e) => setMetric(i, 'value', e.target.value)}
                    placeholder="e.g. 50ms"
                    className={INPUT}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500">Tile {i + 1} — Label</label>
                  <input
                    type="text"
                    value={form.metrics[i]?.label || ''}
                    onChange={(e) => setMetric(i, 'label', e.target.value)}
                    placeholder="e.g. Avg Load"
                    className={INPUT}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* SETTINGS */}
          <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Settings</h2>
            <div className="flex items-end gap-8">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Sort Order</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setField('sort_order', parseInt(e.target.value) || 0)}
                  className="w-24 bg-[#18181B] border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 text-center focus:outline-none focus:border-indigo-500/50 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Visible on site</label>
                <div className="flex items-center gap-2 mt-0.5">
                  <button
                    type="button"
                    onClick={() => setField('enabled', !form.enabled)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.enabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${form.enabled ? 'translate-x-4' : 'translate-x-1'}`} />
                  </button>
                  <span className="text-xs text-zinc-400">{form.enabled ? 'Enabled' : 'Hidden'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── LIST VIEW ────────────────────────────────────────────────────────────────
  const enabledCount = items ? items.filter((s) => s.enabled).length : 0;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-semibold text-2xl text-zinc-100">Services</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {items ? `${items.length} total · ${enabledCount} enabled on site` : '—'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input ref={importInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportFile} />
          <button
            onClick={handleExport}
            disabled={exporting || !items}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all border bg-[#18181B] border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-zinc-100 disabled:opacity-50"
          >
            <Icon icon={exporting ? 'solar:loading-linear' : 'solar:export-linear'} width={16} className={exporting ? 'animate-spin' : ''} />
            {someSelected ? `Export (${selected.size})` : 'Export'}
          </button>
          <button
            onClick={() => importInputRef.current?.click()}
            disabled={importing}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all border bg-[#18181B] border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-zinc-100 disabled:opacity-50"
          >
            <Icon icon={importing ? 'solar:loading-linear' : 'solar:import-linear'} width={16} className={importing ? 'animate-spin' : ''} />
            Import
          </button>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)]"
          >
            <Icon icon="solar:add-circle-linear" width={16} />
            Add Service
          </button>
        </div>
      </div>

      {importMsg.text ? (
        <div className={`border rounded-xl p-3 text-sm mb-4 flex items-center gap-2 ${importMsg.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
          <Icon icon={importMsg.type === 'error' ? 'solar:danger-circle-linear' : 'solar:check-circle-linear'} width={15} />
          {importMsg.text}
        </div>
      ) : null}

      {error ? (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-sm text-rose-400 mb-4">{error}</div>
      ) : null}

      <div className="bg-[#111113] border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#18181B] border-b border-zinc-800">
                <th className="px-4 py-3 w-10">
                  <button
                    onClick={() => setSelected(allSelected ? new Set() : new Set((items || []).map((s) => s.id)))}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${allSelected ? 'border-indigo-500 bg-indigo-500' : 'border-zinc-600 bg-transparent'}`}
                  >
                    {allSelected ? <Icon icon="solar:check-read-linear" width={9} className="text-white" /> : null}
                  </button>
                </th>
                {['Order', 'Service', 'Features', 'Enabled', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {!items ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-zinc-600">Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-zinc-600">No services yet. Click "Add Service" to create one.</td></tr>
              ) : (
                items.map((svc) => (
                  <tr key={svc.id} className="hover:bg-zinc-800/20 transition-colors group">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleSelect(svc.id)}
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${selected.has(svc.id) ? 'border-indigo-500 bg-indigo-500' : 'border-zinc-600 bg-transparent'}`}
                      >
                        {selected.has(svc.id) ? <Icon icon="solar:check-read-linear" width={9} className="text-white" /> : null}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <OrderCell id={svc.id} initialOrder={svc.sort_order} onSaved={handleOrderSaved} onError={setError} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            background: `color-mix(in srgb,${svc.accent} 15%,transparent)`,
                            color: svc.accent,
                            border: `1px solid color-mix(in srgb,${svc.accent} 25%,transparent)`
                          }}
                        >
                          <Icon icon={svc.icon || 'solar:code-square-linear'} width={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-zinc-200 font-medium">{svc.name}</p>
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: svc.accent }} title={svc.accent} />
                          </div>
                          <p className="text-[10px] text-zinc-600 font-mono">{svc.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">
                      <span className="text-zinc-300">{svc.features?.filter((f) => f.enabled).length ?? 0}</span>
                      <span className="text-zinc-600"> / {svc.features?.length ?? 0} enabled</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleEnabled(svc.id, svc.enabled)}
                        disabled={toggling === svc.id}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${svc.enabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                        title={svc.enabled ? 'Disable on site' : 'Enable on site'}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${svc.enabled ? 'translate-x-4' : 'translate-x-1'}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(svc)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                      >
                        <Icon icon="solar:pen-linear" width={13} />
                        Edit
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
  );
}
