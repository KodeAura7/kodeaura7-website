import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Icon from '../../components/Icon';
import { adminApi } from '../../services/adminApi';
import { useToast } from '../../contexts/ToastContext';
import ReportChart from '../../components/admin/reports/ReportChart';

const WIDGET_TYPES = [
  { value: 'kpi',   label: 'KPI Card',  icon: 'solar:chart-square-linear',  desc: 'Single metric with large number display' },
  { value: 'chart', label: 'Chart',     icon: 'solar:chart-2-linear',        desc: 'Bar, line, area, pie or donut chart' },
  { value: 'table', label: 'Table',     icon: 'solar:table-linear',          desc: 'Simple tabular breakdown' },
];

const CHART_TYPES = [
  { value: 'bar', label: 'Bar', icon: 'solar:chart-2-linear' },
  { value: 'line', label: 'Line', icon: 'solar:chart-linear' },
  { value: 'area', label: 'Area', icon: 'solar:chart-2-linear' },
  { value: 'pie', label: 'Pie', icon: 'solar:pie-chart-linear' },
  { value: 'donut', label: 'Donut', icon: 'solar:pie-chart-2-linear' },
];

const AGG_FNS = [
  { value: 'count', label: 'Count' },
  { value: 'avg', label: 'Average' },
  { value: 'sum', label: 'Sum' },
  { value: 'min', label: 'Min' },
  { value: 'max', label: 'Max' },
];

const WIDGET_COLORS = ['#6366F1','#06B6D4','#10B981','#F59E0B','#8B5CF6','#EC4899','#F97316','#EF4444'];

const WIDGET_ICONS = [
  'solar:users-group-two-rounded-linear',
  'solar:letter-linear',
  'solar:layers-linear',
  'solar:star-linear',
  'solar:chart-square-linear',
  'solar:dollar-linear',
  'solar:bolt-linear',
  'solar:inbox-linear',
];

const SIZE_OPTIONS = [
  { w: 1, label: '1 col (narrow)' },
  { w: 2, label: '2 cols (default)' },
  { w: 3, label: '3 cols (wide)' },
  { w: 4, label: '4 cols (full)' },
];

function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function defaultWidget(type = 'kpi') {
  return {
    id: uuid(), type,
    title: type === 'kpi' ? 'Total Records' : type === 'chart' ? 'New Chart' : 'Breakdown',
    w: type === 'kpi' ? 1 : 2, h: type === 'kpi' ? 1 : 2,
    config: {
      source: 'contacts',
      metric: { fn: 'count', field: '*' },
      groupBy: 'status',
      chartType: 'bar',
      filters: [],
      color: WIDGET_COLORS[0],
      icon: WIDGET_ICONS[0],
    },
  };
}

