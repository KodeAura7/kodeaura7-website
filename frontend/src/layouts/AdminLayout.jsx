import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import Logo from '../components/Logo';
import { useAuth } from '../hooks/useAuth';

const NAV = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: 'solar:widget-2-linear' },
  { to: '/admin/contacts', label: 'Contacts', icon: 'solar:users-group-two-rounded-linear' },
  { to: '/admin/newsletter', label: 'Newsletter', icon: 'solar:letter-linear' },
  { to: '/admin/testimonials', label: 'Testimonials', icon: 'solar:star-linear' },
  { to: '/admin/services', label: 'Services', icon: 'solar:layers-linear' },
  { to: '/admin/social-links', label: 'Social Links', icon: 'solar:share-linear' },
  { to: '/admin/about', label: 'About Page', icon: 'solar:document-text-linear' },
  { to: '/admin/branding', label: 'Branding', icon: 'solar:palette-bold-duotone' },
  { to: '/admin/users', label: 'Users', icon: 'solar:user-circle-linear' }
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/sign-in', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex">
      {/* Mobile overlay */}
      {sidebarOpen ? (
        <div
          className="fixed inset-0 z-20 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-[#09090B] border-r border-zinc-800 flex flex-col transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:z-auto`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-800 shrink-0">
          <Logo />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                }`
              }
            >
              <Icon icon={icon} width={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="px-3 pb-4 pt-2 border-t border-zinc-800 shrink-0">
          {user ? (
            <div className="px-3 py-2 mb-1">
              <p className="text-xs text-zinc-100 font-medium truncate">{user.name}</p>
              <p className="text-[10px] text-zinc-500 font-mono truncate">{user.email}</p>
              <span className="mt-1 inline-block bg-indigo-500/10 border border-indigo-500/20 rounded-full px-2 py-0.5 text-[9px] font-mono text-indigo-400 uppercase tracking-wider">
                {user.role.replace('_', ' ')}
              </span>
            </div>
          ) : null}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-rose-400 hover:bg-rose-500/5 transition-all"
          >
            <Icon icon="solar:logout-2-linear" width={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="md:hidden h-16 flex items-center gap-4 px-5 border-b border-zinc-800 bg-[#09090B] shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-zinc-400 hover:text-zinc-100 transition-colors"
            aria-label="Open menu"
          >
            <Icon icon="solar:hamburger-menu-linear" width={22} />
          </button>
          <Logo />
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
