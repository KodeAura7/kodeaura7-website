import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/Icon';
import { adminApi } from '../../services/adminApi';

function StatCard({ icon, label, value, color = 'indigo', loading = false }) {
  const colors = {
    indigo: 'bg-primary-500/10 text-primary-400',
    cyan:   'bg-secondary-500/10 text-secondary-400',
    emerald:'bg-success-500/10 text-success-400',
  };
  return (
    <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-6 flex items-center gap-5">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
        <Icon icon={icon} width={22} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-1">{label}</p>
        {loading ? (
          <div className="h-7 w-16 rounded-lg bg-zinc-800 animate-pulse" />
        ) : (
          <p className="font-display font-semibold text-2xl text-zinc-100">{value ?? '—'}</p>
        )}
      </div>
    </div>
  );
}

function RelativeTime({ date }) {
  const d = new Date(date);
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60) return <span>{diff}s ago</span>;
  if (diff < 3600) return <span>{Math.floor(diff / 60)}m ago</span>;
  if (diff < 86400) return <span>{Math.floor(diff / 3600)}h ago</span>;
  return <span>{d.toLocaleDateString()}</span>;
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi
      .dashboard()
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-semibold text-2xl text-zinc-100">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">Overview of your site activity.</p>
      </div>

      {error ? (
        <div className="bg-error-500/10 border border-error-500/20 rounded-2xl p-4 text-sm text-error-400 mb-6">
          {error}
        </div>
      ) : null}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon="solar:users-group-two-rounded-linear" label="Total Contacts"       value={data?.totals.contacts}   color="indigo"  loading={!data} />
        <StatCard icon="solar:letter-linear"                  label="Newsletter Subscribers" value={data?.totals.subscribers} color="cyan"    loading={!data} />
        <StatCard icon="solar:user-circle-linear"             label="Admin Users"           value={data?.totals.users}      color="emerald" loading={!data} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Contacts */}
        <div className="bg-[#111113] border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="font-display font-semibold text-sm text-zinc-100">Latest Contacts</h2>
            <Link to="/admin/contacts" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">View all</Link>
          </div>
          {!data ? (
            <div className="px-5 py-8 flex items-center justify-center gap-2 text-zinc-700">
              <Icon icon="solar:loading-linear" width={16} className="animate-spin" />
              <span className="text-sm">Loading…</span>
            </div>
          ) : data.latestContacts.length === 0 ? (
            <div className="px-5 py-10 flex flex-col items-center gap-2 text-zinc-700">
              <Icon icon="solar:users-group-two-rounded-linear" width={28} />
              <p className="text-sm">No contacts yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-800/60">
              {data.latestContacts.map((c) => (
                <li key={c.id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-zinc-200 font-medium truncate">{c.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{c.email} · {c.service}</p>
                  </div>
                  <span className="text-xs text-zinc-600 shrink-0 font-mono">
                    <RelativeTime date={c.created_at} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Latest Subscribers */}
        <div className="bg-[#111113] border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="font-display font-semibold text-sm text-zinc-100">Latest Subscribers</h2>
            <Link to="/admin/newsletter" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">View all</Link>
          </div>
          {!data ? (
            <div className="px-5 py-8 flex items-center justify-center gap-2 text-zinc-700">
              <Icon icon="solar:loading-linear" width={16} className="animate-spin" />
              <span className="text-sm">Loading…</span>
            </div>
          ) : data.latestSubscribers.length === 0 ? (
            <div className="px-5 py-10 flex flex-col items-center gap-2 text-zinc-700">
              <Icon icon="solar:letter-linear" width={28} />
              <p className="text-sm">No subscribers yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-800/60">
              {data.latestSubscribers.map((s) => (
                <li key={s.id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <p className="text-sm text-zinc-200 truncate">{s.email}</p>
                  <span className="text-xs text-zinc-600 shrink-0 font-mono">
                    <RelativeTime date={s.subscribed_at} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
