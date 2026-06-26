import AmbientBackground from '../components/AmbientBackground';
import Icon from '../components/Icon';
import { useAuth } from '../hooks/useAuth';

export default function Welcome() {
  const { user, logout } = useAuth();

  return (
    <div className="antialiased min-h-screen flex items-center justify-center relative overflow-hidden">
      <AmbientBackground compact />
      <div className="max-w-md w-full mx-auto px-6">
        <div className="fade-up relative bg-[#111113] rounded-3xl p-8 md:p-10 border border-zinc-800 shadow-2xl shadow-black/50 text-center">
          <div className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

          {/* Avatar */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)]">
              <span className="font-display font-semibold text-2xl text-white select-none">
                {user?.name?.[0]?.toUpperCase() ?? '?'}
              </span>
            </div>
          </div>

          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2">Welcome</p>
          <h1 className="font-display font-semibold text-3xl text-zinc-100 mb-1">
            {user?.name ?? '—'}
          </h1>
          <p className="text-sm text-zinc-500">{user?.email ?? ''}</p>

          <div className="mt-6 h-px bg-zinc-800" />

          <p className="mt-6 text-sm text-zinc-600">
            More features coming soon.
          </p>

          <button
            onClick={logout}
            className="mt-8 inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-rose-400 transition-colors"
          >
            <Icon icon="solar:logout-2-linear" width={14} /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
