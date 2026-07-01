import { useEffect, useRef, useState } from 'react';
import Icon from '../../components/Icon';
import { adminApi } from '../../services/adminApi';
import { useToast } from '../../contexts/ToastContext';
import MigrateModal from '../../components/admin/MigrateModal';

// ─── Constants ────────────────────────────────────────────────────────────────

const INPUT = 'w-full bg-[#18181B] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-primary-500/50 transition-all';

const FIELD_TYPES = [
  { value: 'text',     label: 'Text',      icon: 'solar:text-field-linear' },
  { value: 'email',    label: 'Email',     icon: 'solar:letter-linear' },
  { value: 'tel',      label: 'Phone',     icon: 'solar:phone-linear' },
  { value: 'number',   label: 'Number',    icon: 'solar:hashtag-linear' },
  { value: 'url',      label: 'URL',       icon: 'solar:link-linear' },
  { value: 'textarea', label: 'Textarea',  icon: 'solar:document-text-linear' },
  { value: 'select',   label: 'Dropdown',  icon: 'solar:alt-arrow-down-linear' },
];

const EMPTY_FORM = {
  name: '', label: '', field_type: 'text', placeholder: '',
  required: false, enabled: true, width: 'full',
  options: [], validation: {},
};

// ─── Subcomponents ────────────────────────────────────────────────────────────

function TypeBadge({ type }) {
  const t = FIELD_TYPES.find(f => f.value === type);
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-500 bg-zinc-800/60 px-1.5 py-0.5 rounded-md">
      <Icon icon={t?.icon || 'solar:text-field-linear'} width={10} />
      {t?.label || type}
    </span>
  );
}

