import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import Logo from '../components/Logo';
import { useAuth } from '../hooks/useAuth';
import { PermissionsProvider, usePermissions } from '../contexts/PermissionsContext';

// Each nav item can carry a `permission` key. If set, the item is hidden when
// the user doesn't have that permission. Role-gated groups use `roles`.
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
      { to: '/admin/contacts',   label: 'Contacts',   icon: 'solar:users-group-two-rounded-linear', permission: 'contacts.view' },
      { to: '/admin/newsletter', label: 'Newsletter', icon: 'solar:letter-linear',                  permission: 'newsletter.view' },
    ],
  },
  {
    label: 'Content',
    items: [
      { to: '/admin/services',     label: 'Services',     icon: 'solar:layers-linear',      permission: 'services.view' },
      { to: '/admin/testimonials', label: 'Testimonials', icon: 'solar:star-linear',         permission: 'testimonials.view' },
      { to: '/admin/social-links', label: 'Social Links', icon: 'solar:share-linear',        permission: 'social_links.view' },
    ],
  },
  {
    label: 'Site',
    items: [
      { to: '/admin/about',        label: 'About Page',   icon: 'solar:document-text-linear',    permission: 'about.edit' },
      { to: '/admin/branding',     label: 'Branding',     icon: 'solar:palette-bold-duotone',    permission: 'branding.edit' },
      { to: '/admin/contact-form', label: 'Contact Form', icon: 'solar:chat-round-dots-linear',  permission: 'contact_form.edit' },
    ],
  },
  {
    label: 'Administration',
    roles: ['super_admin'],
    items: [
      { to: '/admin/users',       label: 'Users',       icon: 'solar:user-circle-linear' },
      { to: '/admin/permissions', label: 'Permissions', icon: 'solar:shield-keyhole-linear' },
      { to: '/admin/audit-log',   label: 'Audit Log',   icon: 'solar:file-text-linear' },
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

const ROLE_COLORS = {
  super_admin: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  admin:       'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
  customer:    'bg-zinc-800 border-zinc-700 text-zinc-400',
};

function SidebarContent({ close }) {
  const { user, logout } = useAuth();
  const { canDo, isSuperAdmin } = usePermissions();
  const navigate = useNavigate();
  const role = user?.role;

  const handleLogout = () => { logout(); navigate('/sign-in', { replace: true }); };

  const visibleGroups = NAV_GROUPS
    .filter((g) => !g.roles || g.roles.includes(role))
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => {
        // Super admin always sees all items in their role-gated groups
        if (!item.permission || isSuperAdmin) return true;
        return canDo(item.permission);
      }),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <aside className="inset-y-0 left-0 w-60 bg-[#09090B] border-r border-zinc-800 flex flex-col h-screen">
      <div className="h-16 flex items-center px-5 border-b border-zinc-800 shrink-0">
        <Logo />
      </div>

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
            <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider border ${ROLE_COLORS[role] || ROLE_COLORS.customer}`}>
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
}

function AdminLayoutInner() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const close = () => setSidebarOpen(false);

  return (
    <div className="h-screen bg-[#09090B] flex overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/60 md:hidden" onClick={close} />
      )}

      {/* Sidebar — desktop */}
      <div className="hidden md:flex">
        <SidebarContent close={close} />
      </div>

      {/* Sidebar — mobile */}
      <div className={`fixed inset-y-0 left-0 z-30 md:hidden transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent close={close} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
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

export default function AdminLayout() {
  return (
    <PermissionsProvider>
      <AdminLayoutInner />
    </PermissionsProvider>
  );
}
