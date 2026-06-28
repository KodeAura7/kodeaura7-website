import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Icon from '../../components/Icon';
import { adminApi } from '../../services/adminApi';
import { useToast } from '../../contexts/ToastContext';
import ReportChart from '../../components/admin/reports/ReportChart';

// ── Widget data hook ──────────────────────────────────────────────────────────
function useWidgetData(widget) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!widget?.config?.source) { setLoading(false); return; }
    setLoading(true); setError(null);
    adminApi.getWidgetData({ ...widget.config, type: widget.type })
      .then(({ data: d }) => { setData(d); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [widget?.id, widget?.config]);

  return { data, loading, error };
}

// ── KPI Widget ────────────────────────────────────────────────────────────────
function KPIWidget({ widget }) {
  const { data, loading, error } = useWidgetData(widget);
  const { title, config } = widget;
  const color = config?.color ?? '#6366F1';
  const icon  = config?.icon  ?? 'solar:chart-square-linear';

  const formatValue = (v) => {
    if (v == null) return '—';
    if (config?.metric?.fn === 'avg') return parseFloat(v).toFixed(1);
    if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
    if (v >= 1000) return (v / 1000).toFixed(1) + 'K';
    return v.toLocaleString();
  };

  return (
    <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-5 h-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400 font-medium">{title}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon icon={icon} width={16} style={{ color }} />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-20 rounded-lg bg-zinc-800 animate-pulse" />
      ) : error ? (
        <p className="text-xs text-rose-400">{error}</p>
      ) : (
        <p className="text-3xl font-display font-bold text-zinc-100">{formatValue(data?.value)}</p>
      )}
      <p className="text-xs text-zinc-600 mt-auto capitalize">{config?.source} · {config?.metric?.fn ?? 'count'}</p>
    </div>
  );
}

// ── Chart Widget ──────────────────────────────────────────────────────────────
function ChartWidget({ widget }) {
  const { data, loading, error } = useWidgetData(widget);
  const { title, config } = widget;
  const color = config?.color ?? '#6366F1';
  const chartType = config?.chartType ?? 'bar';

  const rows = data?.rows ?? [];
  const numericKeys = data?.columns?.filter((c) => c.type === 'number').map((c) => c.key) ?? ['value'];
  const labelKey = config?.groupBy === 'month' ? 'month' : (config?.groupBy ?? 'label');

  return (
    <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-4 h-full flex flex-col">
      <p className="text-sm text-zinc-300 font-medium mb-3">{title}</p>
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Icon icon="solar:loading-linear" width={20} className="animate-spin text-zinc-700" />
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center text-xs text-rose-400">{error}</div>
      ) : rows.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-700 gap-2">
          <Icon icon="solar:chart-square-linear" width={24} />
          <span className="text-xs">No data</span>
        </div>
      ) : (
        <div className="flex-1">
          <ReportChart
            type={chartType}
            data={rows}
            xKey={labelKey}
            yKeys={numericKeys}
            colors={[color, '#06B6D4', '#10B981', '#F59E0B', '#8B5CF6']}
            height={180}
          />
        </div>
      )}
    </div>
  );
}

