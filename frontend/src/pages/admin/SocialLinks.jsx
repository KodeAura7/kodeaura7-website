import { useEffect, useState } from 'react';
import Icon from '../../components/Icon';
import { adminApi } from '../../services/adminApi';

const INPUT = 'w-full bg-[#18181B] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all';

const PRESET_ICONS = [
  { id: 'mdi:linkedin', label: 'LinkedIn' },
  { id: 'mdi:twitter', label: 'Twitter / X' },
  { id: 'mdi:instagram', label: 'Instagram' },
  { id: 'mdi:facebook', label: 'Facebook' },
  { id: 'mdi:youtube', label: 'YouTube' },
  { id: 'mdi:github', label: 'GitHub' },
  { id: 'mdi:whatsapp', label: 'WhatsApp' },
  { id: 'mdi:telegram', label: 'Telegram' },
  { id: 'mdi:pinterest', label: 'Pinterest' },
  { id: 'mdi:tiktok', label: 'TikTok' },
  { id: 'mdi:snapchat', label: 'Snapchat' },
  { id: 'mdi:discord', label: 'Discord' },
  { id: 'mdi:reddit', label: 'Reddit' },
  { id: 'mdi:web', label: 'Website' },
  { id: 'mdi:email', label: 'Email' },
  { id: 'mdi:phone', label: 'Phone' },
];

const EMPTY_FORM = { name: '', url: '', icon: 'mdi:linkedin', enabled: true, sort_order: 0 };

