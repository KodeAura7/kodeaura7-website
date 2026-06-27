import { useEffect, useRef, useState } from 'react';
import Icon from '../../Icon';
import FilterBuilder from './FilterBuilder';

export default function SaveListViewModal({ mode = 'create', initialData = null, fieldConfig, onSave, onClose }) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [filters, setFilters] = useState(initialData?.filters ?? []);
  const [logic, setLogic] = useState(initialData?.filter_logic ?? 'AND');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const nameRef = useRef(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave({ name: name.trim(), description: description.trim(), filterLogic: logic, filters });
    } catch (err) {
      setError(err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full bg-[#18181B] border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-[#111113] border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
          <h2 className="text-base font-semibold text-zinc-100">
            {mode === 'create' ? 'New List View' : 'Edit List View'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all">
            <Icon icon="solar:close-circle-linear" width={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-xs text-rose-400">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Name <span className="text-rose-400">*</span></label>
            <input ref={nameRef} type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Closed Contacts" className={inputClass} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description…" className={inputClass} />
          </div>

          {/* Filter builder section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Filters</label>
              <span className="text-[10px] font-mono text-zinc-600">{filters.length} filter{filters.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
              <FilterBuilder
                fields={fieldConfig}
                filters={filters}
                onChange={setFilters}
                logic={logic}
                onLogicChange={setLogic}
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800 shrink-0">
          <button type="button" onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-zinc-100 bg-[#18181B] border border-zinc-700 hover:border-zinc-500 transition-all">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-indigo-500 hover:bg-indigo-400 text-white transition-all disabled:opacity-60 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <Icon icon={saving ? 'solar:loading-linear' : 'solar:floppy-disk-linear'} width={15} className={saving ? 'animate-spin' : ''} />
            {saving ? 'Saving…' : mode === 'create' ? 'Create List View' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