// ── Widget config panel ───────────────────────────────────────────────────────
function WidgetConfigPanel({ widget, sources, onChange, onClose }) {
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);

  const src = sources.find((s) => s.key === widget.config.source);
  const fields = src?.fields ?? [];
  const numFields = fields.filter((f) => f.type === 'number');

  const set = (patch) => onChange({ ...widget, ...patch });
  const setCfg = (patch) => onChange({ ...widget, config: { ...widget.config, ...patch } });
  const setMetric = (patch) => setCfg({ metric: { ...widget.config.metric, ...patch } });

  const fetchPreview = async () => {
    if (!widget.config.source) return;
    setPreviewing(true);
    try {
      const { data } = await adminApi.getWidgetData({ ...widget.config, type: widget.type });
      setPreview(data);
    } catch { setPreview(null); }
    finally { setPreviewing(false); }
  };

  useEffect(() => { fetchPreview(); }, [widget.config.source, widget.config.groupBy, widget.config.metric?.fn, widget.type]);

  return (
    <div className="w-80 flex-shrink-0 bg-[#0E0E10] border-l border-zinc-800 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-200">Configure Widget</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 transition-colors">
          <Icon icon="solar:close-square-linear" width={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">Title</label>
          <input value={widget.title} onChange={(e) => set({ title: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-[#18181B] border border-zinc-800 text-sm text-zinc-200 outline-none focus:border-indigo-500/60 transition-all" />
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-2">Type</label>
          <div className="flex gap-1.5">
            {WIDGET_TYPES.map((t) => (
              <button key={t.value} onClick={() => set({ type: t.value, w: t.value === 'kpi' ? 1 : 2, h: t.value === 'kpi' ? 1 : 2 })}
                className={`flex-1 flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center text-xs transition-all
                  ${widget.type === t.value ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300' : 'bg-[#111113] border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}>
                <Icon icon={t.icon} width={14} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Source */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">Data source</label>
          <select value={widget.config.source} onChange={(e) => setCfg({ source: e.target.value, groupBy: 'status' })}
            className="w-full px-3 py-2 rounded-xl bg-[#18181B] border border-zinc-800 text-sm text-zinc-300 outline-none transition-all focus:border-indigo-500/50">
            {sources.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>

        {/* Metric */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">Metric</label>
          <div className="flex gap-1.5">
            <select value={widget.config.metric?.fn ?? 'count'} onChange={(e) => setMetric({ fn: e.target.value })}
              className="flex-1 px-2.5 py-2 rounded-xl bg-[#18181B] border border-zinc-800 text-xs text-zinc-300 outline-none transition-all">
              {AGG_FNS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            {widget.config.metric?.fn !== 'count' && (
              <select value={widget.config.metric?.field ?? '*'} onChange={(e) => setMetric({ field: e.target.value })}
                className="flex-1 px-2.5 py-2 rounded-xl bg-[#18181B] border border-zinc-800 text-xs text-zinc-300 outline-none transition-all">
                <option value="*">All (*)</option>
                {numFields.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* Group by (chart/table) */}
        {widget.type !== 'kpi' && (
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Group by</label>
            <select value={widget.config.groupBy ?? ''} onChange={(e) => setCfg({ groupBy: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#18181B] border border-zinc-800 text-sm text-zinc-300 outline-none transition-all focus:border-indigo-500/50">
              <option value="">— Select field —</option>
              <option value="month">Month (time series)</option>
              {fields.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
          </div>
        )}

        {/* Chart type */}
        {widget.type === 'chart' && (
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-2">Chart type</label>
            <div className="flex flex-wrap gap-1.5">
              {CHART_TYPES.map((t) => (
                <button key={t.value} onClick={() => setCfg({ chartType: t.value })}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all
                    ${widget.config.chartType === t.value ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300' : 'bg-[#111113] border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Size */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1.5">Width</label>
          <select value={widget.w ?? 2} onChange={(e) => set({ w: parseInt(e.target.value) })}
            className="w-full px-3 py-2 rounded-xl bg-[#18181B] border border-zinc-800 text-sm text-zinc-300 outline-none transition-all focus:border-indigo-500/50">
            {SIZE_OPTIONS.map((s) => <option key={s.w} value={s.w}>{s.label}</option>)}
          </select>
        </div>

        {/* Color */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-2">Color</label>
          <div className="flex flex-wrap gap-2">
            {WIDGET_COLORS.map((c) => (
              <button key={c} onClick={() => setCfg({ color: c })}
                className={`w-7 h-7 rounded-lg transition-all ${widget.config.color === c ? 'ring-2 ring-white/30 ring-offset-2 ring-offset-[#0E0E10]' : ''}`}
                style={{ background: c }} />
            ))}
          </div>
        </div>

        {/* KPI icon */}
        {widget.type === 'kpi' && (
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-2">Icon</label>
            <div className="flex flex-wrap gap-2">
              {WIDGET_ICONS.map((ic) => (
                <button key={ic} onClick={() => setCfg({ icon: ic })}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all
                    ${widget.config.icon === ic ? 'bg-indigo-500/20 border border-indigo-500/50' : 'bg-[#111113] border border-zinc-800 hover:border-zinc-600'}`}>
                  <Icon icon={ic} width={14} className={widget.config.icon === ic ? 'text-indigo-400' : 'text-zinc-500'} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Preview */}
        {preview && widget.type !== 'kpi' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-zinc-500">Preview</label>
              <button onClick={fetchPreview} disabled={previewing} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                <Icon icon={previewing ? 'solar:loading-linear' : 'solar:refresh-linear'} width={11} className={previewing ? 'animate-spin' : ''} />
              </button>
            </div>
            <div className="bg-[#111113] border border-zinc-800 rounded-xl p-3">
              <ReportChart
                type={widget.config.chartType ?? 'bar'}
                data={preview.rows ?? []}
                xKey={widget.config.groupBy === 'month' ? 'month' : (widget.config.groupBy ?? 'label')}
                yKeys={['value']}
                colors={[widget.config.color ?? '#6366F1']}
                height={140}
              />
            </div>
          </div>
        )}

        {preview && widget.type === 'kpi' && (
          <div className="bg-[#111113] border border-zinc-800 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${widget.config.color}25` }}>
              <Icon icon={widget.config.icon ?? 'solar:chart-square-linear'} width={16} style={{ color: widget.config.color }} />
            </div>
            <div>
              <p className="text-xs text-zinc-500">{widget.title}</p>
              <p className="text-xl font-bold text-zinc-100">{preview?.value?.toLocaleString() ?? '—'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Canvas widget card ────────────────────────────────────────────────────────
function CanvasWidget({ widget, selected, onSelect, onRemove }) {
  const W_COLS = { 1: 'col-span-1', 2: 'col-span-2', 3: 'col-span-3', 4: 'col-span-4' };
  const bgColor = widget.type === 'kpi' ? `${widget.config?.color ?? '#6366F1'}12` : 'transparent';

  return (
    <div className={`${W_COLS[Math.min(widget.w ?? 2, 4)]} rounded-2xl border-2 transition-all cursor-pointer
      ${selected ? 'border-indigo-500 shadow-lg shadow-indigo-500/20' : 'border-zinc-800 hover:border-zinc-700'}`}
      style={{ background: bgColor, minHeight: widget.type === 'kpi' ? 80 : 180 }}
      onClick={() => onSelect(widget.id)}>
      <div className="p-3 h-full flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon icon={WIDGET_TYPES.find((t) => t.value === widget.type)?.icon ?? 'solar:widget-linear'} width={13}
              className="text-zinc-500" />
            <span className="text-xs font-medium text-zinc-400 truncate max-w-[120px]">{widget.title}</span>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onRemove(widget.id); }}
            className="p-1 rounded-lg text-zinc-700 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
            <Icon icon="solar:close-square-linear" width={13} />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-700 gap-1">
          <Icon icon={WIDGET_TYPES.find((t) => t.value === widget.type)?.icon ?? 'solar:widget-linear'} width={20} />
          <span className="text-xs capitalize">{widget.type} · {widget.config?.source}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main builder ──────────────────────────────────────────────────────────────
export default function DashboardBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const isEdit = !!id;

  const [sources, setSources]     = useState([]);
  const [widgets, setWidgets]     = useState([]);
  const [meta, setMeta]           = useState({ name: '', description: '', isDefault: false });
  const [selectedId, setSelectedId] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [saving, setSaving]       = useState(false);

  const selectedWidget = widgets.find((w) => w.id === selectedId);

  useEffect(() => {
    adminApi.getReportSources().then(({ sources: s }) => setSources(s));
    if (isEdit) {
      adminApi.getDashboard(id).then(({ dashboard }) => {
        setMeta({ name: dashboard.name, description: dashboard.description ?? '', isDefault: dashboard.is_default });
        setWidgets(dashboard.widgets ?? []);
      }).catch((err) => toastError('Failed to load', err.message));
    }
  }, [id]);

  const addWidget = (type) => {
    const w = defaultWidget(type);
    setWidgets((prev) => [...prev, w]);
    setSelectedId(w.id);
    setShowAddMenu(false);
  };

  const removeWidget = (wid) => {
    setWidgets((prev) => prev.filter((w) => w.id !== wid));
    if (selectedId === wid) setSelectedId(null);
  };

  const updateWidget = (updated) => {
    setWidgets((prev) => prev.map((w) => w.id === updated.id ? updated : w));
  };

  const handleSave = async () => {
    if (!meta.name?.trim()) return toastError('Name required', 'Please enter a dashboard name.');
    setSaving(true);
    try {
      const payload = { name: meta.name.trim(), description: meta.description || null, widgets, isDefault: meta.isDefault };
      if (isEdit) {
        await adminApi.updateDashboard(id, payload);
        success('Saved', 'Dashboard updated.');
        navigate('/admin/dashboards');
      } else {
        await adminApi.createDashboard(payload);
        success('Created', 'Dashboard saved.');
        navigate('/admin/dashboards');
      }
    } catch (err) { toastError('Save failed', err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0A0A0B]">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-[#111113] flex-shrink-0 z-10">
        <button onClick={() => navigate('/admin/dashboards')}
          className="p-2 rounded-xl border border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-600 transition-all">
          <Icon icon="solar:arrow-left-linear" width={15} />
        </button>

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <input value={meta.name} onChange={(e) => setMeta((m) => ({ ...m, name: e.target.value }))}
            placeholder="Dashboard name…"
            className="px-3 py-1.5 rounded-xl bg-[#18181B] border border-zinc-800 focus:border-indigo-500/60 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-all w-64" />
          <input value={meta.description} onChange={(e) => setMeta((m) => ({ ...m, description: e.target.value }))}
            placeholder="Description (optional)"
            className="px-3 py-1.5 rounded-xl bg-[#18181B] border border-zinc-800 focus:border-indigo-500/60 text-sm text-zinc-500 placeholder-zinc-600 outline-none transition-all flex-1 hidden md:block" />
          <label className="hidden md:flex items-center gap-2 cursor-pointer text-xs text-zinc-400">
            <div onClick={() => setMeta((m) => ({ ...m, isDefault: !m.isDefault }))}
              className={`relative w-8 h-4 rounded-full transition-all ${meta.isDefault ? 'bg-indigo-600' : 'bg-zinc-700'}`}>
              <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${meta.isDefault ? 'translate-x-4' : ''}`} />
            </div>
            Default
          </label>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <button onClick={() => setShowAddMenu((v) => !v)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-700 text-zinc-300 hover:text-zinc-100 hover:border-zinc-500 text-sm font-medium transition-all">
              <Icon icon="solar:add-square-linear" width={15} />
              Add Widget
            </button>
            {showAddMenu && (
              <div className="absolute top-full right-0 mt-1.5 bg-[#18181B] border border-zinc-800 rounded-xl shadow-xl z-20 w-52 overflow-hidden">
                {WIDGET_TYPES.map((t) => (
                  <button key={t.value} onClick={() => addWidget(t.value)}
                    className="w-full flex items-start gap-3 px-3 py-3 hover:bg-zinc-800/60 transition-colors text-left">
                    <Icon icon={t.icon} width={15} className="text-zinc-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-zinc-200">{t.label}</p>
                      <p className="text-xs text-zinc-600">{t.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={handleSave} disabled={saving || !meta.name.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all disabled:opacity-40 shadow-lg shadow-indigo-900/30">
            <Icon icon={saving ? 'solar:loading-linear' : 'solar:check-circle-linear'} width={15} className={saving ? 'animate-spin' : ''} />
            {saving ? 'Saving…' : (isEdit ? 'Update' : 'Create')}
          </button>
        </div>
      </div>

      {/* Canvas + config panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 overflow-auto p-6" onClick={() => setSelectedId(null)}>
          {widgets.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20 text-zinc-700 border-2 border-dashed border-zinc-800 rounded-3xl">
              <Icon icon="solar:widget-linear" width={40} />
              <div className="text-center">
                <p className="text-sm font-medium text-zinc-500">Canvas is empty</p>
                <p className="text-xs text-zinc-600 mt-1">Click "Add Widget" to get started</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4 auto-rows-[minmax(120px,auto)]"
              onClick={(e) => { if (e.target === e.currentTarget) setSelectedId(null); }}>
              {widgets.map((w) => (
                <CanvasWidget key={w.id} widget={w}
                  selected={selectedId === w.id}
                  onSelect={setSelectedId}
                  onRemove={removeWidget} />
              ))}
            </div>
          )}
        </div>

        {/* Config panel */}
        {selectedWidget && (
          <WidgetConfigPanel
            widget={selectedWidget}
            sources={sources}
            onChange={updateWidget}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
    </div>
  );
}