function IconPicker({ value, onChange }) {
  const [custom, setCustom] = useState('');
  const isPreset = PRESET_ICONS.some((p) => p.id === value);

  return (
    <div className="space-y-3">
      <label className="text-xs font-medium text-zinc-400">Icon</label>
      {/* Preset grid */}
      <div className="grid grid-cols-8 gap-1.5">
        {PRESET_ICONS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(p.id)}
            title={p.label}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
              value === p.id
                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                : 'border-zinc-800 bg-[#18181B] text-zinc-400 hover:border-zinc-600 hover:text-zinc-100'
            }`}
          >
            <Icon icon={p.id} width={18} />
            <span className="text-[9px] text-zinc-600 truncate w-full text-center leading-tight">{p.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>
      {/* Custom icon ID input */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#18181B] border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0">
          <Icon icon={value || 'mdi:link'} width={16} />
        </div>
        <input
          type="text"
          value={isPreset ? '' : value}
          onChange={(e) => { setCustom(e.target.value); onChange(e.target.value || 'mdi:link'); }}
          placeholder="Or type custom Iconify ID, e.g. mdi:rss"
          className={INPUT + ' font-mono text-xs'}
        />
      </div>
    </div>
  );
}

export default function SocialLinks() {
  const [view, setView] = useState('list');
  const [items, setItems] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadAll = () => {
    setError('');
    adminApi.socialLinks().then(setItems).catch((e) => setError(e.message));
  };

  useEffect(() => { loadAll(); }, []);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const openEdit = (item) => { setEditItem(item); setForm({ ...item }); setError(''); setView('edit'); };
  const openNew = () => { setEditItem(null); setForm({ ...EMPTY_FORM, sort_order: items ? items.length : 0 }); setError(''); setView('edit'); };
  const back = () => { setView('list'); setEditItem(null); setError(''); };

  const handleToggleEnabled = async (id, current) => {
    setToggling(id);
    try { await adminApi.setSocialLinkEnabled(id, !current); setItems((prev) => prev.map((s) => s.id === id ? { ...s, enabled: !current } : s)); }
    catch (e) { setError(e.message); }
    finally { setToggling(null); }
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      if (editItem) {
        const updated = await adminApi.updateSocialLink(editItem.id, form);
        setItems((prev) => prev.map((s) => s.id === editItem.id ? updated : s));
      } else {
        const created = await adminApi.createSocialLink(form);
        setItems((prev) => [...(prev || []), created]);
      }
      back();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!editItem || !window.confirm(`Delete "${editItem.name}"?`)) return;
    setDeleting(true);
    try { await adminApi.deleteSocialLink(editItem.id); setItems((prev) => prev.filter((s) => s.id !== editItem.id)); back(); }
    catch (e) { setError(e.message); }
    finally { setDeleting(false); }
  };

  const handleExport = async () => {
    setExporting(true);
    try { await adminApi.exportSocialLinks(); }
    catch (e) { setError(e.message); }
    finally { setExporting(false); }
  };

  // ─── EDIT VIEW ────────────────────────────────────────────────────────────────
  if (view === 'edit') {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <button onClick={back} className="p-2 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 transition-all">
            <Icon icon="solar:arrow-left-linear" width={18} />
          </button>
          <h1 className="font-display font-semibold text-2xl text-zinc-100 flex-1">
            {editItem ? `Edit — ${editItem.name}` : 'New Social Link'}
          </h1>
          <div className="flex items-center gap-2">
            {editItem ? (
              <button onClick={handleDelete} disabled={deleting} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium border bg-[#18181B] border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-all disabled:opacity-50">
                <Icon icon={deleting ? 'solar:loading-linear' : 'solar:trash-bin-minimalistic-linear'} width={15} className={deleting ? 'animate-spin' : ''} />
                Delete
              </button>
            ) : null}
            <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl px-5 py-2.5 text-sm font-medium transition-all disabled:opacity-60">
              <Icon icon={saving ? 'solar:loading-linear' : 'solar:floppy-disk-linear'} width={15} className={saving ? 'animate-spin' : ''} />
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        {error ? <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-sm text-rose-400 mb-5">{error}</div> : null}

        <div className="space-y-5">
          <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Details</h2>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Display Name <span className="text-rose-500">*</span></label>
              <input type="text" value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="LinkedIn" className={INPUT} />
              <p className="text-[10px] text-zinc-700">Shown on hover in the footer.</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">URL <span className="text-rose-500">*</span></label>
              <input type="url" value={form.url} onChange={(e) => setField('url', e.target.value)} placeholder="https://linkedin.com/in/yourprofile" className={INPUT} />
            </div>
          </div>

          <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-6 space-y-4">
            <IconPicker value={form.icon} onChange={(v) => setField('icon', v)} />
          </div>

          <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Settings</h2>
            <div className="flex flex-wrap items-end gap-8">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Sort Order</label>
                <input type="number" value={form.sort_order} onChange={(e) => setField('sort_order', parseInt(e.target.value) || 0)}
                  className="w-24 bg-[#18181B] border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 text-center focus:outline-none focus:border-indigo-500/50 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Enabled</label>
                <div className="flex items-center gap-2 mt-0.5">
                  <button type="button" onClick={() => setField('enabled', !form.enabled)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.enabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${form.enabled ? 'translate-x-4' : 'translate-x-1'}`} />
                  </button>
                  <span className="text-xs text-zinc-400">{form.enabled ? 'Visible in footer' : 'Hidden'}</span>
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
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-semibold text-2xl text-zinc-100">Social Links</h1>
          <p className="text-sm text-zinc-500 mt-1">{items ? `${items.length} total · ${enabledCount} visible` : '—'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} disabled={exporting || !items}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium border bg-[#18181B] border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-zinc-100 disabled:opacity-50">
            <Icon icon={exporting ? 'solar:loading-linear' : 'solar:export-linear'} width={16} className={exporting ? 'animate-spin' : ''} />
            Export
          </button>
          <button onClick={openNew} className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <Icon icon="solar:add-circle-linear" width={16} />Add Link
          </button>
        </div>
      </div>

      {error ? <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-sm text-rose-400 mb-4">{error}</div> : null}

      <div className="bg-[#111113] border border-zinc-800 rounded-2xl overflow-hidden">
        {/* Live preview */}
        {items && items.filter((s) => s.enabled).length > 0 ? (
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-2">
            <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest mr-2">Footer preview:</span>
            {items.filter((s) => s.enabled).sort((a, b) => a.sort_order - b.sort_order).map((s) => (
              <div key={s.id} title={s.name}
                className="w-8 h-8 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors">
                <Icon icon={s.icon} width={15} />
              </div>
            ))}
          </div>
        ) : null}
        <div className="divide-y divide-zinc-800/60">
          {!items ? (
            <p className="px-6 py-10 text-center text-sm text-zinc-600">Loading…</p>
          ) : items.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-zinc-600">No social links yet.</p>
          ) : (
            items.map((link) => (
              <div key={link.id} className="px-6 py-4 flex items-center gap-4 hover:bg-zinc-800/20 transition-colors group">
                <div className="w-9 h-9 rounded-xl bg-[#18181B] border border-zinc-800 flex items-center justify-center text-zinc-300 shrink-0">
                  <Icon icon={link.icon || 'mdi:link'} width={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200">{link.name}</p>
                  <p className="text-[11px] text-zinc-600 font-mono truncate">{link.url}</p>
                </div>
                <span className="text-[10px] font-mono text-zinc-600">{link.icon}</span>
                <button onClick={() => handleToggleEnabled(link.id, link.enabled)} disabled={toggling === link.id}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 shrink-0 ${link.enabled ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${link.enabled ? 'translate-x-4' : 'translate-x-1'}`} />
                </button>
                <button onClick={() => openEdit(link)} className="p-1.5 rounded-lg text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all shrink-0">
                  <Icon icon="solar:pen-linear" width={15} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