function OptionsEditor({ options, onChange }) {
  const add = () => onChange([...options, { label: '', value: '' }]);
  const remove = (i) => onChange(options.filter((_, idx) => idx !== i));
  const update = (i, field, val) => onChange(options.map((o, idx) => idx === i ? { ...o, [field]: val } : o));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-zinc-400">Options</label>
        <button type="button" onClick={add}
          className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors">
          <Icon icon="solar:add-circle-linear" width={12} /> Add option
        </button>
      </div>
      {options.length === 0 && (
        <p className="text-xs text-zinc-600 italic">No options yet — add at least one.</p>
      )}
      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={opt.label} onChange={(e) => update(i, 'label', e.target.value)}
            placeholder="Label" className={INPUT + ' text-xs'} />
          <input value={opt.value} onChange={(e) => update(i, 'value', e.target.value)}
            placeholder="Value" className={INPUT + ' text-xs font-mono'} />
          <button type="button" onClick={() => remove(i)}
            className="p-1.5 text-zinc-600 hover:text-error-400 transition-colors shrink-0">
            <Icon icon="solar:close-circle-linear" width={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Edit Drawer ──────────────────────────────────────────────────────────────

function EditDrawer({ field, isNew, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...field });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState('');
  const { success, error: toastError } = useToast();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.label.trim()) { setErr('Label is required.'); return; }
    if (isNew && !form.name.trim()) { setErr('Field name is required.'); return; }
    setSaving(true); setErr('');
    try {
      let result;
      if (isNew) {
        result = await adminApi.createContactFormField(form);
      } else {
        result = await adminApi.updateContactFormField(field.id, form);
      }
      success(isNew ? 'Field created' : 'Field updated', form.label);
      onSave(result);
    } catch (e) { setErr(e.message); toastError('Save failed', e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete field "${field.label}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await adminApi.deleteContactFormField(field.id);
      success('Field deleted', field.label);
      onDelete(field.id);
    } catch (e) { toastError('Delete failed', e.message); }
    finally { setDeleting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={onClose}>
      <div
        className="relative h-full w-full max-w-md bg-[#111113] border-l border-zinc-800 shadow-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#111113] border-b border-zinc-800 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-display font-semibold text-lg text-zinc-100">
            {isNew ? 'New Field' : `Edit — ${field.label}`}
          </h2>
          <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-zinc-200 transition-colors">
            <Icon icon="solar:close-square-linear" width={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {err && <div className="bg-error-500/10 border border-error-500/20 rounded-xl p-3 text-xs text-error-400">{err}</div>}

          {isNew && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Field Name <span className="text-error-400">*</span></label>
              <input value={form.name} onChange={(e) => set('name', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                placeholder="e.g. phone_number" className={INPUT + ' font-mono'} />
              <p className="text-[10px] text-zinc-700">Lowercase, underscores only. Used as the form data key.</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Label <span className="text-error-400">*</span></label>
            <input value={form.label} onChange={(e) => set('label', e.target.value)} placeholder="Full Name" className={INPUT} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Field Type</label>
            <div className="grid grid-cols-4 gap-2">
              {FIELD_TYPES.map((t) => (
                <button key={t.value} type="button" onClick={() => set('field_type', t.value)}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-xs transition-all ${form.field_type === t.value ? 'border-primary-500 bg-primary-500/10 text-primary-300' : 'border-zinc-800 bg-[#18181B] text-zinc-500 hover:border-zinc-600'}`}>
                  <Icon icon={t.icon} width={16} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Placeholder</label>
            <input value={form.placeholder} onChange={(e) => set('placeholder', e.target.value)}
              placeholder="Hint text shown inside the field" className={INPUT} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Width</label>
            <div className="flex gap-2">
              {[['half', 'Half width'], ['full', 'Full width']].map(([val, lbl]) => (
                <button key={val} type="button" onClick={() => set('width', val)}
                  className={`flex-1 py-2 rounded-xl border text-xs font-medium transition-all ${form.width === val ? 'border-primary-500 bg-primary-500/10 text-primary-300' : 'border-zinc-800 bg-[#18181B] text-zinc-500 hover:border-zinc-600'}`}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <div
                onClick={() => set('required', !form.required)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.required ? 'bg-primary-500' : 'bg-zinc-700'}`}>
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${form.required ? 'translate-x-4' : 'translate-x-1'}`} />
              </div>
              <span className="text-xs text-zinc-300">Required</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <div
                onClick={() => set('enabled', !form.enabled)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.enabled ? 'bg-success-500' : 'bg-zinc-700'}`}>
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${form.enabled ? 'translate-x-4' : 'translate-x-1'}`} />
              </div>
              <span className="text-xs text-zinc-300">Visible on site</span>
            </label>
          </div>

          {form.field_type === 'select' && (
            <OptionsEditor options={form.options || []} onChange={(v) => set('options', v)} />
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center gap-3">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-400 text-white rounded-xl py-2.5 text-sm font-medium transition-all disabled:opacity-60">
              <Icon icon={saving ? 'solar:loading-linear' : 'solar:floppy-disk-linear'} width={15} className={saving ? 'animate-spin' : ''} />
              {saving ? 'Saving…' : isNew ? 'Create Field' : 'Save Changes'}
            </button>
            {!isNew && (
              <button onClick={handleDelete} disabled={deleting}
                className="p-2.5 rounded-xl border border-error-500/20 text-error-400 hover:bg-error-500/10 transition-all disabled:opacity-50">
                <Icon icon={deleting ? 'solar:loading-linear' : 'solar:trash-bin-minimalistic-linear'} width={16} className={deleting ? 'animate-spin' : ''} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Live Preview ─────────────────────────────────────────────────────────────

function LivePreview({ fields }) {
  const enabled = fields.filter(f => f.enabled).sort((a, b) => a.sort_order - b.sort_order);
  if (enabled.length === 0) return (
    <div className="py-10 text-center text-sm text-zinc-600">Enable fields to see the form preview.</div>
  );
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#0A0A0C] rounded-xl border border-zinc-800/50">
      {enabled.map((f) => {
        const cls = f.width === 'half' ? '' : 'sm:col-span-2';
        return (
          <div key={f.id} className={`space-y-1.5 ${cls}`}>
            <label className="text-xs font-medium text-zinc-400">
              {f.label}{f.required && <span className="text-error-400 ml-0.5">*</span>}
            </label>
            {f.field_type === 'textarea' ? (
              <textarea rows={3} placeholder={f.placeholder} disabled
                className="w-full bg-[#18181B] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-600 resize-none" />
            ) : f.field_type === 'select' ? (
              <select disabled
                className="w-full bg-[#18181B] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-600">
                <option>{f.placeholder || 'Select…'}</option>
                {(f.options || []).map((o, i) => <option key={i}>{o.label}</option>)}
              </select>
            ) : (
              <input type={f.field_type} placeholder={f.placeholder} disabled
                className="w-full bg-[#18181B] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-600" />
            )}
          </div>
        );
      })}
      <div className="sm:col-span-2">
        <button disabled className="w-full py-3 rounded-xl brand-gradient-bg text-white text-sm font-medium opacity-60">
          Send Message
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ContactFormManager() {
  const { success, error: toastError } = useToast();
  const [fields, setFields] = useState(null);
  const [editTarget, setEditTarget] = useState(null); // null | 'new' | field object
  const [error, setError] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [migrateOpen, setMigrateOpen] = useState(false);
  const [toggling, setToggling] = useState(null);
  const dragItem = useRef(null);
  const dragOver = useRef(null);

  const load = () => {
    setError('');
    adminApi.getContactFormFields().then(setFields).catch((e) => setError(e.message));
  };
  useEffect(() => { load(); }, []);

  const handleSave = (result) => {
    setFields((prev) => {
      if (!prev) return [result];
      const idx = prev.findIndex(f => f.id === result.id);
      if (idx >= 0) return prev.map(f => f.id === result.id ? result : f);
      return [...prev, result];
    });
    setEditTarget(null);
  };

  const handleDelete = (id) => {
    setFields((prev) => (prev || []).filter(f => f.id !== id));
    setEditTarget(null);
  };

  const toggleEnabled = async (field) => {
    setToggling(field.id);
    try {
      const updated = await adminApi.updateContactFormField(field.id, { enabled: !field.enabled });
      setFields(prev => prev.map(f => f.id === field.id ? updated : f));
      success(updated.enabled ? 'Field shown' : 'Field hidden', field.label);
    } catch (e) { toastError('Failed', e.message); }
    finally { setToggling(null); }
  };

  // Drag-to-reorder
  const handleDragStart = (idx) => { dragItem.current = idx; };
  const handleDragEnter = (idx) => { dragOver.current = idx; };
  const handleDragEnd = async () => {
    if (dragItem.current === null || dragOver.current === null || dragItem.current === dragOver.current) {
      dragItem.current = null; dragOver.current = null; return;
    }
    const reordered = [...fields];
    const [moved] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOver.current, 0, moved);
    const withOrder = reordered.map((f, i) => ({ ...f, sort_order: i }));
    setFields(withOrder);
    dragItem.current = null; dragOver.current = null;
    try {
      await adminApi.reorderContactFormFields(withOrder.map(f => ({ id: f.id, sort_order: f.sort_order })));
    } catch (e) { toastError('Reorder failed', e.message); load(); }
  };

  if (!fields) {
    return (
      <div className="p-8 flex items-center gap-3 text-zinc-500">
        {error
          ? <p className="text-error-400 text-sm">{error}</p>
          : <><Icon icon="solar:loading-linear" width={18} className="animate-spin" /><span className="text-sm">Loading…</span></>
        }
      </div>
    );
  }

  const sorted = [...fields].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <>
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-semibold text-2xl text-zinc-100">Contact Form</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {fields.filter(f => f.enabled).length} of {fields.length} fields visible · drag rows to reorder
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMigrateOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium border bg-[#18181B] border-zinc-700 hover:border-primary-500/40 text-primary-400 hover:text-primary-300 transition-all"
          >
            <Icon icon="solar:transfer-horizontal-linear" width={16} />
            Push to Env
          </button>
          <button
            onClick={() => setPreviewOpen(v => !v)}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium border bg-[#18181B] border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-zinc-100 transition-all"
          >
            <Icon icon={previewOpen ? 'solar:eye-closed-linear' : 'solar:eye-linear'} width={16} />
            {previewOpen ? 'Hide preview' : 'Preview'}
          </button>
          <button
            onClick={() => setEditTarget('new')}
            className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-400 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-all shadow-[0_0_20px_rgba(51, 112, 246,0.2)]"
          >
            <Icon icon="solar:add-circle-linear" width={16} /> Add Field
          </button>
        </div>
      </div>

      {error ? <div className="bg-error-500/10 border border-error-500/20 rounded-xl p-3 text-sm text-error-400 mb-4">{error}</div> : null}

      {/* Live preview */}
      {previewOpen && (
        <div className="mb-6">
          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-3">Form Preview</p>
          <LivePreview fields={fields} />
        </div>
      )}

      {/* Field list */}
      <div className="bg-[#111113] border border-zinc-800 rounded-2xl overflow-hidden">
        {sorted.length === 0 ? (
          <div className="py-12 text-center">
            <Icon icon="solar:document-add-linear" width={32} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">No fields yet.</p>
            <button onClick={() => setEditTarget('new')}
              className="mt-3 text-xs text-primary-400 hover:text-primary-300 transition-colors">
              Add your first field
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {sorted.map((field, idx) => (
              <div
                key={field.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragEnter={() => handleDragEnter(idx)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className="flex items-center gap-4 px-5 py-4 hover:bg-zinc-800/20 transition-colors group cursor-default"
              >
                {/* Drag handle */}
                <Icon icon="solar:sort-by-time-linear" width={14}
                  className="text-zinc-700 group-hover:text-zinc-500 transition-colors shrink-0 cursor-grab" />

                {/* Field info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-zinc-200">{field.label}</span>
                    {field.required && (
                      <span className="text-[9px] text-error-400 bg-error-500/10 border border-error-500/20 px-1.5 py-0.5 rounded-md">required</span>
                    )}
                    <TypeBadge type={field.field_type} />
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-md ${field.width === 'full' ? 'text-zinc-500 bg-zinc-800/60' : 'text-zinc-600 bg-zinc-800/40'}`}>
                      {field.width}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono text-zinc-600">{field.name}</span>
                    {field.placeholder && (
                      <span className="text-[10px] text-zinc-700 truncate max-w-[200px]">· {field.placeholder}</span>
                    )}
                  </div>
                </div>

                {/* Toggle */}
                <button
                  onClick={() => toggleEnabled(field)}
                  disabled={toggling === field.id}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 shrink-0 ${field.enabled ? 'bg-success-500' : 'bg-zinc-700'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${field.enabled ? 'translate-x-4' : 'translate-x-1'}`} />
                </button>

                {/* Edit */}
                <button
                  onClick={() => setEditTarget(field)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-primary-400 hover:bg-primary-500/10 transition-all shrink-0"
                  title="Edit field"
                >
                  <Icon icon="solar:pen-linear" width={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Drawer */}
      {editTarget && (
        <EditDrawer
          field={editTarget === 'new' ? EMPTY_FORM : editTarget}
          isNew={editTarget === 'new'}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setEditTarget(null)}
        />
      )}

      {migrateOpen && (
        <MigrateModal
          objectName="contact_form"
          mode="config"
          selectedIds={new Set()}
          onClose={() => setMigrateOpen(false)}
        />
      )}
    </div>
    </>
  );
}
