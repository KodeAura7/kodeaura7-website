import { useEffect, useState } from 'react';
import Icon from '../../components/Icon';
import { adminApi } from '../../services/adminApi';
import { useToast } from '../../contexts/ToastContext';
import PageHistorySidebar from '../../components/admin/PageHistorySidebar';
import MigrateModal from '../../components/admin/MigrateModal';

const INPUT = 'w-full bg-[#18181B] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all';
const TEXTAREA = INPUT + ' resize-none';

const TABS = ['Hero', 'Story & Stats', 'Values', 'Tech Stack', 'CTA'];

const DEFAULT_VALUE_ITEM = { title: '', icon: 'solar:star-linear', accent: '#6366F1', desc: '' };
const DEFAULT_TECH_ITEM = { label: '', icon: 'solar:code-square-linear' };

function ColorInput({ label, value, onChange }) {
  return (
    <div className="space-y-1.5">
      {label ? <label className="text-xs font-medium text-zinc-400">{label}</label> : null}
      <div className="flex items-center gap-2">
        <label className="relative w-8 h-8 rounded-lg border border-zinc-700 overflow-hidden cursor-pointer shrink-0">
          <div className="w-full h-full" style={{ background: value }} />
          <input type="color" value={value} onChange={e => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
        </label>
        <input type="text" value={value} onChange={e => onChange(e.target.value)} className={INPUT + ' font-mono text-xs'} placeholder="#6366F1" />
      </div>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-6 space-y-4">
      <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{title}</h2>
      {children}
    </div>
  );
}

function Label({ children }) {
  return <label className="text-xs font-medium text-zinc-400">{children}</label>;
}

function Field({ label, children }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

// ─── Section editors ──────────────────────────────────────────────────────────

function HeroEditor({ data, onChange }) {
  const set = (k, v) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-5">
      <SectionCard title="Hero Section">
        <Field label="Eyebrow (small label above title)">
          <input type="text" value={data.eyebrow || ''} onChange={e => set('eyebrow', e.target.value)} className={INPUT} placeholder="About KodeAura7" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Title (first line)">
            <input type="text" value={data.title || ''} onChange={e => set('title', e.target.value)} className={INPUT} placeholder="We Engineer" />
          </Field>
          <Field label="Gradient text (colored second line)">
            <input type="text" value={data.gradient || ''} onChange={e => set('gradient', e.target.value)} className={INPUT} placeholder="Digital Growth" />
          </Field>
        </div>
        <Field label="Description">
          <textarea value={data.description || ''} onChange={e => set('description', e.target.value)} rows={3} className={TEXTAREA} placeholder="About your agency…" />
        </Field>
      </SectionCard>
      <div className="bg-[#0A0A0C] border border-zinc-800/50 rounded-2xl p-6 text-center">
        <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-wider mb-3">Preview</p>
        <p className="text-xs text-zinc-500 font-mono mb-2">{data.eyebrow}</p>
        <h1 className="font-display font-semibold text-3xl tracking-tighter">
          {data.title} <span className="text-gradient">{data.gradient}</span>
        </h1>
        <p className="text-zinc-500 text-sm mt-3 max-w-md mx-auto leading-relaxed">{data.description}</p>
      </div>
    </div>
  );
}

function StoryEditor({ data, onChange }) {
  const set = (k, v) => onChange({ ...data, [k]: v });

  const setParagraph = (i, val) => set('paragraphs', (data.paragraphs || []).map((p, idx) => idx === i ? val : p));
  const addParagraph = () => set('paragraphs', [...(data.paragraphs || []), '']);
  const removeParagraph = i => set('paragraphs', (data.paragraphs || []).filter((_, idx) => idx !== i));

  const setStat = (i, k, val) => set('stats', (data.stats || []).map((s, idx) => idx === i ? { ...s, [k]: val } : s));
  const addStat = () => set('stats', [...(data.stats || []), { value: '', label: '' }]);
  const removeStat = i => set('stats', (data.stats || []).filter((_, idx) => idx !== i));

  return (
    <div className="space-y-5">
      <SectionCard title="Section Header">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Subtitle (small label)">
            <input type="text" value={data.subtitle || ''} onChange={e => set('subtitle', e.target.value)} className={INPUT} placeholder="Our Story" />
          </Field>
          <Field label="Heading">
            <input type="text" value={data.title || ''} onChange={e => set('title', e.target.value)} className={INPUT} placeholder="Built From Passion…" />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Body Paragraphs">
        <div className="space-y-3">
          {(data.paragraphs || []).map((p, i) => (
            <div key={i} className="flex gap-2 items-start">
              <textarea value={p} onChange={e => setParagraph(i, e.target.value)} rows={2} className={TEXTAREA + ' flex-1'} placeholder={`Paragraph ${i + 1}…`} />
              <button onClick={() => removeParagraph(i)} className="mt-2 p-1.5 text-zinc-600 hover:text-rose-400 transition-colors shrink-0">
                <Icon icon="solar:close-circle-linear" width={16} />
              </button>
            </div>
          ))}
        </div>
        <button onClick={addParagraph} className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
          <Icon icon="solar:add-circle-linear" width={14} />Add Paragraph
        </button>
      </SectionCard>

      <SectionCard title="Stats Panel">
        <p className="text-[11px] text-zinc-700">Shown in the right-side stats card.</p>
        <div className="space-y-3">
          {(data.stats || []).map((s, i) => (
            <div key={i} className="flex gap-3 items-center">
              <input type="text" value={s.value} onChange={e => setStat(i, 'value', e.target.value)} placeholder="150+" className={INPUT} style={{ maxWidth: '100px' }} />
              <input type="text" value={s.label} onChange={e => setStat(i, 'label', e.target.value)} placeholder="Projects Delivered" className={INPUT} />
              <button onClick={() => removeStat(i)} className="p-1.5 text-zinc-600 hover:text-rose-400 transition-colors shrink-0">
                <Icon icon="solar:close-circle-linear" width={16} />
              </button>
            </div>
          ))}
        </div>
        <button onClick={addStat} className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
          <Icon icon="solar:add-circle-linear" width={14} />Add Stat
        </button>
      </SectionCard>
    </div>
  );
}

function ValuesEditor({ data, onChange }) {
  const set = (k, v) => onChange({ ...data, [k]: v });
  const setItem = (i, k, v) => set('items', (data.items || []).map((item, idx) => idx === i ? { ...item, [k]: v } : item));
  const addItem = () => set('items', [...(data.items || []), { ...DEFAULT_VALUE_ITEM }]);
  const removeItem = i => set('items', (data.items || []).filter((_, idx) => idx !== i));

  return (
    <div className="space-y-5">
      <SectionCard title="Section Header">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Heading">
            <input type="text" value={data.title || ''} onChange={e => set('title', e.target.value)} className={INPUT} placeholder="What Drives Us" />
          </Field>
          <Field label="Subtitle">
            <input type="text" value={data.subtitle || ''} onChange={e => set('subtitle', e.target.value)} className={INPUT} placeholder="Four principles…" />
          </Field>
        </div>
      </SectionCard>

      <div className="space-y-4">
        {(data.items || []).map((item, i) => (
          <div key={i} className="bg-[#111113] border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg border border-zinc-800 flex items-center justify-center" style={{ color: item.accent, background: `color-mix(in srgb,${item.accent} 12%,transparent)` }}>
                  <Icon icon={item.icon || 'solar:star-linear'} width={16} />
                </div>
                <span className="text-sm font-medium text-zinc-300">{item.title || `Value ${i + 1}`}</span>
              </div>
              <button onClick={() => removeItem(i)} className="p-1.5 text-zinc-600 hover:text-rose-400 transition-colors">
                <Icon icon="solar:trash-bin-minimalistic-linear" width={15} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Title">
                <input type="text" value={item.title} onChange={e => setItem(i, 'title', e.target.value)} className={INPUT} placeholder="Craft Over Speed" />
              </Field>
              <Field label="Icon (Iconify ID)">
                <input type="text" value={item.icon} onChange={e => setItem(i, 'icon', e.target.value)} className={INPUT + ' font-mono text-xs'} placeholder="solar:palette-linear" />
              </Field>
            </div>
            <ColorInput label="Accent Color" value={item.accent} onChange={v => setItem(i, 'accent', v)} />
            <Field label="Description">
              <textarea value={item.desc} onChange={e => setItem(i, 'desc', e.target.value)} rows={2} className={TEXTAREA} placeholder="Describe this value…" />
            </Field>
          </div>
        ))}
      </div>
      <button onClick={addItem} className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
        <Icon icon="solar:add-circle-linear" width={16} />Add Value Card
      </button>
    </div>
  );
}

function TechEditor({ data, onChange }) {
  const set = (k, v) => onChange({ ...data, [k]: v });
  const setItem = (i, k, v) => set('items', (data.items || []).map((item, idx) => idx === i ? { ...item, [k]: v } : item));
  const addItem = () => set('items', [...(data.items || []), { ...DEFAULT_TECH_ITEM }]);
  const removeItem = i => set('items', (data.items || []).filter((_, idx) => idx !== i));

  return (
    <div className="space-y-5">
      <SectionCard title="Section Header">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Heading">
            <input type="text" value={data.title || ''} onChange={e => set('title', e.target.value)} className={INPUT} placeholder="Our Technology Stack" />
          </Field>
          <Field label="Subtitle">
            <input type="text" value={data.subtitle || ''} onChange={e => set('subtitle', e.target.value)} className={INPUT} placeholder="Built with tools that scale." />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Technology Items">
        <div className="space-y-3">
          {(data.items || []).map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#18181B] border border-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                <Icon icon={item.icon || 'solar:code-square-linear'} width={16} />
              </div>
              <input type="text" value={item.icon} onChange={e => setItem(i, 'icon', e.target.value)} placeholder="solar:atom-linear" className={INPUT + ' font-mono text-xs'} style={{ maxWidth: '220px' }} />
              <input type="text" value={item.label} onChange={e => setItem(i, 'label', e.target.value)} placeholder="React" className={INPUT} />
              <button onClick={() => removeItem(i)} className="p-1.5 text-zinc-600 hover:text-rose-400 transition-colors shrink-0">
                <Icon icon="solar:close-circle-linear" width={16} />
              </button>
            </div>
          ))}
        </div>
        <button onClick={addItem} className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
          <Icon icon="solar:add-circle-linear" width={14} />Add Technology
        </button>
      </SectionCard>
    </div>
  );
}

