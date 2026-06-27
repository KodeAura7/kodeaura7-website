import { useEffect, useState } from 'react';
import Icon from '../../components/Icon';
import { useAuth } from '../../hooks/useAuth';
import { adminApi } from '../../services/adminApi';
import { TableToolbar } from '../../components/admin/TableToolbar';
import { useColumnVisibility } from '../../hooks/useColumnVisibility';
import { useToast } from '../../contexts/ToastContext';

const COLS = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status' },
  { key: 'last_login', label: 'Last Login', default: false },
  { key: 'created_at', label: 'Created' },
];

const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'role', label: 'Role' },
  { value: 'created_at', label: 'Created' },
];

const FILTER_GROUPS = [
  {
    key: 'role',
    label: 'Role',
    options: [
      { value: 'customer', label: 'Customer' },
      { value: 'admin', label: 'Admin' },
      { value: 'super_admin', label: 'Super Admin' },
    ],
  },
  {
    key: 'status',
    label: 'Status',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
  },
];

function RollupCard({ label, total, active, icon, color }) {
  const colors = {
    indigo: 'bg-indigo-500/10 text-indigo-400',
    amber: 'bg-amber-500/10 text-amber-400',
    cyan: 'bg-cyan-500/10 text-cyan-400'
  };
  return (
    <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
        <Icon icon={icon} width={18} />
      </div>
      <div>
        <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-0.5">{label}</p>
        <p className="font-display font-semibold text-xl text-zinc-100">
          {total ?? <span className="text-zinc-600">—</span>}
          {total != null ? <span className="text-xs text-zinc-500 font-normal ml-2 font-sans">{active} active</span> : null}
        </p>
      </div>
    </div>
  );
}

const ROLES = ['customer', 'admin', 'super_admin'];
const STATUSES = ['active', 'inactive'];

