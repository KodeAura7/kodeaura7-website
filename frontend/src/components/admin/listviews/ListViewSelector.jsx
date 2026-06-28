import { useEffect, useRef, useState } from 'react';
import Icon from '../../Icon';
import SaveListViewModal from './SaveListViewModal';

function ViewContextMenu({ view, onEdit, onDuplicate, onDelete, onSetDefault, onFavorite, onPin, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const item = (icon, label, onClick, danger = false, confirm = false) => (
    <button type="button" onClick={() => {
      if (confirm && !window.confirm(`Delete list view "${view.name}"? This cannot be undone.`)) { onClose(); return; }
      onClick(); onClose();
    }}
      className={`flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium rounded-lg text-left transition-all ${
        danger ? 'text-rose-400 hover:bg-rose-500/10' : 'text-zinc-300 hover:bg-zinc-800/60'
      }`}>
      <Icon icon={icon} width={13} />
      {label}
    </button>
  );

  return (
    <div ref={ref}
      className="absolute right-0 top-full mt-1 z-50 w-48 bg-[#111113] border border-zinc-800 rounded-xl shadow-2xl py-1.5 overflow-hidden"
      onClick={(e) => e.stopPropagation()}>
      {!view.is_system && item('solar:pen-linear', 'Edit', onEdit)}
      {item('solar:copy-linear', 'Duplicate', onDuplicate)}
      {item('solar:home-2-linear', 'Set as Default', onSetDefault)}
      {item(
        view.is_pinned ? 'solar:pin-bold' : 'solar:pin-linear',
        view.is_pinned ? 'Unpin' : 'Pin to top',
        onPin
      )}
      {!view.is_system && item('solar:star-linear', view.is_favorite ? 'Remove from Favorites' : 'Add to Favorites', onFavorite)}
      {!view.is_system && <div className="my-1.5 border-t border-zinc-800" />}
      {!view.is_system && item('solar:trash-bin-minimalistic-linear', 'Delete', onDelete, true, true)}
    </div>
  );
}

function ViewItem({ view, isActive, onSelect, onEdit, onDuplicate, onDelete, onSetDefault, onFavorite, onPin }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative group">
      <button type="button" onClick={() => onSelect(view.id)}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-all ${
          isActive
            ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
            : 'text-zinc-300 hover:bg-zinc-800/60 border border-transparent'
        }`}>
        {view.is_system ? (
          <Icon icon="solar:layers-minimalistic-linear" width={13} className={isActive ? 'text-indigo-400' : 'text-zinc-600'} />
        ) : (
          <Icon icon="solar:filter-linear" width={13} className={isActive ? 'text-indigo-400' : 'text-zinc-600'} />
        )}
        <span className="flex-1 truncate text-xs font-medium">{view.name}</span>
        {view.filters?.length > 0 && (
          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${
            isActive ? 'bg-indigo-500/30 text-indigo-300' : 'bg-zinc-800 text-zinc-500'
          }`}>
            {view.filters.length}
          </span>
        )}
        {view.is_pinned && (
          <Icon icon="solar:pin-bold" width={10} className="text-amber-400 shrink-0" />
        )}
        {view.is_favorite && !view.is_system && !view.is_pinned && (
          <Icon icon="solar:star-bold" width={11} className="text-amber-400 shrink-0" />
        )}
        <button type="button" onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
          className="shrink-0 opacity-0 group-hover:opacity-100 p-0.5 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700/50 transition-all">
          <Icon icon="solar:menu-dots-bold" width={12} />
        </button>
      </button>

      {menuOpen && (
        <ViewContextMenu
          view={view}
          onEdit={() => onEdit(view)}
          onDuplicate={() => onDuplicate(view.id)}
          onDelete={() => onDelete(view.id)}
          onSetDefault={() => onSetDefault(view.id)}
          onFavorite={() => onFavorite(view.id)}
          onPin={() => onPin(view.id)}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
}

export default function ListViewSelector({
  views,
  recentViews = [],
  activeId,
  fieldConfig,
  loading,
  onSelect,
  onCreate,
  onEdit,
  onDuplicate,
  onDelete,
  onSetDefault,
  onFavorite,
  onPin,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const dropdownRef = useRef(null);
  const activeView = views.find((v) => v.id === activeId);

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  const pinnedViews  = views.filter((v) => v.is_pinned);
  const systemViews  = views.filter((v) => v.is_system);
  const personalViews = views.filter((v) => !v.is_system);
  const favorites    = personalViews.filter((v) => v.is_favorite);
  const others       = personalViews.filter((v) => !v.is_favorite);
  // Recent: views accessed recently that aren't already pinned (to avoid duplication in dropdown)
  const recentNotPinned = recentViews.filter((rv) => !rv.is_pinned);

  const handleEdit = (view) => {
    setDropdownOpen(false);
    setModal({ mode: 'edit', data: view });
  };

  const handleCreate = async (data) => {
    await onCreate(data);
    setModal(null);
    setDropdownOpen(false);
  };

  const handleUpdate = async (data) => {
    await onEdit(modal.data.id, data);
    setModal(null);
  };

  const activeFilterCount = activeView?.filters?.length ?? 0;

  const sharedViewItemProps = (v) => ({
    view: v,
    isActive: v.id === activeId,
    onSelect: (id) => { onSelect(id); setDropdownOpen(false); },
    onEdit: handleEdit,
    onDuplicate: onDuplicate,
    onDelete: onDelete,
    onSetDefault: onSetDefault,
    onFavorite: onFavorite,
    onPin: onPin,
  });

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Pinned quick-access tabs */}
        {pinnedViews.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {pinnedViews.map((v) => (
              <button key={v.id} type="button" onClick={() => onSelect(v.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  v.id === activeId
                    ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                    : 'bg-[#18181B] border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:border-zinc-500'
                }`}>
                <Icon icon="solar:pin-bold" width={10} className="text-amber-400" />
                {v.name}
              </button>
            ))}
            <div className="w-px h-5 bg-zinc-800 mx-1" />
          </div>
        )}

        {/* Dropdown trigger */}
        <div ref={dropdownRef} className="relative">
          <button type="button" onClick={() => setDropdownOpen((o) => !o)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
              dropdownOpen
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                : 'bg-[#18181B] border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100'
            }`}>
            <Icon icon="solar:filter-bold-duotone" width={15} className="text-indigo-400" />
            <span className="max-w-[180px] truncate">
              {loading ? 'Loading…' : (activeView?.name ?? 'Select view')}
            </span>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-indigo-500/30 text-indigo-300 text-[9px] font-mono">
                {activeFilterCount}
              </span>
            )}
            <Icon icon={dropdownOpen ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'} width={13} className="text-zinc-500" />
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 top-full mt-1.5 z-40 w-64 bg-[#111113] border border-zinc-800 rounded-2xl shadow-2xl py-2 max-h-96 overflow-y-auto">
              {/* Recent views (non-pinned only) */}
              {recentNotPinned.length > 0 && (
                <div className="px-2 mb-1">
                  <p className="text-[9px] font-mono font-semibold text-zinc-600 uppercase tracking-widest px-2 mb-1">Recent</p>
                  {recentNotPinned.map((v) => (
                    <ViewItem key={`recent-${v.id}`} {...sharedViewItemProps(v)} />
                  ))}
                  <div className="border-t border-zinc-800/60 my-1.5" />
                </div>
              )}

              {/* System views */}
              {systemViews.length > 0 && (
                <div className="px-2 mb-1">
                  <p className="text-[9px] font-mono font-semibold text-zinc-600 uppercase tracking-widest px-2 mb-1">System</p>
                  {systemViews.map((v) => (
                    <ViewItem key={v.id} {...sharedViewItemProps(v)} />
                  ))}
                </div>
              )}

              {/* Favorites */}
              {favorites.length > 0 && (
                <div className="px-2 mb-1">
                  {systemViews.length > 0 && <div className="border-t border-zinc-800/60 my-1.5" />}
                  <p className="text-[9px] font-mono font-semibold text-zinc-600 uppercase tracking-widest px-2 mb-1">Favorites</p>
                  {favorites.map((v) => (
                    <ViewItem key={v.id} {...sharedViewItemProps(v)} />
                  ))}
                </div>
              )}

              {/* My views */}
              {others.length > 0 && (
                <div className="px-2 mb-1">
                  {(systemViews.length > 0 || favorites.length > 0) && <div className="border-t border-zinc-800/60 my-1.5" />}
                  <p className="text-[9px] font-mono font-semibold text-zinc-600 uppercase tracking-widest px-2 mb-1">My Views</p>
                  {others.map((v) => (
                    <ViewItem key={v.id} {...sharedViewItemProps(v)} />
                  ))}
                </div>
              )}

              {views.length === 0 && !loading && (
                <p className="px-4 py-3 text-xs text-zinc-600 text-center">No list views yet.</p>
              )}

              <div className="border-t border-zinc-800 mt-1.5 pt-1.5 px-2">
                <button type="button" onClick={() => { setDropdownOpen(false); setModal({ mode: 'create', data: null }); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-indigo-400 hover:bg-indigo-500/10 transition-all">
                  <Icon icon="solar:add-circle-linear" width={13} />
                  New List View
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick edit for active non-system view */}
        {activeView && !activeView.is_system && (
          <button type="button" onClick={() => setModal({ mode: 'edit', data: activeView })}
            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 border border-transparent transition-all" title="Edit list view">
            <Icon icon="solar:pen-linear" width={15} />
          </button>
        )}

        {/* Active filter pills */}
        {activeView && activeFilterCount > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {activeView.filters.slice(0, 3).map((f, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-300 font-mono">
                <Icon icon="solar:filter-linear" width={10} />
                {f.field_name.replace(/_/g, ' ')} {f.operator.replace(/_/g, ' ')} {f.value ? `"${f.value.slice(0, 15)}${f.value.length > 15 ? '…' : ''}"` : ''}
              </span>
            ))}
            {activeFilterCount > 3 && (
              <span className="text-[10px] text-zinc-600 font-mono">+{activeFilterCount - 3} more</span>
            )}
          </div>
        )}
      </div>

      {modal && (
        <SaveListViewModal
          mode={modal.mode}
          initialData={modal.data}
          fieldConfig={fieldConfig}
          onSave={modal.mode === 'create' ? handleCreate : handleUpdate}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
