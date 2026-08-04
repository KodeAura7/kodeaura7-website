import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Icon from '../../components/Icon';
import { adminApi } from '../../services/adminApi';
import { useToast } from '../../contexts/ToastContext';
import ReportChart from '../../components/admin/reports/ReportChart';

const STEPS = ['Source', 'Fields', 'Filters', 'Chart', 'Save'];

const SOURCE_ICONS = {
  contacts: { icon: 'solar:users-group-two-rounded-linear', color: 'text-primary-400', bg: 'bg-primary-500/15 border-primary-500/30' },
  newsletter: { icon: 'solar:letter-linear', color: 'text-secondary-400', bg: 'bg-secondary-500/15 border-secondary-500/30' },
  services: { icon: 'solar:layers-linear', color: 'text-success-400', bg: 'bg-success-500/15 border-success-500/30' },
  testimonials: { icon: 'solar:star-ring-linear', color: 'text-warning-400', bg: 'bg-warning-500/15 border-warning-500/30' },
  users: { icon: 'solar:user-id-linear', color: 'text-accent-400', bg: 'bg-accent-500/15 border-accent-500/30' },
};

const AGG_FNS = [
  { value: 'count', label: 'Count' },
  { value: 'count_distinct', label: 'Count Distinct' },
  { value: 'sum', label: 'Sum' },
  { value: 'avg', label: 'Average' },
  { value: 'min', label: 'Min' },
  { value: 'max', label: 'Max' },
];

const FILTER_OPS_BY_TYPE = {
  text:    [{ v:'eq',label:'='},{v:'neq',label:'≠'},{v:'like',label:'Contains'},{v:'is_null',label:'Is Empty'},{v:'is_not_null',label:'Is Not Empty'}],
  number:  [{ v:'eq',label:'='},{v:'neq',label:'≠'},{v:'gt',label:'>'},{v:'gte',label:'>='},{v:'lt',label:'<'},{v:'lte',label:'<='},{v:'is_null',label:'Is Empty'},{v:'is_not_null',label:'Is Not Empty'}],
  date:    [{ v:'gt',label:'After'},{v:'gte',label:'On or After'},{v:'lt',label:'Before'},{v:'lte',label:'On or Before'},{v:'is_null',label:'Is Empty'},{v:'is_not_null',label:'Is Not Empty'}],
  boolean: [{ v:'eq',label:'Is True'},{v:'neq',label:'Is False'}],
};

const CHART_TYPES = [
  { value: 'bar',   label: 'Bar',   icon: 'solar:chart-2-linear' },
  { value: 'line',  label: 'Line',  icon: 'solar:chart-linear' },
  { value: 'area',  label: 'Area',  icon: 'solar:chart-2-linear' },
  { value: 'pie',   label: 'Pie',   icon: 'solar:pie-chart-linear' },
  { value: 'donut', label: 'Donut', icon: 'solar:pie-chart-2-linear' },
];

const newFilter = () => ({ id: Date.now(), field: '', op: 'eq', value: '', logic: 'AND' });
const newAgg    = () => ({ id: Date.now(), fn: 'count', field: '*', alias: '' });