function UserModal({ initial, onClose, onSaved }) {
  const isEdit = Boolean(initial);
  const [values, setValues] = useState(
    initial
      ? { name: initial.name, role: initial.role, status: initial.status, password: '' }
      : { name: '', email: '', password: '', role: 'admin', status: 'active' }
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { ...values };
      if (isEdit && !payload.password) delete payload.password;
      if (isEdit) {
        await adminApi.updateUser(initial.id, payload);
      } else {
        await adminApi.createUser(payload);
      }
      onSaved(!isEdit, values.name);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div
        className="bg-[#111113] border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <h3 className="font-display font-semibold text-lg text-zinc-100">
            {isEdit ? 'Edit User' : 'Create User'}
          </h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 transition-colors">
            <Icon icon="solar:close-circle-linear" width={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 ml-0.5">Name</label>
            <input
              name="name"
              value={values.name}
              onChange={handleChange}
              placeholder="Full Name"
              required
              className="form-input"
            />
          </div>
          {!isEdit ? (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 ml-0.5">Email</label>
              <input
                name="email"
                type="email"
                value={values.email}
                onChange={handleChange}
                placeholder="admin@example.com"
                required
                className="form-input"
              />
            </div>
          ) : null}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 ml-0.5">
              {isEdit ? 'New Password (leave blank to keep current)' : 'Password'}
            </label>
            <input
              name="password"
              type="password"
              value={values.password}
              onChange={handleChange}
              placeholder={isEdit ? 'Leave blank to keep unchanged' : 'Minimum 8 characters'}
              required={!isEdit}
              minLength={isEdit ? undefined : 8}
              className="form-input"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 ml-0.5">Role</label>
              <select name="role" value={values.role} onChange={handleChange} className="form-input">
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 ml-0.5">Status</label>
              <select name="status" value={values.status} onChange={handleChange} className="form-input">
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          {error ? (
            <p className="text-xs text-rose-400 flex items-center gap-1.5">
              <Icon icon="solar:danger-circle-linear" width={14} /> {error}
            </p>
          ) : null}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-[#18181B] border border-zinc-700 text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-400 transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)] disabled:opacity-60"
            >
              {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RoleBadge({ role }) {
  const styles = {
    super_admin: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    admin: 'bg-zinc-800 text-zinc-400 border-zinc-700'
  };
  return (
    <span className={`inline-block border rounded-full px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider ${styles[role] || styles.admin}`}>
      {role.replace('_', ' ')}
    </span>
  );
}

function StatusDot({ status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${status === 'active' ? 'text-emerald-400' : 'text-zinc-500'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
      {status}
    </span>
  );
}

export default function Users() {
  const { user: me } = useAuth();
  const { success, error: toastError } = useToast();
  const isSuperAdmin = me?.role === 'super_admin';
  const [users, setUsers] = useState(null);
  const [rollup, setRollup] = useState(null);
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name');
  const [dir, setDir] = useState('asc');
  const [filters, setFilters] = useState({});
  const { visibleCols, toggle: toggleCol, reset: resetCols } = useColumnVisibility('users', COLS);

  const handleFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val }));

  const load = () => {
    setError('');
    adminApi.users().then(setUsers).catch((err) => setError(err.message));
    adminApi.userRollup().then(setRollup).catch(() => null);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete ${user.name}? This cannot be undone.`)) return;
    setDeleting(user.id);
    try {
      await adminApi.deleteUser(user.id);
      success('User deleted', `${user.name} removed.`);
      load();
    } catch (err) {
      setError(err.message); toastError('Delete failed', err.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleSaved = (isNew, name) => {
    setModal(null);
    success(isNew ? 'User created' : 'User updated', name ? `${name} saved.` : undefined);
    load();
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {modal ? (
        <UserModal
          initial={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      ) : null}

      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <RollupCard label="Super Admins" total={rollup?.super_admin?.total} active={rollup?.super_admin?.active} icon="solar:shield-user-linear" color="indigo" />
        <RollupCard label="Admins" total={rollup?.admin?.total} active={rollup?.admin?.active} icon="solar:user-check-linear" color="amber" />
        <RollupCard label="Customers" total={rollup?.customer?.total} active={rollup?.customer?.active} icon="solar:users-group-two-rounded-linear" color="cyan" />
      </div>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-semibold text-2xl text-zinc-100">Users</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {users ? `${users.length} user${users.length !== 1 ? 's' : ''}` : '—'}
          </p>
        </div>
        {isSuperAdmin ? (
          <button onClick={() => setModal('create')}
            className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <Icon icon="solar:user-plus-linear" width={16} />Create User
          </button>
        ) : <span className="text-xs text-zinc-600 font-mono">View only</span>}
      </div>

      {error ? <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-sm text-rose-400 mb-4">{error}</div> : null}

      {(() => {
        const q = search.toLowerCase();
        const filtered = (users || [])
          .filter((u) =>
            (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
            (!filters.role || u.role === filters.role) &&
            (!filters.status || u.status === filters.status)
          )
          .sort((a, b) => {
            const va = (a[sort] || '').toString();
            const vb = (b[sort] || '').toString();
            return dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
          });
        const visibleColCount = COLS.filter((c) => visibleCols.has(c.key)).length;
        return (
          <>
            <TableToolbar
              search={search} onSearch={setSearch}
              onRefresh={load}
              sortOptions={SORT_OPTIONS} sort={sort} dir={dir}
              onSort={(col, d) => { setSort(col); setDir(d); }}
              filterGroups={FILTER_GROUPS} filters={filters} onFilter={handleFilter}
              columns={COLS} visibleCols={visibleCols} onColumnsToggle={toggleCol} onColumnsReset={resetCols}
              placeholder="Search by name or email…"
            />
            <div className="bg-[#111113] border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#18181B] border-b border-zinc-800">
                      {COLS.filter((c) => visibleCols.has(c.key)).map(({ key, label }) => (
                        <th key={key} onClick={() => { setSort(key); setDir((d) => sort === key && d === 'asc' ? 'desc' : 'asc'); }}
                          className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-300 transition-colors select-none">
                          {label}
                        </th>
                      ))}
                      {isSuperAdmin && <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {!users ? (
                      <tr><td colSpan={visibleColCount + 1} className="px-4 py-10 text-center text-sm text-zinc-600">Loading…</td></tr>
                    ) : filtered.length === 0 ? (
                      <tr><td colSpan={visibleColCount + 1} className="px-4 py-10 text-center text-sm text-zinc-600">No users found.</td></tr>
                    ) : (
                      filtered.map((u) => (
                        <tr key={u.id} className="hover:bg-zinc-800/30 transition-colors">
                          {visibleCols.has('name') && <td className="px-4 py-3 text-zinc-200 font-medium whitespace-nowrap">{u.name}</td>}
                          {visibleCols.has('email') && <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{u.email}</td>}
                          {visibleCols.has('role') && <td className="px-4 py-3 whitespace-nowrap"><RoleBadge role={u.role} /></td>}
                          {visibleCols.has('status') && <td className="px-4 py-3 whitespace-nowrap"><StatusDot status={u.status} /></td>}
                          {visibleCols.has('last_login') && <td className="px-4 py-3 text-zinc-500 font-mono text-xs whitespace-nowrap">{u.last_login ? new Date(u.last_login).toLocaleDateString() : '—'}</td>}
                          {visibleCols.has('created_at') && <td className="px-4 py-3 text-zinc-500 font-mono text-xs whitespace-nowrap">{new Date(u.created_at).toLocaleDateString()}</td>}
                          {isSuperAdmin && (
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => setModal(u)} className="p-1.5 rounded-lg text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all" title="Edit">
                                  <Icon icon="solar:pen-linear" width={15} />
                                </button>
                                <button onClick={() => handleDelete(u)} disabled={deleting === u.id || u.id === me?.id}
                                  className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all disabled:opacity-30"
                                  title={u.id === me?.id ? "Can't delete yourself" : 'Delete'}>
                                  <Icon icon="solar:trash-bin-minimalistic-linear" width={15} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}