function CtaEditor({ data, onChange }) {
  const set = (k, v) => onChange({ ...data, [k]: v });
  return (
    <SectionCard title="CTA Banner">
      <Field label="Title">
        <input type="text" value={data.title || ''} onChange={e => set('title', e.target.value)} className={INPUT} placeholder="Ready to build something extraordinary?" />
      </Field>
      <Field label="Body text">
        <input type="text" value={data.body || ''} onChange={e => set('body', e.target.value)} className={INPUT} placeholder="Book a free strategy session." />
      </Field>
    </SectionCard>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminAbout() {
  const { success, error: toastError } = useToast();
  const [content, setContent] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [historyKey, setHistoryKey] = useState(0);
  const [migrateOpen, setMigrateOpen] = useState(false);

  useEffect(() => {
    adminApi.getPageContent('about').then(setContent).catch(() => setError('Failed to load page content.'));
  }, []);

  const setSection = (key, val) => setContent(c => ({ ...c, [key]: val }));

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      await adminApi.setPageContent('about', content);
      success('About page saved', 'Changes are now live.');
      setHistoryKey(k => k + 1);
    } catch (e) { setError(e.message); toastError('Save failed', e.message); }
    finally { setSaving(false); }
  };

  if (!content) {
    return (
      <div className="p-8 flex items-center gap-3 text-zinc-500">
        {error ? (
          <p className="text-rose-400 text-sm">{error}</p>
        ) : (
          <><Icon icon="solar:loading-linear" width={18} className="animate-spin" /><span className="text-sm">Loading…</span></>
        )}
      </div>
    );
  }

  return (
    <>
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-48 shrink-0 border-r border-zinc-800 bg-[#0A0A0C] py-6 sticky top-0 h-screen">
        <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest px-4 mb-3">Sections</p>
        <nav className="space-y-0.5 px-2">
          {TABS.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === i ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50'}`}>
              {tab}
            </button>
          ))}
        </nav>
      </aside>

      {/* Editor */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="p-6 md:p-8 max-w-3xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="font-display font-semibold text-2xl text-zinc-100">About Page</h1>
              <p className="text-sm text-zinc-500 mt-0.5">Editing: <span className="text-zinc-300">{TABS[activeTab]}</span></p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setMigrateOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium border bg-[#18181B] border-zinc-700 hover:border-indigo-500/40 text-indigo-400 hover:text-indigo-300 transition-all">
                <Icon icon="solar:transfer-horizontal-linear" width={15} />
                Push to Env
              </button>
              <button onClick={handleSave} disabled={saving}
                className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl px-5 py-2.5 text-sm font-medium transition-all disabled:opacity-60 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                <Icon icon={saving ? 'solar:loading-linear' : 'solar:floppy-disk-linear'} width={15} className={saving ? 'animate-spin' : ''} />
                {saving ? 'Saving…' : 'Save All'}
              </button>
            </div>
          </div>

          {error ? <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-sm text-rose-400 mb-6">{error}</div> : null}

          {/* Active section */}
          {activeTab === 0 && <HeroEditor data={content.hero || {}} onChange={v => setSection('hero', v)} />}
          {activeTab === 1 && <StoryEditor data={content.story || {}} onChange={v => setSection('story', v)} />}
          {activeTab === 2 && <ValuesEditor data={content.values || {}} onChange={v => setSection('values', v)} />}
          {activeTab === 3 && <TechEditor data={content.tech || {}} onChange={v => setSection('tech', v)} />}
          {activeTab === 4 && <CtaEditor data={content.cta || {}} onChange={v => setSection('cta', v)} />}

        </div>
      </div>

      {/* History sidebar */}
      <PageHistorySidebar page="about" historyKey={historyKey} actionLabel="saved about page" />
    </div>

    {migrateOpen && (
      <MigrateModal
        objectName="about"
        mode="config"
        selectedIds={new Set()}
        onClose={() => setMigrateOpen(false)}
      />
    )}
    </>
  );
}
