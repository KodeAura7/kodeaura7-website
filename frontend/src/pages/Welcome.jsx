import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AmbientBackground from '../components/AmbientBackground';
import ContactStatusBadge from '../components/ContactStatusBadge';
import Icon from '../components/Icon';
import Logo from '../components/Logo';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';

export default function Welcome() {
  const { user, logout } = useAuth();
  const [contacts, setContacts] = useState(null);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [contactsError, setContactsError] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api
      .myContacts()
      .then(setContacts)
      .catch((err) => setContactsError(err.message))
      .finally(() => setLoadingContacts(false));
  }, []);

  return (
    <div className="antialiased min-h-screen bg-[#09090B] flex flex-col relative overflow-hidden">
      <AmbientBackground compact />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-zinc-800/60 bg-[#09090B]/80 backdrop-blur-sm">
        <Logo />
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-white text-xs font-semibold select-none">
              {user?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <span className="text-sm text-zinc-300 font-medium">{user?.name}</span>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-rose-400 transition-colors border border-zinc-800 hover:border-rose-500/30 rounded-lg px-3 py-1.5"
          >
            <Icon icon="solar:logout-2-linear" width={14} />
            Sign out
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 relative z-10 px-6 py-10 max-w-3xl mx-auto w-full">
        {/* Profile card */}
        <div className="text-center mb-10 fade-up">
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.3)]">
              <span className="font-display font-semibold text-2xl text-white select-none">
                {user?.name?.[0]?.toUpperCase() ?? '?'}
              </span>
            </div>
          </div>
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono mb-1">Welcome back</p>
          <h1 className="font-display font-semibold text-3xl md:text-4xl text-zinc-100 mb-1.5">{user?.name}</h1>
          <p className="text-sm text-zinc-600">{user?.email}</p>

          <div className="mt-6">
            <Link
              to="/"
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors inline-flex items-center gap-1.5"
            >
              <Icon icon="solar:arrow-left-linear" width={12} />
              Back to site
            </Link>
          </div>
        </div>

        {/* My Contact Requests */}
        <div className="fade-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-lg text-zinc-100">My Contact Requests</h2>
            {contacts ? (
              <span className="text-xs font-mono text-zinc-600">{contacts.length} request{contacts.length !== 1 ? 's' : ''}</span>
            ) : null}
          </div>

          {contactsError ? (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-sm text-rose-400">{contactsError}</div>
          ) : loadingContacts ? (
            <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-6 text-center text-sm text-zinc-600">Loading…</div>
          ) : !contacts || contacts.length === 0 ? (
            <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-8 text-center">
              <Icon icon="solar:inbox-linear" width={28} className="text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-600">No contact requests yet.</p>
              <Link to="/" className="mt-3 inline-block text-xs text-indigo-500 hover:text-indigo-400 transition-colors">
                Go to contact form
              </Link>
            </div>
          ) : (
            <div className="bg-[#111113] border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#18181B] border-b border-zinc-800">
                      {['Service', 'Status', 'Submitted', 'Updated'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {contacts.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => setSelected(c)}
                        className="hover:bg-zinc-800/30 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3 text-zinc-200 whitespace-nowrap max-w-[160px] truncate">{c.service}</td>
                        <td className="px-4 py-3 whitespace-nowrap"><ContactStatusBadge status={c.status} /></td>
                        <td className="px-4 py-3 text-zinc-500 font-mono text-xs whitespace-nowrap">
                          {new Date(c.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-zinc-500 font-mono text-xs whitespace-nowrap">
                          {c.updated_at ? new Date(c.updated_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Icon icon="solar:eye-linear" width={14} className="text-zinc-600" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Read-only detail modal */}
      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-[#111113] border border-zinc-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="font-display font-semibold text-lg text-zinc-100">{selected.service}</h3>
                <div className="mt-1"><ContactStatusBadge status={selected.status} /></div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-zinc-500 hover:text-zinc-200 transition-colors"
              >
                <Icon icon="solar:close-circle-linear" width={20} />
              </button>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 text-zinc-500 font-mono text-xs uppercase tracking-wider pt-0.5">Message</dt>
                <dd className="text-zinc-300 whitespace-pre-wrap leading-relaxed">{selected.message}</dd>
              </div>
              <div className="flex gap-3 pt-1 border-t border-zinc-800">
                <dt className="w-20 shrink-0 text-zinc-500 font-mono text-xs uppercase tracking-wider pt-1">Submitted</dt>
                <dd className="text-zinc-400 font-mono text-xs pt-1">{new Date(selected.created_at).toLocaleString()}</dd>
              </div>
              {selected.updated_at ? (
                <div className="flex gap-3">
                  <dt className="w-20 shrink-0 text-zinc-500 font-mono text-xs uppercase tracking-wider pt-0.5">Updated</dt>
                  <dd className="text-zinc-400 font-mono text-xs">{new Date(selected.updated_at).toLocaleString()}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        </div>
      ) : null}
    </div>
  );
}
