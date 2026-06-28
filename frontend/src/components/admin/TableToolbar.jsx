import { useEffect, useRef, useState } from 'react';
import Icon from '../Icon';

// ─── Popover primitive ────────────────────────────────────────────────────────

function Popover({ trigger, children, align = 'left' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      {trigger(open, () => setOpen((v) => !v))}
      {open && (
        <div className={`absolute z-30 top-full mt-1.5 min-w-[180px] bg-[#18181B] border border-zinc-700 rounded-xl shadow-2xl shadow-black/40 overflow-hidden
          ${align === 'right' ? 'right-0' : 'left-0'}`}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

// ─── Shared button style ──────────────────────────────────────────────────────

const btnCls = (active = false) =>
  `inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
    active
      ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70 border border-transparent'
  }`;

// ─── Filter popover ───────────────────────────────────────────────────────────

function FilterPopover({ filterGroups, filters, onFilter }) {
  const activeCount = Object.values(filters).filter(Boolean).length;
  return (
    <Popover
      trigger={(open, toggle) => (
        <button onClick={toggle} className={btnCls(open || activeCount > 0)}>
          <Icon icon="solar:filter-linear" width={13} />
          Filter
          {activeCount > 0 && (
            <span className="ml-0.5 bg-indigo-500 text-white rounded-full px-1.5 py-px text-[9px] leading-none">
              {activeCount}
            </span>
          )}
        </button>
      )}
    >
      {(close) => (
        <div className="p-3 space-y-4 w-56">
          {filterGroups.map((group) => (
            <div key={group.key}>
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mb-2">{group.label}</p>
              <div className="space-y-0.5">
                <button
                  onClick={() => { onFilter(group.key, ''); close(); }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${!filters[group.key] ? 'bg-zinc-700/50 text-zinc-200' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800'}`}
                >
                  All
                </button>
                {group.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { onFilter(group.key, opt.value); close(); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                      filters[group.key] === opt.value ? 'bg-indigo-500/15 text-indigo-300' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                  >
                    {opt.label}
                    {filters[group.key] === opt.value && <Icon icon="solar:check-read-linear" width={11} />}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {activeCount > 0 && (
            <button
              onClick={() => { filterGroups.forEach((g) => onFilter(g.key, '')); close(); }}
              className="w-full text-center text-[10px] text-zinc-600 hover:text-rose-400 transition-colors pt-1 border-t border-zinc-800"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </Popover>
  );
}

// ─── Sort popover ─────────────────────────────────────────────────────────────

function SortPopover({ sortOptions, sort, dir, onSort }) {
  return (
    <Popover
      trigger={(open, toggle) => (
        <button onClick={toggle} className={btnCls(open)}>
          <Icon icon="solar:sort-linear" width={13} />
          Sort
        </button>
      )}
    >
      {(close) => (
        <div className="p-2 w-48">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onSort(opt.value, sort === opt.value && dir === 'asc' ? 'desc' : 'asc');
                close();
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                sort === opt.value ? 'text-indigo-400 bg-indigo-500/10' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {opt.label}
              {sort === opt.value && (
                <Icon
                  icon={dir === 'asc' ? 'solar:sort-from-bottom-to-top-linear' : 'solar:sort-from-top-to-bottom-linear'}
                  width={11}
                  className="text-indigo-400"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </Popover>
  );
}

// ─── Columns popover ──────────────────────────────────────────────────────────

function ColumnsPopover({ columns, allOrdered, visibleCols, onToggle, onReset, onReorder }) {
  const [dragKey, setDragKey] = useState(null);
  const [dragOverKey, setDragOverKey] = useState(null);
  const displayCols = allOrdered || columns;
  const hiddenCount = displayCols.length - visibleCols.size;

  const handleDrop = (dropKey) => {
    if (dragKey && dragKey !== dropKey && onReorder) onReorder(dragKey, dropKey);
    setDragKey(null);
    setDragOverKey(null);
  };

  return (
    <Popover
      align="right"
      trigger={(open, toggle) => (
        <button onClick={toggle} className={btnCls(open || hiddenCount > 0)}>
          <Icon icon="solar:settings-linear" width={13} />
          Columns
          {hiddenCount > 0 && (
            <span className="ml-0.5 bg-zinc-700 text-zinc-300 rounded-full px-1.5 py-px text-[9px] leading-none">
              {hiddenCount} hidden
            </span>
          )}
        </button>
      )}
    >
      {() => (
        <div className="p-2 w-52">
          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider px-2 py-1.5">
            {onReorder ? 'Drag to reorder · toggle to hide' : 'Visible columns'}
          </p>
          {displayCols.map((col) => {
            const active = visibleCols.has(col.key);
            const isDragOver = dragOverKey === col.key && dragKey !== col.key;
            return (
              <div
                key={col.key}
                draggable={!!onReorder}
                onDragStart={() => { setDragKey(col.key); setDragOverKey(null); }}
                onDragOver={(e) => { e.preventDefault(); setDragOverKey(col.key); }}
                onDragLeave={() => setDragOverKey(null)}
                onDrop={() => handleDrop(col.key)}
                onDragEnd={() => { setDragKey(null); setDragOverKey(null); }}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors select-none
                  ${isDragOver ? 'bg-indigo-500/10 border border-indigo-500/30' : 'border border-transparent'}
                  ${dragKey === col.key ? 'opacity-40' : ''}`}
              >
                {onReorder && (
                  <span className="text-zinc-700 hover:text-zinc-500 cursor-grab active:cursor-grabbing shrink-0">
                    <Icon icon="solar:hamburger-menu-linear" width={12} />
                  </span>
                )}
                <button
                  onClick={() => onToggle(col.key)}
                  className={`flex items-center gap-2 flex-1 text-left text-xs transition-colors ${active ? 'text-zinc-200' : 'text-zinc-600'} hover:text-zinc-300`}
                >
                  <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${active ? 'border-indigo-500 bg-indigo-500' : 'border-zinc-600'}`}>
                    {active && <Icon icon="solar:check-read-linear" width={8} className="text-white" />}
                  </div>
                  {col.label}
                </button>
              </div>
            );
          })}
          <div className="border-t border-zinc-800 mt-1.5 pt-1.5">
            <button
              onClick={onReset}
              className="w-full text-center text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors py-1"
            >
              Reset to defaults
            </button>
          </div>
        </div>
      )}
    </Popover>
  );
}

// ─── Main toolbar ─────────────────────────────────────────────────────────────

export function TableToolbar({
  search,
  onSearch,
  onRefresh,
  sortOptions,
  sort,
  dir,
  onSort,
  filterGroups,
  filters,
  onFilter,
  columns,
  allOrdered,
  visibleCols,
  onColumnsToggle,
  onColumnsReset,
  onColumnsReorder,
  placeholder = 'Search…',
  children,
}) {
  const hasFilter = filterGroups && filterGroups.length > 0;
  const hasSort = sortOptions && sortOptions.length > 0;
  const hasCols = columns && columns.length > 0;

  return (
    <div className="flex items-center gap-2 flex-wrap mb-4">
      {/* Search */}
      {onSearch !== undefined && (
        <div className="relative flex-1 min-w-[180px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
            <Icon icon="solar:magnifer-linear" width={14} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-[#111113] border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all"
          />
          {search && (
            <button
              onClick={() => onSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <Icon icon="solar:close-circle-linear" width={14} />
            </button>
          )}
        </div>
      )}

      {/* Toolbar actions */}
      <div className="flex items-center gap-1.5 ml-auto flex-wrap">
        {/* Filter */}
        {hasFilter && (
          <FilterPopover filterGroups={filterGroups} filters={filters} onFilter={onFilter} />
        )}

        {/* Sort */}
        {hasSort && (
          <SortPopover sortOptions={sortOptions} sort={sort} dir={dir} onSort={onSort} />
        )}

        {/* Columns */}
        {hasCols && (
          <ColumnsPopover
            columns={columns}
            allOrdered={allOrdered}
            visibleCols={visibleCols}
            onToggle={onColumnsToggle}
            onReset={onColumnsReset}
            onReorder={onColumnsReorder}
          />
        )}

        {/* Extra actions (e.g. export buttons passed by parent) */}
        {children}

        {/* Refresh */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Refresh"
            className={btnCls()}
          >
            <Icon icon="solar:refresh-linear" width={14} />
          </button>
        )}
      </div>
    </div>
  );
}
