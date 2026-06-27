import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import Icon from './Icon';
import Logo from './Logo';
import { useAuth } from '../hooks/useAuth';

const NAV = [
  { label: 'Home', to: '/' },
  { label: 'Services', to: '/services' },
  { label: 'Portfolio', to: '/portfolio' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/#contact' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  const close = () => setMenuOpen(false);

  const navClass = ({ isActive }) =>
    isActive
      ? 'text-zinc-100 transition-colors'
      : 'text-zinc-400 hover:text-zinc-100 transition-colors';

  const handleLogout = () => {
    logout();
    navigate('/');
    close();
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <header className="fixed top-0 inset-x-0 z-50 glass-panel border-b border-zinc-800/60">
      <div className="max-w-7xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between gap-6">
        <Logo />

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium flex-1">
          {NAV.map((link) =>
            link.to.includes('#') ? (
              <a key={link.to} href={link.to} className="text-zinc-400 hover:text-zinc-100 transition-colors">
                {link.label}
              </a>
            ) : (
              <NavLink key={link.to} to={link.to} end={link.to === '/'} className={navClass}>
                {link.label}
              </NavLink>
            )
          )}
        </nav>

        {/* Desktop auth + CTA */}
        <div className="hidden md:flex items-center gap-3">
          {!loading && (
            user ? (
              <>
                {isAdmin && (
                  <Link to="/admin/dashboard" className="text-xs font-mono text-indigo-400 hover:text-indigo-300 transition-colors px-2 py-1 rounded-lg border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10">
                    Admin
                  </Link>
                )}
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
                    <Icon icon="solar:user-linear" width={14} className="text-indigo-400" />
                  </div>
                  <span className="text-xs text-zinc-400 max-w-[130px] truncate" title={user.email}>{user.email}</span>
                </div>
                <button onClick={handleLogout} className="text-sm font-medium text-zinc-400 hover:text-rose-400 transition-colors">
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/sign-in" className="text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors">
                Sign in
              </Link>
            )
          )}
          <Link
            to="/#contact"
            className="inline-flex items-center bg-indigo-500 text-white rounded-full px-5 py-2.5 text-sm font-medium shadow-[0_0_20px_rgba(99,102,241,0.25)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:-translate-y-0.5 transition-all"
          >
            Start Project
          </Link>
        </div>

        {/* Mobile burger */}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="md:hidden text-zinc-300 hover:text-zinc-100 transition-colors"
          aria-label="Menu"
        >
          <Icon icon={menuOpen ? 'solar:close-square-linear' : 'solar:hamburger-menu-linear'} width={26} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-zinc-800/60 px-6 py-5 flex flex-col gap-4 text-sm font-medium bg-[#09090B]/95">
          {NAV.map((link) =>
            link.to.includes('#') ? (
              <a key={link.to} href={link.to} onClick={close} className="text-zinc-400 hover:text-zinc-100 transition-colors">
                {link.label}
              </a>
            ) : (
              <NavLink key={link.to} to={link.to} end={link.to === '/'} className={navClass} onClick={close}>
                {link.label}
              </NavLink>
            )
          )}
          <div className="h-px bg-zinc-800 my-1" />
          {!loading && (
            user ? (
              <>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Icon icon="solar:user-linear" width={14} />
                  <span className="truncate">{user.email}</span>
                </div>
                {isAdmin && (
                  <Link to="/admin/dashboard" onClick={close} className="text-indigo-400 font-medium">
                    Admin Panel
                  </Link>
                )}
                <button onClick={handleLogout} className="text-rose-400 font-medium text-left">
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/sign-in" onClick={close} className="text-zinc-300 hover:text-zinc-100">
                Sign in
              </Link>
            )
          )}
          <Link
            to="/#contact"
            onClick={close}
            className="inline-flex w-max items-center bg-indigo-500 text-white rounded-full px-5 py-2.5"
          >
            Start Project
          </Link>
        </div>
      )}
    </header>
  );
}