function StepIndicator({ step }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
            ${i === step ? 'bg-primary-600 text-white' : i < step ? 'text-success-400' : 'text-zinc-600'}`}>
            {i < step
              ? <Icon icon="solar:check-circle-linear" width={15} />
              : <span className="w-5 h-5 rounded-full border flex items-center justify-center text-xs
                  ${i === step ? 'border-transparent bg-white/20' : 'border-current'}">{i + 1}</span>}
            <span className="hidden sm:inline">{s}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-6 h-px mx-1 ${i < step ? 'bg-success-500/50' : 'bg-zinc-800'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Step 0 — choose source + type ─────────────────────────────────────────────
function StepSource({ sources, config, setConfig }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-zinc-200 mb-1">Choose a data source</h2>
      <p className="text-sm text-zinc-500 mb-5">Select the object you want to report on.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {sources.map((s) => {
          const meta = SOURCE_ICONS[s.key] ?? { icon: 'solar:database-linear', color: 'text-zinc-400', bg: 'bg-zinc-800 border-zinc-700' };
          const selected = config.source === s.key;
          return (
            <button key={s.key} onClick={() => setConfig((c) => ({ ...c, source: s.key, columns: [], groupBy: '', aggregations: [newAgg()], filters: [] }))}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all text-center
                ${selected ? `${meta.bg} border-current shadow-lg` : 'bg-[#111113] border-zinc-800 hover:border-zinc-700'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selected ? meta.bg : 'bg-zinc-800'}`}>
                <Icon icon={meta.icon} width={20} className={selected ? meta.color : 'text-zinc-500'} />
              </div>
              <span className={`text-sm font-medium ${selected ? meta.color : 'text-zinc-400'}`}>{s.label}</span>
            </button>
          );
        })}
      </div>

      <h2 className="text-base font-semibold text-zinc-200 mb-1">Report type</h2>
      <p className="text-sm text-zinc-500 mb-4">How should data be presented?</p>
      <div className="flex gap-3">
        {[
          { value: 'tabular', label: 'Tabular', icon: 'solar:table-linear', desc: 'Row-by-row list of records' },
          { value: 'summary', label: 'Summary', icon: 'solar:chart-square-linear', desc: 'Grouped with totals & charts' },
        ].map((t) => (
          <button key={t.value} onClick={() => setConfig((c) => ({ ...c, type: t.value }))}
            className={`flex-1 flex items-start gap-3 p-4 rounded-2xl border transition-all text-left
              ${config.type === t.value ? 'bg-primary-500/10 border-primary-500/40' : 'bg-[#111113] border-zinc-800 hover:border-zinc-700'}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
              ${config.type === t.value ? 'bg-primary-500/20' : 'bg-zinc-800'}`}>
              <Icon icon={t.icon} width={18} className={config.type === t.value ? 'text-primary-400' : 'text-zinc-500'} />
            </div>
            <div>
              <p className={`font-medium text-sm ${config.type === t.value ? 'text-primary-300' : 'text-zinc-300'}`}>{t.label}</p>
              <p className="text-xs text-zinc-600 mt-0.5">{t.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Step 1 — columns / group + aggregations ───────────────────────────────────
function StepFields({ sources, config, setConfig }) {
  const src = sources.find((s) => s.key === config.source);
  if (!src) return <p className="text-zinc-500">Select a source first.</p>;
  const fields = src.fields;

  if (config.type === 'tabular') {
    const toggle = (key) => setConfig((c) => {
      const cols = c.columns.includes(key) ? c.columns.filter((k) => k !== key) : [...c.columns, key];
      return { ...c, columns: cols };
    });
    const allSelected = fields.every((f) => config.columns.includes(f.key));
    const toggleAll = () => setConfig((c) => ({ ...c, columns: allSelected ? [] : fields.map((f) => f.key) }));

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-200">Select columns</h2>
            <p className="text-sm text-zinc-500 mt-0.5">Choose which fields appear in the report.</p>
          </div>
          <button onClick={toggleAll} className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {fields.map((f) => {
            const checked = config.columns.includes(f.key);
            return (
              <label key={f.key} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-all
                ${checked ? 'bg-primary-500/10 border-primary-500/30 text-primary-300' : 'bg-[#111113] border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}>
                <input type="checkbox" checked={checked} onChange={() => toggle(f.key)} className="accent-primary-500 w-3.5 h-3.5" />
                <span className="text-sm">{f.label}</span>
                <span className="ml-auto text-xs text-zinc-600">{f.type}</span>
              </label>
            );
          })}
        </div>

        <div className="mt-5">
          <label className="block text-xs font-medium text-zinc-400 mb-2">Sort by</label>
          <div className="flex gap-2">
            <select value={config.sort?.field ?? ''} onChange={(e) => setConfig((c) => ({ ...c, sort: { ...c.sort, field: e.target.value } }))}
              className="flex-1 px-3 py-2 rounded-xl bg-[#18181B] border border-zinc-800 text-sm text-zinc-300 outline-none focus:border-primary-500/50 transition-all">
              <option value="">— None —</option>
              {fields.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
            <select value={config.sort?.dir ?? 'desc'} onChange={(e) => setConfig((c) => ({ ...c, sort: { ...c.sort, dir: e.target.value } }))}
              className="px-3 py-2 rounded-xl bg-[#18181B] border border-zinc-800 text-sm text-zinc-300 outline-none focus:border-primary-500/50 transition-all">
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-medium text-zinc-400 mb-2">Row limit</label>
          <input type="number" min={1} max={2000} value={config.limit ?? 500}
            onChange={(e) => setConfig((c) => ({ ...c, limit: parseInt(e.target.value) || 500 }))}
            className="w-32 px-3 py-2 rounded-xl bg-[#18181B] border border-zinc-800 text-sm text-zinc-300 outline-none focus:border-primary-500/50 transition-all" />
        </div>
      </div>
    );
  }

  // Summary
  return (
    <div>
      <h2 className="text-base font-semibold text-zinc-200 mb-1">Group & aggregate</h2>
      <p className="text-sm text-zinc-500 mb-5">Choose how to group the data and what to calculate.</p>

      <div className="mb-5">
        <label className="block text-xs font-medium text-zinc-400 mb-2">Group by</label>
        <select value={config.groupBy ?? ''} onChange={(e) => setConfig((c) => ({ ...c, groupBy: e.target.value }))}
          className="w-full px-3 py-2.5 rounded-xl bg-[#18181B] border border-zinc-800 text-sm text-zinc-300 outline-none focus:border-primary-500/50 transition-all">
          <option value="">— Select field —</option>
          <option value="month">Month (time series)</option>
          {fields.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-zinc-400">Aggregations</label>
          <button onClick={() => setConfig((c) => ({ ...c, aggregations: [...(c.aggregations ?? []), newAgg()] }))}
            className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors">
            <Icon icon="solar:add-circle-linear" width={13} /> Add
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {(config.aggregations ?? []).map((agg, idx) => (
            <div key={agg.id ?? idx} className="flex items-center gap-2 bg-[#111113] border border-zinc-800 rounded-xl p-3">
              <select value={agg.fn} onChange={(e) => setConfig((c) => {
                const a = [...c.aggregations]; a[idx] = { ...a[idx], fn: e.target.value }; return { ...c, aggregations: a };
              })}
                className="px-2 py-1.5 rounded-lg bg-[#18181B] border border-zinc-700 text-xs text-zinc-300 outline-none flex-shrink-0">
                {AGG_FNS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
              <select value={agg.field} onChange={(e) => setConfig((c) => {
                const a = [...c.aggregations]; a[idx] = { ...a[idx], field: e.target.value }; return { ...c, aggregations: a };
              })}
                className="px-2 py-1.5 rounded-lg bg-[#18181B] border border-zinc-700 text-xs text-zinc-300 outline-none flex-1">
                <option value="*">All records (*)</option>
                {fields.filter((f) => ['number'].includes(f.type)).map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
              <input value={agg.alias} onChange={(e) => setConfig((c) => {
                const a = [...c.aggregations]; a[idx] = { ...a[idx], alias: e.target.value }; return { ...c, aggregations: a };
              })} placeholder="Label (optional)"
                className="flex-1 px-2 py-1.5 rounded-lg bg-[#18181B] border border-zinc-700 text-xs text-zinc-300 outline-none focus:border-primary-500/50 transition-all" />
              {(config.aggregations ?? []).length > 1 && (
                <button onClick={() => setConfig((c) => ({ ...c, aggregations: c.aggregations.filter((_, i) => i !== idx) }))}
                  className="p-1 text-zinc-600 hover:text-error-400 transition-colors">
                  <Icon icon="solar:close-circle-linear" width={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Step 2 — filters ──────────────────────────────────────────────────────────
function StepFilters({ sources, config, setConfig }) {
  const src = sources.find((s) => s.key === config.source);
  const fields = src?.fields ?? [];

  const addFilter = () => setConfig((c) => ({ ...c, filters: [...(c.filters ?? []), newFilter()] }));
  const removeFilter = (id) => setConfig((c) => ({ ...c, filters: c.filters.filter((f) => f.id !== id) }));
  const updateFilter = (id, patch) => setConfig((c) => ({
    ...c, filters: c.filters.map((f) => f.id === id ? { ...f, ...patch } : f)
  }));

  const filters = config.filters ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-zinc-200">Add filters</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Narrow down the data included in the report.</p>
        </div>
        <button onClick={addFilter}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-medium transition-all">
          <Icon icon="solar:add-circle-linear" width={13} />
          Add Filter
        </button>
      </div>

      {filters.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-zinc-700 bg-[#111113] border border-zinc-800 rounded-2xl">
          <Icon icon="solar:filter-linear" width={28} />
          <p className="text-sm text-zinc-500">No filters — all records will be included.</p>
          <button onClick={addFilter} className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
            + Add filter
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filters.map((f, idx) => {
            const fieldMeta = fields.find((ff) => ff.key === f.field);
            const ops = FILTER_OPS_BY_TYPE[fieldMeta?.type ?? 'text'] ?? FILTER_OPS_BY_TYPE.text;
            const noValue = f.op === 'is_null' || f.op === 'is_not_null';

            return (
              <div key={f.id} className="flex items-center gap-2 bg-[#111113] border border-zinc-800 rounded-xl p-3 flex-wrap">
                {idx > 0 && (
                  <select value={f.logic} onChange={(e) => updateFilter(f.id, { logic: e.target.value })}
                    className="w-16 px-2 py-1.5 rounded-lg bg-[#18181B] border border-zinc-700 text-xs text-zinc-300 outline-none">
                    <option value="AND">AND</option>
                    <option value="OR">OR</option>
                  </select>
                )}
                <select value={f.field} onChange={(e) => updateFilter(f.id, { field: e.target.value, op: 'eq' })}
                  className="flex-1 min-w-[120px] px-2 py-1.5 rounded-lg bg-[#18181B] border border-zinc-700 text-xs text-zinc-300 outline-none">
                  <option value="">— Field —</option>
                  {fields.map((ff) => <option key={ff.key} value={ff.key}>{ff.label}</option>)}
                </select>
                <select value={f.op} onChange={(e) => updateFilter(f.id, { op: e.target.value })}
                  className="w-32 px-2 py-1.5 rounded-lg bg-[#18181B] border border-zinc-700 text-xs text-zinc-300 outline-none">
                  {ops.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
                </select>
                {!noValue && (
                  fieldMeta?.options ? (
                    <select value={f.value} onChange={(e) => updateFilter(f.id, { value: e.target.value })}
                      className="flex-1 min-w-[100px] px-2 py-1.5 rounded-lg bg-[#18181B] border border-zinc-700 text-xs text-zinc-300 outline-none">
                      <option value="">— Value —</option>
                      {fieldMeta.options.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input value={f.value} onChange={(e) => updateFilter(f.id, { value: e.target.value })}
                      placeholder="Value" type={fieldMeta?.type === 'date' ? 'date' : fieldMeta?.type === 'number' ? 'number' : 'text'}
                      className="flex-1 min-w-[100px] px-2 py-1.5 rounded-lg bg-[#18181B] border border-zinc-700 text-xs text-zinc-300 outline-none focus:border-primary-500/50 transition-all" />
                  )
                )}
                <button onClick={() => removeFilter(f.id)} className="p-1 text-zinc-600 hover:text-error-400 transition-colors">
                  <Icon icon="solar:close-circle-linear" width={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Step 3 — chart config ─────────────────────────────────────────────────────
function StepChart({ config, setConfig, previewData }) {
  if (config.type === 'tabular') {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-zinc-500 bg-[#111113] border border-zinc-800 rounded-2xl">
        <Icon icon="solar:table-linear" width={28} />
        <p className="text-sm">Tabular reports display as a table. No chart configuration needed.</p>
      </div>
    );
  }

  const chart = config.chart ?? {};

  return (
    <div>
      <h2 className="text-base font-semibold text-zinc-200 mb-1">Configure chart</h2>
      <p className="text-sm text-zinc-500 mb-5">Choose how to visualize summary data.</p>

      <div className="mb-5 flex items-center gap-3">
        <label className="text-xs text-zinc-400">Show chart</label>
        <button onClick={() => setConfig((c) => ({ ...c, chart: { ...chart, enabled: !chart.enabled } }))}
          className={`relative w-10 h-5 rounded-full transition-all ${chart.enabled !== false ? 'bg-primary-600' : 'bg-zinc-700'}`}>
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${chart.enabled !== false ? 'translate-x-5' : ''}`} />
        </button>
      </div>

      {chart.enabled !== false && (
        <>
          <div className="mb-5">
            <label className="block text-xs font-medium text-zinc-400 mb-3">Chart type</label>
            <div className="flex flex-wrap gap-2">
              {CHART_TYPES.map((t) => (
                <button key={t.value} onClick={() => setConfig((c) => ({ ...c, chart: { ...chart, type: t.value } }))}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all
                    ${chart.type === t.value ? 'bg-primary-500/15 border-primary-500/40 text-primary-300' : 'bg-[#111113] border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}>
                  <Icon icon={t.icon} width={15} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {previewData && previewData.rows?.length > 0 && (
            <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-4">
              <p className="text-xs text-zinc-600 mb-3">Preview</p>
              <ReportChart
                type={chart.type ?? 'bar'}
                data={previewData.rows}
                xKey={config.groupBy === 'month' ? 'month' : (config.groupBy ?? 'label')}
                yKeys={previewData.columns?.filter((c) => c.type === 'number').map((c) => c.key) ?? ['value']}
                height={240}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Step 4 — name & save ──────────────────────────────────────────────────────
function StepSave({ config, setConfig, folders, isEdit }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-zinc-200 mb-1">{isEdit ? 'Update report' : 'Save report'}</h2>
      <p className="text-sm text-zinc-500 mb-5">Give your report a name and optional description.</p>

      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Report name <span className="text-error-500">*</span></label>
          <input value={config.name ?? ''} onChange={(e) => setConfig((c) => ({ ...c, name: e.target.value }))}
            placeholder="e.g. Contacts by Month"
            className="w-full px-3 py-2.5 rounded-xl bg-[#18181B] border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-primary-500/60 transition-all" />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description</label>
          <textarea value={config.description ?? ''} onChange={(e) => setConfig((c) => ({ ...c, description: e.target.value }))}
            placeholder="Optional description…" rows={2}
            className="w-full px-3 py-2.5 rounded-xl bg-[#18181B] border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-primary-500/60 transition-all resize-none" />
        </div>
        {folders.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Folder</label>
            <select value={config.folderId ?? ''} onChange={(e) => setConfig((c) => ({ ...c, folderId: e.target.value || null }))}
              className="w-full px-3 py-2.5 rounded-xl bg-[#18181B] border border-zinc-800 text-sm text-zinc-300 outline-none focus:border-primary-500/50 transition-all">
              <option value="">— No folder —</option>
              {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        )}
        <label className="flex items-center gap-3 cursor-pointer">
          <div onClick={() => setConfig((c) => ({ ...c, isPublic: !c.isPublic }))}
            className={`relative w-10 h-5 rounded-full transition-all ${config.isPublic ? 'bg-primary-600' : 'bg-zinc-700'}`}>
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${config.isPublic ? 'translate-x-5' : ''}`} />
          </div>
          <div>
            <p className="text-sm text-zinc-300">Public report</p>
            <p className="text-xs text-zinc-600">Visible to all admins</p>
          </div>
        </label>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ReportBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const isEdit = !!id;

  const [step, setStep] = useState(0);
  const [sources, setSources] = useState([]);
  const [folders, setFolders] = useState([]);
  const [saving, setSaving] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewing, setPreviewing] = useState(false);

  const [config, setConfig] = useState({
    source: '',
    type: 'tabular',
    columns: [],
    groupBy: '',
    aggregations: [newAgg()],
    filters: [],
    sort: { field: 'created_at', dir: 'desc' },
    limit: 500,
    chart: { enabled: true, type: 'bar' },
    name: '',
    description: '',
    isPublic: false,
    folderId: null,
  });

  useEffect(() => {
    Promise.all([adminApi.getReportSources(), adminApi.listReportFolders()]).then(([sr, fr]) => {
      setSources(sr.sources);
      setFolders(fr.folders);
    });
    if (isEdit) {
      adminApi.getReport(id).then(({ report }) => {
        const c = report.config ?? {};
        setConfig({
          source: c.source ?? '',
          type: report.report_type ?? 'tabular',
          columns: c.columns ?? [],
          groupBy: c.groupBy ?? '',
          aggregations: (c.aggregations ?? [newAgg()]).map((a, i) => ({ ...a, id: i })),
          filters: (c.filters ?? []).map((f, i) => ({ ...f, id: i })),
          sort: c.sort ?? { field: 'created_at', dir: 'desc' },
          limit: c.limit ?? 500,
          chart: c.chart ?? { enabled: true, type: 'bar' },
          name: report.name ?? '',
          description: report.description ?? '',
          isPublic: report.is_public ?? false,
          folderId: report.folder_id ?? null,
        });
      }).catch((err) => toastError('Failed to load', err.message));
    }
  }, [id, isEdit, toastError]);

  const canNext = useCallback(() => {
    if (step === 0) return config.source && config.type;
    if (step === 1) return config.type === 'tabular' ? config.columns.length > 0 : !!config.groupBy;
    if (step === 4) return !!config.name?.trim();
    return true;
  }, [step, config]);

  const buildApiConfig = useCallback(() => ({
    source: config.source,
    report_type: config.type,
    ...(config.type === 'tabular'
      ? { columns: config.columns, sort: config.sort, limit: config.limit }
      : { groupBy: config.groupBy, aggregations: config.aggregations.map(({ fn, field, alias }) => ({ fn, field, alias })), sort: config.sort }),
    filters: (config.filters ?? []).map(({ field, op, value, logic }) => ({ field, op, value, logic })),
    chart: config.chart,
  }), [config]);

  const handlePreview = useCallback(async () => {
    if (!config.source) return;
    setPreviewing(true);
    try {
      const { data } = await adminApi.executeReportConfig(buildApiConfig());
      setPreviewData(data);
    } catch (err) { toastError('Preview failed', err.message); }
    finally { setPreviewing(false); }
  }, [config.source, buildApiConfig, toastError]);

  const handleSave = async () => {
    if (!config.name?.trim()) return toastError('Name required', 'Please enter a report name.');
    setSaving(true);
    try {
      const payload = {
        name: config.name.trim(),
        description: config.description ?? null,
        folderId: config.folderId ?? null,
        reportType: config.type,
        isPublic: config.isPublic ?? false,
        config: buildApiConfig(),
      };
      if (isEdit) {
        await adminApi.updateReport(id, payload);
        success('Saved', 'Report updated.');
      } else {
        const { report } = await adminApi.createReport(payload);
        success('Created', 'Report saved.');
        navigate(`/admin/reports/${report.id}/view`);
        return;
      }
      navigate(`/admin/reports/${id}/view`);
    } catch (err) { toastError('Save failed', err.message); }
    finally { setSaving(false); }
  };

  const nextStep = () => {
    if (step === 2) handlePreview();
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const prevStep = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate('/admin/reports')}
          className="p-2 rounded-xl border border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-600 transition-all">
          <Icon icon="solar:arrow-left-linear" width={16} />
        </button>
        <div>
          <h1 className="font-display font-semibold text-xl text-zinc-100">
            {isEdit ? 'Edit Report' : 'New Report'}
          </h1>
          <p className="text-xs text-zinc-500">Step {step + 1} of {STEPS.length}</p>
        </div>
      </div>

      <StepIndicator step={step} />

      <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-6 mb-5">
        {step === 0 && <StepSource sources={sources} config={config} setConfig={setConfig} />}
        {step === 1 && <StepFields sources={sources} config={config} setConfig={setConfig} />}
        {step === 2 && <StepFilters sources={sources} config={config} setConfig={setConfig} />}
        {step === 3 && <StepChart config={config} setConfig={setConfig} previewData={previewData} />}
        {step === 4 && <StepSave config={config} setConfig={setConfig} folders={folders} isEdit={isEdit} />}
      </div>

      {/* Preview pane (steps 1-3) */}
      {step >= 1 && step <= 3 && previewData && (
        <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-zinc-400">Preview — {previewData.total} row{previewData.total !== 1 ? 's' : ''}</p>
            <button onClick={handlePreview} disabled={previewing}
              className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors disabled:opacity-50">
              <Icon icon={previewing ? 'solar:loading-linear' : 'solar:refresh-linear'} width={12} className={previewing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[#18181B]">
                <tr>
                  {previewData.columns.map((c) => (
                    <th key={c.key} className="text-left px-3 py-2 text-zinc-500 font-medium uppercase tracking-wider whitespace-nowrap">{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {previewData.rows.slice(0, 20).map((r, i) => (
                  <tr key={i} className="hover:bg-zinc-800/20">
                    {previewData.columns.map((c) => (
                      <td key={c.key} className="px-3 py-2 text-zinc-400 whitespace-nowrap font-mono">
                        {r[c.key] === null || r[c.key] === undefined ? <span className="text-zinc-700">—</span> : String(r[c.key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={prevStep} disabled={step === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 text-sm font-medium transition-all disabled:opacity-30">
          <Icon icon="solar:arrow-left-linear" width={14} />
          Back
        </button>

        <div className="flex gap-3">
          {step >= 1 && step <= 3 && (
            <button onClick={handlePreview} disabled={previewing || !config.source}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 text-sm font-medium transition-all disabled:opacity-40">
              <Icon icon={previewing ? 'solar:loading-linear' : 'solar:eye-linear'} width={14} className={previewing ? 'animate-spin' : ''} />
              {previewing ? 'Loading…' : 'Preview'}
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={nextStep} disabled={!canNext()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-all disabled:opacity-40 shadow-lg shadow-primary-900/30">
              Next
              <Icon icon="solar:arrow-right-linear" width={14} />
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving || !config.name?.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-all disabled:opacity-40 shadow-lg shadow-primary-900/30">
              <Icon icon={saving ? 'solar:loading-linear' : 'solar:check-circle-linear'} width={15} className={saving ? 'animate-spin' : ''} />
              {saving ? 'Saving…' : (isEdit ? 'Update Report' : 'Save & Run')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
