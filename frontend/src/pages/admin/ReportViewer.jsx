/* global Blob */
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Icon from '../../components/Icon';
import { adminApi } from '../../services/adminApi';
import { useToast } from '../../contexts/ToastContext';
import ReportChart from '../../components/admin/reports/ReportChart';

const SOURCE_COLORS = {
  contacts: 'text-primary-400 bg-primary-500/10',
  newsletter: 'text-secondary-400 bg-secondary-500/10',
  services: 'text-success-400 bg-success-500/10',
  testimonials: 'text-warning-400 bg-warning-500/10',
  users: 'text-accent-400 bg-accent-500/10',
};

function fmt(value, type) {
  if (value === null || value === undefined) return '—';
  if (type === 'date' && typeof value === 'string') {
    return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
  if (type === 'boolean') return value ? 'Yes' : 'No';
  if (type === 'number') {
    const n = parseFloat(value);
    return isNaN(n) ? String(value) : Number.isInteger(n) ? n.toLocaleString() : n.toFixed(2);
  }
  return String(value);
}

function exportCsv(columns, rows, filename) {
  const header = columns.map((c) => c.label).join(',');
  const body = rows.map((r) => columns.map((c) => {
    const v = r[c.key] ?? '';
    return typeof v === 'string' && v.includes(',') ? `"${v}"` : v;
  }).join(',')).join('\n');
  const blob = new Blob([header + '\n' + body], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function ReportViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { error: toastError } = useToast();

  const [report, setReport] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('table');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.runReport(id);
      setReport(result.report);
      setData(result.data);
      if (result.report.config?.chart?.enabled !== false && result.data.type === 'summary') {
        setView('chart');
      }
    } catch (err) {
      toastError('Failed to run report', err.message);
    } finally {
      setLoading(false);
    }
  }, [id, toastError]);

  useEffect(() => { load(); }, [load]);

  if (loading || !report) {
    return (
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        <div className="flex flex-col items-center gap-3 py-20 text-zinc-700">
          <Icon icon="solar:loading-linear" width={28} className="animate-spin" />
          <span className="text-sm">Running report…</span>
        </div>
      </div>
    );
  }

  const cfg = report.config ?? {};
  const chartCfg = cfg.chart ?? {};
  const sourceColor = SOURCE_COLORS[cfg.source] ?? 'text-zinc-400 bg-zinc-800';

  const columns = data?.columns ?? [];
  const rows = data?.rows ?? [];
  const showChart = data?.type === 'summary' && chartCfg.enabled !== false;

  const groupKey = data?.groupBy === 'month' ? 'month' : (data?.groupBy ?? 'label');
  const numericKeys = columns.filter((c) => c.type === 'number').map((c) => c.key);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate('/admin/reports')}
            className="p-2 rounded-xl border border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-600 transition-all flex-shrink-0">
            <Icon icon="solar:arrow-left-linear" width={16} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-display font-semibold text-xl text-zinc-100 truncate">{report.name}</h1>
              <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${sourceColor}`}>
                {cfg.source}
              </span>
              <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-400 capitalize">
                {report.report_type}
              </span>
            </div>
            {report.description && (
              <p className="text-sm text-zinc-500 mt-1 truncate">{report.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={load}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 text-sm transition-all">
            <Icon icon="solar:refresh-linear" width={14} />
            Re-run
          </button>
          <button onClick={() => exportCsv(columns, rows, `${report.name}.csv`)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 text-sm transition-all">
            <Icon icon="solar:download-linear" width={14} />
            Export CSV
          </button>
          <Link to={`/admin/reports/${id}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-all shadow-lg shadow-primary-900/30">
            <Icon icon="solar:pen-linear" width={14} />
            Edit
          </Link>
        </div>
      </div>

      {/* Stats bar */}
      <div className="mb-5 flex items-center gap-4 text-xs text-zinc-600">
        <span className="flex items-center gap-1">
          <Icon icon="solar:database-linear" width={12} />
          {data?.total} rows
        </span>
        {report.run_count > 0 && (
          <span className="flex items-center gap-1">
            <Icon icon="solar:play-circle-linear" width={12} />
            Run {report.run_count}×
          </span>
        )}
        {report.last_run_at && (
          <span className="flex items-center gap-1">
            <Icon icon="solar:clock-circle-linear" width={12} />
            {new Date(report.last_run_at).toLocaleString()}
          </span>
        )}
      </div>

      {/* View toggle */}
      {showChart && (
        <div className="mb-4 flex rounded-xl border border-zinc-800 overflow-hidden w-fit">
          {['chart', 'table', 'both'].map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-2 text-xs font-medium transition-all capitalize flex items-center gap-1.5
                ${view === v ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'}`}>
              <Icon icon={v === 'chart' ? 'solar:chart-square-linear' : v === 'table' ? 'solar:table-linear' : 'solar:widget-6-linear'} width={13} />
              {v}
            </button>
          ))}
        </div>
      )}

      {/* Chart */}
      {showChart && (view === 'chart' || view === 'both') && (
        <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-5 mb-5">
          <ReportChart
            type={chartCfg.type ?? 'bar'}
            data={rows}
            xKey={groupKey}
            yKeys={numericKeys.length ? numericKeys : ['value']}
            height={360}
          />
        </div>
      )}

      {/* Table */}
      {(!showChart || view === 'table' || view === 'both') && (
        <div className="bg-[#111113] border border-zinc-800 rounded-2xl overflow-hidden">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-zinc-700">
              <Icon icon="solar:chart-square-linear" width={32} />
              <p className="text-sm text-zinc-500">No data matches this report.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#18181B] border-b border-zinc-800">
                    <th className="w-10 px-4 py-3 text-xs font-medium text-zinc-700 text-left">#</th>
                    {columns.map((c) => (
                      <th key={c.key} className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {rows.map((row, i) => (
                    <tr key={i} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="px-4 py-3 text-xs text-zinc-700 font-mono">{i + 1}</td>
                      {columns.map((c) => (
                        <td key={c.key} className={`px-4 py-3 whitespace-nowrap ${c.type === 'number' ? 'text-zinc-200 font-mono text-right' : 'text-zinc-400'}`}>
                          {fmt(row[c.key], c.type)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                {data?.type === 'summary' && numericKeys.length > 0 && (
                  <tfoot>
                    <tr className="bg-[#18181B] border-t border-zinc-800">
                      <td className="px-4 py-3" />
                      {columns.map((c) => (
                        <td key={c.key} className={`px-4 py-3 text-xs font-medium ${c.type === 'number' ? 'text-zinc-200 font-mono text-right' : 'text-zinc-600'}`}>
                          {c.type === 'number'
                            ? rows.reduce((s, r) => s + (parseFloat(r[c.key]) || 0), 0).toLocaleString(undefined, { maximumFractionDigits: 2 })
                            : c.key === columns[0]?.key ? `Total (${rows.length} groups)` : ''}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      )}

      <p className="mt-3 text-xs text-zinc-700 text-right">
        {data?.total} record{data?.total !== 1 ? 's' : ''}
        {cfg.limit && ` · limited to ${cfg.limit}`}
      </p>
    </div>
  );
}