// ── Table Widget ──────────────────────────────────────────────────────────────
function TableWidget({ widget }) {
  const { data, loading, error } = useWidgetData(widget);
  const { title, config } = widget;

  const rows = data?.rows ?? [];
  const labelKey = config?.groupBy === 'month' ? 'month' : (config?.groupBy ?? 'label');

  return (
    <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-4 h-full flex flex-col">
      <p className="text-sm text-zinc-300 font-medium mb-3">{title}</p>
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Icon icon="solar:loading-linear" width={20} className="animate-spin text-zinc-700" />
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center text-xs text-rose-400">{error}</div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left pb-2 text-zinc-500 font-medium capitalize">{labelKey}</th>
                <th className="text-right pb-2 text-zinc-500 font-medium">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {rows.slice(0, 8).map((r, i) => (
                <tr key={i}>
                  <td className="py-1.5 text-zinc-400 capitalize">{String(r[labelKey] ?? '—')}</td>
                  <td className="py-1.5 text-right text-zinc-200 font-mono">{parseFloat(r.value ?? 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Widget dispatcher ─────────────────────────────────────────────────────────
function Widget({ widget }) {
  if (widget.type === 'kpi')   return <KPIWidget widget={widget} />;
  if (widget.type === 'chart') return <ChartWidget widget={widget} />;
  if (widget.type === 'table') return <TableWidget widget={widget} />;
  return null;
}

// ── Width classes by widget width (1-4 columns in a 4-col grid) ───────────────
const W_CLASSES = { 1: 'col-span-1', 2: 'col-span-2', 3: 'col-span-3', 4: 'col-span-4' };
const H_CLASSES = { 1: 'min-h-[120px]', 2: 'min-h-[260px]', 3: 'min-h-[380px]' };

// ── Dashboard viewer ──────────────────────────────────────────────────────────
function DashboardView({ dashboard, onRefresh }) {
  const widgets = dashboard.widgets ?? [];
  const kpis   = widgets.filter((w) => w.type === 'kpi');
  const charts  = widgets.filter((w) => w.type !== 'kpi');

  return (
    <div>
      {/* KPIs row */}
      {kpis.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {kpis.map((w) => <Widget key={w.id} widget={w} />)}
        </div>
      )}

      {/* Charts / tables grid */}
      {charts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {charts.map((w) => (
            <div key={w.id}
              className={`${W_CLASSES[Math.min(w.w ?? 2, 4)]} ${H_CLASSES[Math.min(w.h ?? 2, 3)]}`}>
              <Widget widget={w} />
            </div>
          ))}
        </div>
      )}

      {widgets.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-zinc-700 bg-[#111113] border border-zinc-800 rounded-2xl">
          <Icon icon="solar:widget-linear" width={36} />
          <p className="text-sm text-zinc-500">This dashboard has no widgets yet.</p>
          <Link to={`/admin/dashboards/${dashboard.id}/edit`}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
            Add widgets →
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Dashboard home / selector ─────────────────────────────────────────────────
function DashboardHome() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const [dashboards, setDashboards] = useState(null);
  const [activeDash, setActiveDash] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    Promise.all([adminApi.listDashboards(), adminApi.getDefaultDashboard()])
      .then(([lr, dr]) => {
        setDashboards(lr.dashboards);
        setActiveDash(dr.dashboard);
      })
      .catch(() => {
        adminApi.listDashboards()
          .then(({ dashboards: dl }) => { setDashboards(dl); if (dl[0]) setActiveDash(dl[0]); })
          .catch((err) => toastError('Failed to load dashboards', err.message));
      });
  }, []);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await adminApi.deleteDashboard(deleteConfirm.id);
      setDashboards((prev) => prev.filter((d) => d.id !== deleteConfirm.id));
      if (activeDash?.id === deleteConfirm.id) setActiveDash(dashboards?.find((d) => d.id !== deleteConfirm.id) ?? null);
      success('Deleted');
    } catch (err) { toastError('Delete failed', err.message); }
    setDeleteConfirm(null);
  };

  if (!dashboards) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-zinc-700">
        <Icon icon="solar:loading-linear" width={28} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display font-semibold text-2xl text-zinc-100">Dashboards</h1>
          <p className="text-sm text-zinc-500 mt-1">{dashboards.length} dashboard{dashboards.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/admin/dashboards/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-900/30">
          <Icon icon="solar:add-circle-linear" width={16} />
          New Dashboard
        </Link>
      </div>

      {/* Dashboard tabs */}
      {dashboards.length > 1 && (
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1">
          {dashboards.map((d) => (
            <button key={d.id} onClick={() => setActiveDash(d)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all
                ${activeDash?.id === d.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30' : 'bg-[#18181B] border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'}`}>
              <Icon icon={d.is_default ? 'solar:home-linear' : 'solar:widget-linear'} width={13} />
              {d.name}
              {d.is_default && <span className="text-xs opacity-60">· Default</span>}
            </button>
          ))}
        </div>
      )}

      {/* Active dashboard */}
      {activeDash ? (
        <div>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-lg text-zinc-200">{activeDash.name}</h2>
              {activeDash.description && <p className="text-sm text-zinc-500">{activeDash.description}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Link to={`/admin/dashboards/${activeDash.id}/edit`}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 text-sm transition-all">
                <Icon icon="solar:pen-linear" width={14} />
                Edit
              </Link>
              {!activeDash.is_default && (
                <button onClick={() => setDeleteConfirm(activeDash)}
                  className="p-2 rounded-xl border border-zinc-800 text-zinc-600 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10 transition-all">
                  <Icon icon="solar:trash-bin-minimalistic-linear" width={14} />
                </button>
              )}
            </div>
          </div>
          <DashboardView dashboard={activeDash} />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-20 text-zinc-700 bg-[#111113] border border-zinc-800 rounded-2xl">
          <Icon icon="solar:widget-linear" width={40} />
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-500">No dashboards yet</p>
            <Link to="/admin/dashboards/new"
              className="inline-flex items-center gap-1.5 mt-3 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              <Icon icon="solar:add-circle-linear" width={13} />
              Create your first dashboard
            </Link>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-semibold text-zinc-100 mb-2">Delete Dashboard</h3>
            <p className="text-sm text-zinc-400 mb-5">Delete <span className="text-zinc-200">"{deleteConfirm.name}"</span>?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 text-sm font-medium transition-all hover:border-zinc-600">
                Cancel
              </button>
              <button onClick={handleDelete}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium transition-all">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardHome;
