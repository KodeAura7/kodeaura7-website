import { useEffect, useRef, useState } from 'react';
import Icon from '../../components/Icon';
import { adminApi } from '../../services/adminApi';
import { useSiteData } from '../../contexts/SiteDataContext';
import { useToast } from '../../contexts/ToastContext';
import PageHistorySidebar from '../../components/admin/PageHistorySidebar';
import MigrateModal from '../../components/admin/MigrateModal';

const INPUT = 'w-full bg-[#18181B] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-primary-500/50 transition-all';

const DEFAULT = {
  name: 'KodeAura7',
  tagline: 'We Build the Digital Future.',
  logos: {
    header: { url: '', alt: 'KodeAura7' },
    footer: { url: '', alt: 'KodeAura7' },
    universal: { url: '', alt: 'KodeAura7' },
  },
  colors: {
    primary: '#1C63F3',
    secondary: '#0AA9D6',
    accent: '#8B5CF6',
  },
};

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="bg-[#111113] border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="px-6 py-5 border-b border-zinc-800/60">
        <h2 className="text-sm font-semibold text-zinc-200">{title}</h2>
        {subtitle ? <p className="text-xs text-zinc-600 mt-0.5">{subtitle}</p> : null}
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-zinc-400">{label}</label>
      {children}
      {hint ? <p className="text-[10px] text-zinc-700">{hint}</p> : null}
    </div>
  );
}

function ColorSwatch({ label, value, onChange }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-zinc-400">{label}</label>
      <div className="flex items-center gap-2">
        <label className="relative w-9 h-9 rounded-xl border border-zinc-700 overflow-hidden cursor-pointer shrink-0">
          <div className="w-full h-full" style={{ background: value }} />
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={INPUT + ' font-mono text-xs'}
          placeholder="#1C63F3"
          maxLength={7}
        />
      </div>
    </div>
  );
}

