import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import Logo from '../components/Logo';
import { useAuth } from '../hooks/useAuth';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: 'solar:widget-2-linear' },
    ],
  },
  {
    label: 'Leads',
    items: [
      { to: '/admin/contacts', label: 'Contacts', icon: 'solar:users-group-two-rounded-linear' },
      { to: '/admin/newsletter', label: 'Newsletter', icon: 'solar:letter-linear' },
    ],
  },
  {
    label: 'Content',
    items: [
      { to: '/admin/services', label: 'Services', icon: 'solar:layers-linear' },
      { to: '/admin/testimonials', label: 'Testimonials', icon: 'solar:star-linear' },
      { to: '/admin/social-links', label: 'Social Links', icon: 'solar:share-linear' },
    ],
  },
  {
    label: 'Site',
    items: [
      { to: '/admin/about',        label: 'About Page',    icon: 'solar:document-text-linear' },
      { to: '/admin/branding',     label: 'Branding',      icon: 'solar:palette-bold-duotone' },
      { to: '/admin/contact-form', label: 'Contact Form',  icon: 'solar:chat-round-dots-linear' },
    ],
  },
  {
    label: 'Administration',
    roles: ['super_admin'],
    items: [
      { to: '/admin/users',       label: 'Users',       icon: 'solar:user-circle-linear' },
      { to: '/admin/permissions', label: 'Permissions', icon: 'solar:shield-keyhole-linear' },
    ],
  },
];

function NavItem({ to, label, icon, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          isActive
            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
            : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 border border-transparent'
        }`
      }
    >
      <Icon icon={icon} width={17} />
      {label}
    </NavLink>
  );
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const close = () => setSidebarOpen(false);

  const handleLogout = () => {
    logout();
    navigate('/sign-in', { replace: true });
  };

  const role = user?.role;
  const visibleGroups = NAV_GROUPS.filter(
    (g) => !g.roles || g.roles.includes(role)
  );

  const roleColors = {
    super_admin: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    admin: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    customer: 'bg-zinc-800 border-zinc-700 text-zinc-400',
  };

  const Sidebar = () => (
    <aside className="inset-y-0 left-0 w-60 bg-[#09090B] border-r border-zinc-800 flex flex-col h-screen">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-zinc-800 shrink-0">
        <Logo />
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {visibleGroups.map((group) => (
          <div key={group.label}>
            <p className="text-[9px] font-mono font-semibold text-zinc-600 uppercase tracking-widest px-3 mb-1.5">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem key={item.to} {...item} onClick={close} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User card */}
      <div className="px-3 pb-4 pt-3 border-t border-zinc-800 shrink-0 space-y-1">
        {user && (
          <div className="px-3 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 mb-2">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-7 h-7 rounded-full bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0">
                <Icon icon="solar:user-linear" width={14} className="text-indigo-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-zinc-100 font-medium truncate">{user.name}</p>
                <p className="text-[10px] text-zinc-500 font-mono truncate">{user.email}</p>
              </div>
            </div>
            <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider border ${roleColors[role] || roleColors.customer}`}>
              {role?.replace('_', ' ')}
            </span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-zinc-500 hover:text-rose-400 hover:bg-rose-500/5 transition-all"
        >
          <Icon icon="solar:logout-2-linear" width={16} />
          Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#09090B] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/60 md:hidden" onClick={close} />
      )}

      {/* Sidebar — desktop (static) */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Sidebar — mobile (fixed overlay) */}
      <div
        className={`fixed inset-y-0 left-0 z-30 md:hidden transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <Sidebar />
      </div>

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
