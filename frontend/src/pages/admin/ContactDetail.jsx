import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ContactStatusBadge from '../../components/ContactStatusBadge';
import { CONTACT_STATUSES } from '../../utils/contactStatusConfig';
import Icon from '../../components/Icon';
import { adminApi } from '../../services/adminApi';
import { useToast } from '../../contexts/ToastContext';
import { usePermissions } from '../../contexts/PermissionsContext';

const STATUS_LABEL = { new: 'New', in_progress: 'In Progress', completed: 'Completed', closed: 'Closed' };

function Field({ label, value, mono = false }) {
  return (
    <div className="flex gap-4 py-3 border-b border-zinc-800/60 last:border-0">
      <dt className="w-28 shrink-0 text-xs text-zinc-500 font-mono uppercase tracking-wider pt-0.5">{label}</dt>
      <dd className={`flex-1 text-sm break-words ${mono ? 'font-mono text-zinc-400' : 'text-zinc-200'}`}>{value ?? '—'}</dd>
    </div>
  );
}

export default function ContactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const { canDo } = usePermissions();

  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    adminApi
      .getContact(id)
      .then((c) => { setContact(c); setNewStatus(c.status); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusSave = async () => {
    setSaving(true);
    try {
      const updated = await adminApi.updateContactStatus(id, newStatus);
      setContact(updated);
      success('Status updated', `Changed to ${newStatus.replace('_', ' ')}.`);
    } catch (err) {
      setError(err.message);
      toastError('Save failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this contact? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await adminApi.deleteContact(id);
      navigate('/admin/contacts', { replace: true });
    } catch (err) {
      setError(err.message);
      toastError('Delete failed', err.message);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 text-zinc-500">
          <Icon icon="solar:loading-linear" width={18} className="animate-spin" />
          <span className="text-sm">Loading contact…</span>
        </div>
      </div>
    );
  }

  if (error && !contact) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-sm text-rose-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/contacts')}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
          >
            <Icon icon="solar:arrow-left-linear" width={18} />
          </button>
          <div>
            <h1 className="font-display font-semibold text-2xl text-zinc-100">{contact.name}</h1>
            <p className="text-sm text-zinc-500 mt-0.5">{contact.email}</p>
          </div>
        </div>
        {canDo('contacts.delete') && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 rounded-xl px-3 py-2 text-xs font-medium transition-all disabled:opacity-50"
          >
            <Icon icon={deleting ? 'solar:loading-linear' : 'solar:trash-bin-minimalistic-linear'} width={14} className={deleting ? 'animate-spin' : ''} />
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        )}
      </div>

      {error ? (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-sm text-rose-400 mb-4">{error}</div>
      ) : null}

      {/* Status update */}
      <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-5 mb-4">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Status</p>
        <div className="flex items-center gap-3 flex-wrap">
          <ContactStatusBadge status={contact.status} />
          <Icon icon="solar:arrow-right-linear" width={14} className="text-zinc-600" />
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="bg-[#18181B] border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500/50 transition-all"
          >
            {CONTACT_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
          <button
            onClick={handleStatusSave}
            disabled={saving || newStatus === contact.status}
            className="px-4 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium transition-all disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* All fields */}
      <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-5">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Details</p>
        <dl>
          <Field label="Name" value={contact.name} />
          <Field label="Email" value={contact.email} mono />
          <Field label="Service" value={contact.service} />
          <Field label="Source" value={contact.source} mono />
          <Field label="Created" value={new Date(contact.created_at).toLocaleString()} mono />
          <Field label="Updated" value={contact.updated_at ? new Date(contact.updated_at).toLocaleString() : '—'} mono />
          <div className="pt-3">
            <dt className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-2">Message</dt>
            <dd className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">{contact.message}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