function AssetPickerModal({ onSelect, onClose }) {
  const [assets, setAssets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const { success, error: toastError } = useToast();

  const reload = () => {
    setLoading(true); setErr('');
    adminApi.listLogoAssets().then(setAssets).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await adminApi.uploadLogoAsset(file);
      success('Uploaded', file.name);
      reload();
      onSelect(uploaded.url);
      onClose();
    } catch (ex) {
      toastError('Upload failed', ex.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-[#111113] border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Project Assets</h3>
            <p className="text-[10px] text-zinc-600 font-mono mt-0.5">backend/assets/logos/</p>
          </div>
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181B] border border-zinc-700 hover:border-zinc-500 text-xs text-zinc-300 hover:text-zinc-100 disabled:opacity-50 transition-all"
            >
              <Icon icon={uploading ? 'solar:loading-linear' : 'solar:upload-linear'} width={13} className={uploading ? 'animate-spin' : ''} />
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
            <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-zinc-200 transition-colors">
              <Icon icon="solar:close-square-linear" width={18} />
            </button>
          </div>
        </div>
        <div className="p-5 min-h-[180px]">
          {loading && (
            <div className="flex items-center justify-center py-10 text-zinc-600 gap-2">
              <Icon icon="solar:loading-linear" width={18} className="animate-spin" />
              <span className="text-sm">Loading assets…</span>
            </div>
          )}
          {err && <p className="text-sm text-error-400 text-center py-6">{err}</p>}
          {!loading && !err && assets?.length === 0 && (
            <div className="text-center py-8">
              <Icon icon="solar:folder-open-linear" width={32} className="text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">No logo files found.</p>
              <p className="text-xs text-zinc-700 mt-1">Upload one above or drop images into backend/assets/logos/</p>
            </div>
          )}
          {assets && assets.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {assets.map((asset) => (
                <button
                  key={asset.name}
                  onClick={() => { onSelect(asset.url); onClose(); }}
                  className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-zinc-800 hover:border-primary-500/40 hover:bg-primary-500/5 transition-all"
                >
                  <div className="w-full h-16 flex items-center justify-center overflow-hidden rounded-lg bg-[#18181B]">
                    <img src={asset.url} alt={asset.name} className="max-w-full max-h-full object-contain" />
                  </div>
                  <span className="text-[9px] text-zinc-600 group-hover:text-zinc-400 font-mono truncate w-full text-center">
                    {asset.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LogoSlot({ label, hint, value, onChange }) {
  const [imgError, setImgError] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => { setImgError(false); }, [value.url]);

  return (
    <div className="space-y-3">
      {pickerOpen && (
        <AssetPickerModal
          onSelect={(url) => onChange({ ...value, url })}
          onClose={() => setPickerOpen(false)}
        />
      )}
      <div className="flex items-start gap-4">
        {/* Preview box */}
        <div className="w-28 h-16 rounded-xl border border-zinc-800 bg-[#18181B] flex items-center justify-center shrink-0 overflow-hidden p-2">
          {value.url && !imgError ? (
            <img
              src={value.url}
              alt={value.alt}
              className="max-w-full max-h-full object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-zinc-700">
              <Icon icon="solar:gallery-linear" width={20} />
              <span className="text-[9px] font-mono">{label}</span>
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <Field label="Image URL" hint={hint}>
            <div className="flex gap-2">
              <input
                type="url"
                value={value.url}
                onChange={(e) => onChange({ ...value, url: e.target.value })}
                placeholder="https://example.com/logo.svg"
                className={INPUT}
              />
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                title="Browse project assets"
                className="shrink-0 px-3 py-2 rounded-xl bg-[#18181B] border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-zinc-100 transition-all text-xs flex items-center gap-1.5"
              >
                <Icon icon="solar:folder-open-linear" width={14} />
                Browse
              </button>
            </div>
          </Field>
          <Field label="Alt text">
            <input
              type="text"
              value={value.alt}
              onChange={(e) => onChange({ ...value, alt: e.target.value })}
              placeholder="Company name"
              className={INPUT}
            />
          </Field>
        </div>
      </div>
      {value.url && imgError ? (
        <p className="text-xs text-error-400 flex items-center gap-1.5">
          <Icon icon="solar:close-circle-linear" width={13} />
          Image failed to load — check the URL
        </p>
      ) : null}
    </div>
  );
}


export default function AdminBranding() {
  const { refresh } = useSiteData();
  const { success, error: toastError } = useToast();
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [historyKey, setHistoryKey] = useState(0);
  const [migrateOpen, setMigrateOpen] = useState(false);

  useEffect(() => {
    adminApi.getPageContent('branding')
      .then((d) => setData({ ...DEFAULT, ...d }))
      .catch(() => setData({ ...DEFAULT }));
  }, []);

  const set = (key, val) => setData((d) => ({ ...d, [key]: val }));
  const setLogo = (variant, val) => setData((d) => ({ ...d, logos: { ...d.logos, [variant]: val } }));
  const setColor = (key, val) => setData((d) => ({ ...d, colors: { ...d.colors, [key]: val } }));

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      await adminApi.setPageContent('branding', data);
      const root = document.documentElement;
      if (data.colors?.primary) {
        root.style.setProperty('--brand-primary', data.colors.primary);
        const hex = data.colors.primary;
        const r = parseInt(hex.slice(1, 3), 16) || 99;
        const g = parseInt(hex.slice(3, 5), 16) || 102;
        const b = parseInt(hex.slice(5, 7), 16) || 241;
        root.style.setProperty('--brand-primary-glow', `rgba(${r},${g},${b},0.4)`);
        root.style.setProperty('--brand-primary-glow-soft', `rgba(${r},${g},${b},0.25)`);
      }
      if (data.colors?.secondary) root.style.setProperty('--brand-secondary', data.colors.secondary);
      if (data.colors?.accent) root.style.setProperty('--brand-accent', data.colors.accent);
      await refresh();
      success('Branding saved', 'Colors and logos are now live.');
      setHistoryKey(k => k + 1);
    } catch (e) { setError(e.message); toastError('Save failed', e.message); }
    finally { setSaving(false); }
  };

  if (!data) {
    return (
      <div className="p-8 flex items-center gap-3 text-zinc-500">
        <Icon icon="solar:loading-linear" width={18} className="animate-spin" />
        <span className="text-sm">Loading…</span>
      </div>
    );
  }

  return (
    <>
    <div className="flex min-h-screen">
      {/* Main scrollable area */}
      <div className="flex-1 min-w-0 overflow-y-auto">
      <div className="p-6 md:p-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-semibold text-2xl text-zinc-100">Branding</h1>
          <p className="text-sm text-zinc-500 mt-1">Logos, company name, and brand colors.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMigrateOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium border bg-[#18181B] border-zinc-700 hover:border-primary-500/40 text-primary-400 hover:text-primary-300 transition-all">
            <Icon icon="solar:transfer-horizontal-linear" width={15} />
            Push to Env
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-400 text-white rounded-xl px-5 py-2.5 text-sm font-medium transition-all disabled:opacity-60 shadow-[0_0_20px_rgba(51, 112, 246,0.2)]"
          >
            <Icon icon={saving ? 'solar:loading-linear' : 'solar:floppy-disk-linear'} width={15} className={saving ? 'animate-spin' : ''} />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-error-500/10 border border-error-500/20 rounded-xl p-3 text-sm text-error-400 mb-6">{error}</div>
      ) : null}

      <div className="space-y-6">
        {/* Identity */}
        <SectionCard title="Identity">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Company Name" hint="Used as fallback text if no logo image is set.">
              <input
                type="text"
                value={data.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="KodeAura7"
                className={INPUT}
              />
            </Field>
            <Field label="Tagline" hint="Shown in the footer below the logo.">
              <input
                type="text"
                value={data.tagline || ''}
                onChange={(e) => set('tagline', e.target.value)}
                placeholder="We Build the Digital Future."
                className={INPUT}
              />
            </Field>
          </div>
        </SectionCard>

        {/* Logos */}
        <SectionCard
          title="Header Logo"
          subtitle="Shown in the top navigation bar."
        >
          <LogoSlot
            label="Header"
            hint="Recommended: SVG or PNG with transparent background, max height ~40px."
            value={data.logos?.header || { url: '', alt: data.name }}
            onChange={(v) => setLogo('header', v)}
          />
        </SectionCard>

        <SectionCard
          title="Footer Logo"
          subtitle="Shown in the site footer."
        >
          <LogoSlot
            label="Footer"
            hint="Can be a lighter/inverted version of your logo."
            value={data.logos?.footer || { url: '', alt: data.name }}
            onChange={(v) => setLogo('footer', v)}
          />
        </SectionCard>

        <SectionCard
          title="Universal Logo"
          subtitle="Fallback used when no header or footer specific logo is set. Also used in meta/OG tags."
        >
          <LogoSlot
            label="Universal"
            hint="Square format recommended for OG/social previews."
            value={data.logos?.universal || { url: '', alt: data.name }}
            onChange={(v) => setLogo('universal', v)}
          />
        </SectionCard>

        {/* Colors */}
        <SectionCard
          title="Brand Colors"
          subtitle="These colors are applied to buttons, gradients, glows, and accent elements across the site."
        >
          <div className="grid grid-cols-3 gap-4">
            <ColorSwatch
              label="Primary"
              value={data.colors?.primary || '#1C63F3'}
              onChange={(v) => setColor('primary', v)}
            />
            <ColorSwatch
              label="Secondary"
              value={data.colors?.secondary || '#0AA9D6'}
              onChange={(v) => setColor('secondary', v)}
            />
            <ColorSwatch
              label="Accent"
              value={data.colors?.accent || '#8B5CF6'}
              onChange={(v) => setColor('accent', v)}
            />
          </div>

          {/* Live preview */}
          <div className="mt-2 bg-[#0A0A0C] rounded-xl p-5 space-y-4 border border-zinc-800/40">
            <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Live preview</p>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-medium brand-gradient-bg brand-shadow"
              >
                CTA Button
              </button>
              <div
                className="font-display font-semibold text-2xl text-gradient"
              >
                Gradient Text
              </div>
              <div className="flex gap-1.5">
                <div className="w-5 h-5 rounded-full" style={{ background: data.colors?.primary }} />
                <div className="w-5 h-5 rounded-full" style={{ background: data.colors?.secondary }} />
                <div className="w-5 h-5 rounded-full" style={{ background: data.colors?.accent }} />
              </div>
            </div>
            <div
              className="w-7 h-7 rounded-md brand-gradient-bg flex items-center justify-center shadow-[0_0_15px_var(--brand-primary-glow)]"
            >
              <div className="w-3 h-3 bg-[#09090B] rounded-sm" />
            </div>
          </div>
        </SectionCard>
      </div>
      </div>
      </div>

      {/* History sidebar */}
      <PageHistorySidebar page="branding" historyKey={historyKey} actionLabel="saved branding" />
    </div>

    {migrateOpen && (
      <MigrateModal
        objectName="branding"
        mode="config"
        selectedIds={new Set()}
        onClose={() => setMigrateOpen(false)}
      />
    )}
    </>
  );
}
