import { useEffect, useRef, useState } from 'react';
import Icon from '../../components/Icon';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { adminApi } from '../../services/adminApi';
import { usePermissions } from '../../contexts/PermissionsContext';
import MigrateModal from '../../components/admin/MigrateModal';

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="text-amber-400 transition-transform hover:scale-110"
        >
          <Icon
            icon={(hovered || value) >= star ? 'solar:star-bold' : 'solar:star-linear'}
            width={20}
          />
        </button>
      ))}
      {(hovered || value) > 0 ? (
        <span className="ml-2 text-xs text-zinc-500">{STAR_LABELS[hovered || value]}</span>
      ) : null}
    </div>
  );
}

function StarRow({ rating }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Icon
          key={i}
          icon={i < rating ? 'solar:star-bold' : 'solar:star-linear'}
          width={13}
          className={i < rating ? 'text-amber-400' : 'text-zinc-700'}
        />
      ))}
    </span>
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
      await adminApi.updateTestimonialOrder(id, num);
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

const EMPTY_FORM = { name: '', designation: '', rating: 0, review: '' };

export default function Testimonials() {
  const { user } = useAuth();
  const { canDo } = usePermissions();

  // All testimonials (admin overview table)
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [toggling, setToggling] = useState(null);

  // My testimonials panel
  const [myReviews, setMyReviews] = useState(null);
  const [myPanelOpen, setMyPanelOpen] = useState(false);

  // Add / edit form
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null); // null = create, string = update
  const [reviewForm, setReviewForm] = useState(EMPTY_FORM);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewMsg, setReviewMsg] = useState({ type: '', text: '' });
  const [deleting, setDeleting] = useState(null);

  // Export / import
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState({ type: '', text: '' });
  const importInputRef = useRef(null);

  // Migrate
  const [checkedIds, setCheckedIds] = useState(new Set());
  const [migrateOpen, setMigrateOpen] = useState(false);
  const rows = items ?? [];
  const allChecked = rows.length > 0 && rows.every((r) => checkedIds.has(r.id));
  const someChecked = rows.some((r) => checkedIds.has(r.id)) && !allChecked;
  const toggleAll = () => {
    if (allChecked) setCheckedIds((p) => { const n = new Set(p); rows.forEach((r) => n.delete(r.id)); return n; });
    else setCheckedIds((p) => { const n = new Set(p); rows.forEach((r) => n.add(r.id)); return n; });
  };
  const toggleOne = (id) => setCheckedIds((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const loadAll = () => {
    setError('');
    adminApi.testimonials().then(setItems).catch((err) => setError(err.message));
  };

  const loadMine = () => {
    api.myTestimonials().then(setMyReviews).catch(() => setMyReviews([]));
  };

  useEffect(() => {
    loadAll();
    loadMine();
  }, []);

  const openNewForm = () => {
    setEditId(null);
    setReviewForm({ ...EMPTY_FORM, name: user?.name ?? '' });
    setReviewMsg({ type: '', text: '' });
    setFormOpen(true);
    setMyPanelOpen(true);
  };

  const openEditForm = (t) => {
    setEditId(t.id);
    setReviewForm({ name: t.name, designation: t.designation, rating: t.rating, review: t.review });
    setReviewMsg({ type: '', text: '' });
    setFormOpen(true);
    setMyPanelOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditId(null);
    setReviewForm(EMPTY_FORM);
    setReviewMsg({ type: '', text: '' });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.rating) { setReviewMsg({ type: 'error', text: 'Please select a star rating.' }); return; }
    setReviewSaving(true);
    setReviewMsg({ type: '', text: '' });
    try {
      if (editId) {
        await api.updateTestimonial(editId, reviewForm);
        setReviewMsg({ type: 'success', text: 'Review updated.' });
      } else {
        await api.submitTestimonial(reviewForm);
        setReviewMsg({ type: 'success', text: 'Review submitted. Approve it in the table below to show it on site.' });
      }
      loadMine();
      loadAll();
      if (!editId) {
        setEditId(null);
        setReviewForm({ ...EMPTY_FORM, name: user?.name ?? '' });
      }
    } catch (err) {
      setReviewMsg({ type: 'error', text: err.message });
    } finally {
      setReviewSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this review? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await adminApi.deleteTestimonial(id);
      loadMine();
      loadAll();
      if (editId === id) closeForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleToggle = async (id, current) => {
    setToggling(id);
    try {
      const updated = await adminApi.updateTestimonialVisibility(id, !current);
      setItems((prev) =>
        prev.map((t) => (t.id === id ? { ...t, visible: updated.visible, approved_at: updated.approved_at } : t))
      );
      loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setToggling(null);
    }
  };

  const handleOrderSaved = (id, newOrder) => {
    setItems((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, sort_order: newOrder } : t));
      return [...updated].sort((a, b) => {
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
        return new Date(a.created_at) - new Date(b.created_at);
      });
    });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await adminApi.exportTestimonials();
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!importInputRef.current) return;
    importInputRef.current.value = '';
    if (!file) return;
    setImporting(true);
    setImportMsg({ type: '', text: '' });
    try {
      const csv = await file.text();
      const result = await adminApi.importTestimonials(csv);
      setImportMsg({ type: 'success', text: `Imported ${result.imported} testimonial${result.imported !== 1 ? 's' : ''}.` });
      loadAll();
    } catch (err) {
      setImportMsg({ type: 'error', text: err.message });
    } finally {
      setImporting(false);
    }
  };

  const shown = items ? items.filter((t) => t.visible).length : 0;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display font-semibold text-2xl text-zinc-100">Testimonials</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {items ? `${items.length} total · ${shown} visible on site` : '—'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            ref={importInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImportFile}
          />
          <button
            onClick={handleExport}
            disabled={exporting || !items}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all border bg-[#18181B] border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-zinc-100 disabled:opacity-50"
          >
            <Icon icon={exporting ? 'solar:loading-linear' : 'solar:export-linear'} width={16} className={exporting ? 'animate-spin' : ''} />
            Export
          </button>
          <button
            onClick={() => importInputRef.current?.click()}
            disabled={importing}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all border bg-[#18181B] border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-zinc-100 disabled:opacity-50"
          >
            <Icon icon={importing ? 'solar:loading-linear' : 'solar:import-linear'} width={16} className={importing ? 'animate-spin' : ''} />
            Import
          </button>
          {myReviews && myReviews.length > 0 ? (
            <button
              onClick={() => { setMyPanelOpen((v) => !v); if (formOpen) closeForm(); }}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all border ${
                myPanelOpen && !formOpen
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                  : 'bg-[#18181B] border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-zinc-100'
              }`}
            >
              <Icon icon="solar:star-linear" width={16} />
              My Reviews ({myReviews.length})
            </button>
          ) : null}
          <button
            onClick={openNewForm}
            className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)]"
          >
            <Icon icon="solar:add-circle-linear" width={16} />
            Add Review
          </button>
        </div>
      </div>

      {/* My Reviews panel */}
      {myPanelOpen && myReviews && myReviews.length > 0 ? (
        <div className="mb-6 bg-[#111113] border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-200">My Reviews</h2>
            <button onClick={() => { setMyPanelOpen(false); closeForm(); }} className="text-zinc-600 hover:text-zinc-300 transition-colors">
              <Icon icon="solar:close-circle-linear" width={18} />
            </button>
          </div>

          {/* Form (add/edit) */}
          {formOpen ? (
            <div className="px-5 py-5 border-b border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  {editId ? 'Edit Review' : 'New Review'}
                </h3>
                <button onClick={closeForm} className="text-zinc-600 hover:text-zinc-300 transition-colors">
                  <Icon icon="solar:close-square-linear" width={16} />
                </button>
              </div>
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400">Display Name <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      value={reviewForm.name}
                      onChange={(e) => setReviewForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Name shown on the testimonial"
                      required
                      className="w-full bg-[#18181B] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400">Designation / Role <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      value={reviewForm.designation}
                      onChange={(e) => setReviewForm((p) => ({ ...p, designation: e.target.value }))}
                      placeholder="e.g. CEO at Acme Inc."
                      required
                      className="w-full bg-[#18181B] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400">Rating <span className="text-rose-500">*</span></label>
                  <StarPicker value={reviewForm.rating} onChange={(v) => setReviewForm((p) => ({ ...p, rating: v }))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400">Review <span className="text-rose-500">*</span></label>
                  <textarea
                    value={reviewForm.review}
                    onChange={(e) => setReviewForm((p) => ({ ...p, review: e.target.value }))}
                    placeholder="Share your thoughts… (minimum 20 characters)"
                    required
                    rows={3}
                    className="w-full bg-[#18181B] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                  />
                </div>
                {reviewMsg.text ? (
                  <p className={`text-xs flex items-center gap-1.5 ${reviewMsg.type === 'error' ? 'text-rose-400' : 'text-emerald-400'}`}>
                    <Icon icon={reviewMsg.type === 'error' ? 'solar:danger-circle-linear' : 'solar:check-circle-linear'} width={13} />
                    {reviewMsg.text}
                  </p>
                ) : null}
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={reviewSaving}
                    className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl px-5 py-2.5 text-sm font-medium transition-all disabled:opacity-60"
                  >
                    <Icon icon={reviewSaving ? 'solar:loading-linear' : 'solar:star-linear'} width={15} className={reviewSaving ? 'animate-spin' : ''} />
                    {reviewSaving ? 'Saving…' : editId ? 'Save Changes' : 'Submit Review'}
                  </button>
                  <button type="button" onClick={closeForm} className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          {/* My reviews list */}
          <div className="divide-y divide-zinc-800/60">
            {myReviews.map((t) => (
              <div key={t.id} className="px-5 py-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-sm font-medium text-zinc-200">{t.name}</span>
                    <span className="text-xs text-zinc-600">·</span>
                    <span className="text-xs text-zinc-500">{t.designation}</span>
                    <StarRow rating={t.rating} />
                    <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-mono ${t.visible ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                      {t.visible ? 'visible' : 'hidden'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{t.review}</p>
                  <p className="text-[10px] text-zinc-700 font-mono mt-1">{new Date(t.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEditForm(t)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                    title="Edit"
                  >
                    <Icon icon="solar:pen-linear" width={15} />
                  </button>
                  {canDo('testimonials.edit') && (
                    <button
                      onClick={() => handleDelete(t.id)}
                      disabled={deleting === t.id}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all disabled:opacity-30"
                      title="Delete"
                    >
                      <Icon icon="solar:trash-bin-minimalistic-linear" width={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* "Add Review" form when no existing reviews yet */}
      {formOpen && (!myReviews || myReviews.length === 0) ? (
        <div className="mb-6 bg-[#111113] border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-200">Add Review</h2>
            <button onClick={closeForm} className="text-zinc-600 hover:text-zinc-300 transition-colors">
              <Icon icon="solar:close-circle-linear" width={18} />
            </button>
          </div>
          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Display Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={reviewForm.name}
                  onChange={(e) => setReviewForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Name shown on the testimonial"
                  required
                  className="w-full bg-[#18181B] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Designation / Role <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={reviewForm.designation}
                  onChange={(e) => setReviewForm((p) => ({ ...p, designation: e.target.value }))}
                  placeholder="e.g. CEO at Acme Inc."
                  required
                  className="w-full bg-[#18181B] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Rating <span className="text-rose-500">*</span></label>
              <StarPicker value={reviewForm.rating} onChange={(v) => setReviewForm((p) => ({ ...p, rating: v }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400">Review <span className="text-rose-500">*</span></label>
              <textarea
                value={reviewForm.review}
                onChange={(e) => setReviewForm((p) => ({ ...p, review: e.target.value }))}
                placeholder="Share your thoughts… (minimum 20 characters)"
                required
                rows={3}
                className="w-full bg-[#18181B] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
              />
            </div>
            {reviewMsg.text ? (
              <p className={`text-xs flex items-center gap-1.5 ${reviewMsg.type === 'error' ? 'text-rose-400' : 'text-emerald-400'}`}>
                <Icon icon={reviewMsg.type === 'error' ? 'solar:danger-circle-linear' : 'solar:check-circle-linear'} width={13} />
                {reviewMsg.text}
              </p>
            ) : null}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={reviewSaving}
                className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl px-5 py-2.5 text-sm font-medium transition-all disabled:opacity-60"
              >
                <Icon icon={reviewSaving ? 'solar:loading-linear' : 'solar:star-linear'} width={15} className={reviewSaving ? 'animate-spin' : ''} />
                {reviewSaving ? 'Saving…' : 'Submit Review'}
              </button>
              <button type="button" onClick={closeForm} className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {importMsg.text ? (
        <div className={`border rounded-xl p-3 text-sm mb-4 flex items-center gap-2 ${importMsg.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
          <Icon icon={importMsg.type === 'error' ? 'solar:danger-circle-linear' : 'solar:check-circle-linear'} width={15} />
          {importMsg.text}
        </div>
      ) : null}

      {error ? (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-sm text-rose-400 mb-4">{error}</div>
      ) : null}

      {/* Bulk toolbar */}
      {checkedIds.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-3">
          <span className="text-xs text-indigo-400 font-medium">{checkedIds.size} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => setMigrateOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181B] border border-zinc-700 hover:border-indigo-500/50 text-zinc-300 hover:text-indigo-300 text-xs font-medium transition-all">
              <Icon icon="solar:transfer-horizontal-linear" width={13} />
              Migrate
            </button>
            <button onClick={() => setCheckedIds(new Set())}
              className="px-3 py-1.5 rounded-lg bg-[#18181B] border border-zinc-700 hover:border-zinc-500 text-zinc-400 text-xs transition-all">
              Deselect all
            </button>
          </div>
        </div>
      )}

      {migrateOpen && (
        <MigrateModal
          objectName="testimonials"
          selectedIds={checkedIds}
          onClose={() => setMigrateOpen(false)}
          onSuccess={() => { setMigrateOpen(false); setCheckedIds(new Set()); loadAll(); }}
        />
      )}

      {/* All testimonials table */}
      <div className="bg-[#111113] border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#18181B] border-b border-zinc-800">
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={allChecked} ref={(el) => { if (el) el.indeterminate = someChecked; }}
                    onChange={toggleAll} className="w-3.5 h-3.5 rounded border-zinc-600 bg-[#18181B] accent-indigo-500 cursor-pointer" />
                </th>
                {['Order', 'Name', 'Designation', 'Rating', 'Review', 'Submitted By', 'Approved By', 'Visible'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {!items ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-zinc-700">
                    <Icon icon="solar:loading-linear" width={22} className="animate-spin" />
                    <span className="text-sm">Loading testimonials…</span>
                  </div>
                </td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-zinc-700">
                    <Icon icon="solar:star-linear" width={28} />
                    <span className="text-sm">No reviews submitted yet.</span>
                  </div>
                </td></tr>
              ) : (
                items.map((t) => (
                  <tr key={t.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={checkedIds.has(t.id)} onChange={() => toggleOne(t.id)}
                        className="w-3.5 h-3.5 rounded border-zinc-600 bg-[#18181B] accent-indigo-500 cursor-pointer" />
                    </td>
                    <td className="px-4 py-3">
                      <OrderCell
                        id={t.id}
                        initialOrder={t.sort_order}
                        onSaved={handleOrderSaved}
                        onError={setError}
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-zinc-200 font-medium">{t.name}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 whitespace-nowrap text-xs max-w-[120px] truncate">{t.designation}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><StarRow rating={t.rating} /></td>
                    <td className="px-4 py-3 text-zinc-400 max-w-[200px]">
                      <p className="line-clamp-2 text-xs leading-relaxed">{t.review}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-xs text-zinc-300">{t.user_name}</p>
                      <p className="text-[10px] text-zinc-600 font-mono">{t.user_email}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap min-w-[140px]">
                      {t.approved_by_name ? (
                        <div>
                          <p className="text-xs text-zinc-300">{t.approved_by_name}</p>
                          <p className="text-[10px] text-zinc-600 font-mono">
                            {t.approved_at ? new Date(t.approved_at).toLocaleDateString() : ''}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-700">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => handleToggle(t.id, t.visible)}
                        disabled={toggling === t.id}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
                          t.visible ? 'bg-emerald-500' : 'bg-zinc-700'
                        }`}
                        title={t.visible ? 'Hide from site' : 'Show on site'}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            t.visible ? 'translate-x-4' : 'translate-x-1'
                          }`}
                        />
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
