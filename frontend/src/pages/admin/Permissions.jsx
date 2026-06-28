import { useEffect, useState } from 'react';
import Icon from '../../components/Icon';
import { adminApi } from '../../services/adminApi';
import { useToast } from '../../contexts/ToastContext';
import { usePermissions } from '../../contexts/PermissionsContext';

// ─── Action definitions ───────────────────────────────────────────────────────

const ACTION_GROUPS = [
  {
    label: 'Contacts',
    icon: 'solar:letter-linear',
    actions: [
      { key: 'contacts.view',          label: 'View contacts' },
      { key: 'contacts.status_update', label: 'Update status' },
      { key: 'contacts.export',        label: 'Export CSV' },
      { key: 'contacts.delete',        label: 'Delete contacts' },
    ],
  },
  {
    label: 'Newsletter',
    icon: 'solar:mailbox-linear',
    actions: [
      { key: 'newsletter.view',   label: 'View subscribers' },
      { key: 'newsletter.export', label: 'Export CSV' },
      { key: 'newsletter.delete', label: 'Remove subscribers' },
    ],
  },
  {
    label: 'Services',
    icon: 'solar:code-square-linear',
    actions: [
      { key: 'services.view',   label: 'View services' },
      { key: 'services.edit',   label: 'Edit services' },
      { key: 'services.delete', label: 'Delete services' },
    ],
  },
  {
    label: 'Testimonials',
    icon: 'solar:chat-round-linear',
    actions: [
      { key: 'testimonials.view', label: 'View testimonials' },
      { key: 'testimonials.edit', label: 'Edit testimonials' },
    ],
  },
  {
    label: 'Social Links',
    icon: 'solar:share-circle-linear',
    actions: [
      { key: 'social_links.view',   label: 'View social links' },
      { key: 'social_links.edit',   label: 'Edit social links' },
      { key: 'social_links.delete', label: 'Delete social links' },
    ],
  },
  {
    label: 'Site Content',
    icon: 'solar:document-text-linear',
    actions: [
      { key: 'about.edit',        label: 'Edit About page' },
      { key: 'branding.edit',     label: 'Edit Branding' },
      { key: 'contact_form.edit', label: 'Edit Contact Form' },
    ],
  },
];

const ROLES = [
  { key: 'admin',    label: 'Admin',    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  { key: 'customer', label: 'Customer', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
];

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-40 ${
        checked ? 'bg-emerald-500' : 'bg-zinc-700'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Permissions() {
  const { success, error: toastError } = useToast();
  const { refresh: refreshMyPerms } = usePermissions();
  // perms[role][action] = boolean
  const [perms, setPerms] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.getPermissions()
      .then((rows) => {
        const map = {};
        for (const { role, action, enabled } of rows) {
          if (!map[role]) map[role] = {};
          map[role][action] = enabled;
        }
        // fill defaults for any actions not yet in DB
        for (const role of ROLES.map(r => r.key)) {
          if (!map[role]) map[role] = {};
          for (const group of ACTION_GROUPS) {
            for (const { key } of group.actions) {
              if (map[role][key] === undefined) map[role][key] = false;
            }
          }
        }
        setPerms(map);
      })
      .catch((e) => setError(e.message));
  }, []);

  const toggle = (role, action) => {
    setPerms((p) => ({ ...p, [role]: { ...p[role], [action]: !p[role][action] } }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const permissions = [];
      for (const role of Object.keys(perms)) {
        for (const [action, enabled] of Object.entries(perms[role])) {
          permissions.push({ role, action, enabled });
        }
      }
      await adminApi.bulkSetPermissions(permissions);
      success('Permissions saved', 'All role permissions updated.');
      setDirty(false);
      refreshMyPerms();
    } catch (e) { setError(e.message); toastError('Save failed', e.message); }
    finally { setSaving(false); }
  };

  if (!perms) {
    return (
      <div className="p-8 flex items-center gap-3 text-zinc-500">
        {error
          ? <p className="text-rose-400 text-sm">{error}</p>
          : <><Icon icon="solar:loading-linear" width={18} className="animate-spin" /><span className="text-sm">Loading…</span></>
        }
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-semibold text-2xl text-zinc-100">Permissions</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Control what actions each role can perform in the admin panel.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl px-5 py-2.5 text-sm font-medium transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
        >
          <Icon icon={saving ? 'solar:loading-linear' : 'solar:floppy-disk-linear'} width={15} className={saving ? 'animate-spin' : ''} />
          {saving ? 'Saving…' : dirty ? 'Save Changes' : 'Saved'}
        </button>
      </div>

      {error ? <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-sm text-rose-400 mb-6">{error}</div> : null}

      {/* Info banner */}
      <div className="mb-6 flex items-start gap-3 bg-amber-500/8 border border-amber-500/20 rounded-xl p-4">
        <Icon icon="solar:info-circle-linear" width={16} className="text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-300/80 leading-relaxed">
          Super admins always have full access regardless of these settings. Changes here apply to <strong>Admin</strong> and <strong>Customer</strong> roles only.
          Permission enforcement is applied at the API level — disabling an action prevents it across both the UI and direct API calls.
        </p>
      </div>

      {/* Matrix */}
      <div className="bg-[#111113] border border-zinc-800 rounded-2xl overflow-hidden">
        {/* Role header */}
        <div className="grid bg-[#18181B] border-b border-zinc-800" style={{ gridTemplateColumns: '1fr repeat(2, 160px)' }}>
          <div className="px-6 py-4" />
          {ROLES.map(({ key, label, color }) => (
            <div key={key} className="px-4 py-4 flex items-center justify-center">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-medium ${color}`}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {ACTION_GROUPS.map((group, gi) => (
          <div key={group.label} className={gi > 0 ? 'border-t border-zinc-800' : ''}>
            {/* Group header */}
            <div className="px-6 py-3 flex items-center gap-2 bg-zinc-900/40">
              <Icon icon={group.icon} width={14} className="text-zinc-500" />
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">{group.label}</span>
            </div>
            {/* Actions */}
            {group.actions.map((action) => (
              <div
                key={action.key}
                className="grid border-t border-zinc-800/50 hover:bg-zinc-800/20 transition-colors"
                style={{ gridTemplateColumns: '1fr repeat(2, 160px)' }}
              >
                <div className="px-6 py-3.5 flex items-center">
                  <span className="text-sm text-zinc-300">{action.label}</span>
                  <span className="ml-2 text-[10px] font-mono text-zinc-700">{action.key}</span>
                </div>
                {ROLES.map(({ key: role }) => (
                  <div key={role} className="px-4 py-3.5 flex items-center justify-center">
                    <Toggle
                      checked={perms[role]?.[action.key] ?? false}
                      onChange={() => toggle(role, action.key)}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      <p className="mt-4 text-[10px] text-zinc-700 text-center">
        Last synced from database on page load. Unsaved changes are highlighted by the Save button.
      </p>
    </div>
  );
}
