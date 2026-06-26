import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import Icon from './Icon';
import Logo from './Logo';
import { navLinks } from '../constants/site';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navClass = ({ isActive }) =>
    isActive
      ? 'text-zinc-100 transition-colors'
      : 'text-zinc-400 hover:text-zinc-100 transition-colors';

  return (
    <header className="fixed top-0 inset-x-0 z-50 glass-panel border-b border-zinc-800/60">
      <div className="max-w-7xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={navClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <Link
            to="/sign-in"
            className="hidden md:inline text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/#contact"
            className="hidden sm:inline-flex items-center bg-indigo-500 text-white rounded-full px-5 py-2.5 text-sm font-medium shadow-[0_0_20px_rgba(99,102,241,0.25)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:-translate-y-0.5 transition-all"
          >
            Start Project
          </Link>
          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="md:hidden text-zinc-300 hover:text-zinc-100 transition-colors"
            aria-label="Menu"
          >
            <Icon icon="solar:hamburger-menu-linear" width={26} />
          </button>
        </div>
      </div>
      {menuOpen ? (
        <div className="md:hidden border-t border-zinc-800/60 px-6 py-5 flex flex-col gap-4 text-sm font-medium bg-[#09090B]/95">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={navClass} onClick={() => setMenuOpen(false)}>
              {link.label}
            </NavLink>
          ))}
          <Link to="/sign-in" className="text-zinc-300 hover:text-zinc-100" onClick={() => setMenuOpen(false)}>
            Sign in
          </Link>
          <Link
            to="/#contact"
            className="inline-flex w-max items-center bg-indigo-500 text-white rounded-full px-5 py-2.5"
            onClick={() => setMenuOpen(false)}
          >
            Start Project
          </Link>
        </div>
      ) : null}
    </header>
  );
}
