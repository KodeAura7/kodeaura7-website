import Icon from '../../Icon';

// ── Operator metadata ─────────────────────────────────────────────────────────

const ALL_OPERATORS = [
  { value: 'equals',       label: 'equals',              types: ['text','enum','date','number'] },
  { value: 'not_equals',   label: 'not equals',          types: ['text','enum','date','number'] },
  { value: 'contains',     label: 'contains',            types: ['text'] },
  { value: 'not_contains', label: 'does not contain',    types: ['text'] },
  { value: 'starts_with',  label: 'starts with',         types: ['text'] },
  { value: 'ends_with',    label: 'ends with',           types: ['text'] },
  { value: 'is_empty',     label: 'is empty',            types: ['text','enum'] },
  { value: 'is_not_empty', label: 'is not empty',        types: ['text','enum'] },
  { value: 'gt',           label: 'greater than',        types: ['number','date'] },
  { value: 'lt',           label: 'less than',           types: ['number','date'] },
  { value: 'gte',          label: 'greater than or equal', types: ['number','date'] },
  { value: 'lte',          label: 'less than or equal',  types: ['number','date'] },
  { value: 'between',      label: 'between',             types: ['number','date'] },
  { value: 'in',           label: 'is any of',           types: ['enum','text'] },
  { value: 'not_in',       label: 'is none of',          types: ['enum','text'] },
  { value: 'today',        label: 'today',               types: ['date'] },
  { value: 'yesterday',    label: 'yesterday',           types: ['date'] },
  { value: 'tomorrow',     label: 'tomorrow',            types: ['date'] },
  { value: 'this_week',    label: 'this week',           types: ['date'] },
  { value: 'last_week',    label: 'last week',           types: ['date'] },
  { value: 'next_week',    label: 'next week',           types: ['date'] },
  { value: 'this_month',   label: 'this month',          types: ['date'] },
  { value: 'last_month',   label: 'last month',          types: ['date'] },
  { value: 'next_month',   label: 'next month',          types: ['date'] },
  { value: 'this_year',    label: 'this year',           types: ['date'] },
  { value: 'date_range',   label: 'date range',          types: ['date'] },
];

// Operators that don't need a value input
const NO_VALUE_OPS = new Set(['is_empty','is_not_empty','today','yesterday','tomorrow','this_week','last_week','next_week','this_month','last_month','next_month','this_year']);
// Operators that need two values (from/to)
const TWO_VALUE_OPS = new Set(['between','date_range']);

function getOperatorsForField(field) {
  if (!field) return [];
  return ALL_OPERATORS.filter((op) => op.types.includes(field.type));
}

function defaultOpForField(field) {
  if (!field) return 'equals';
  if (field.type === 'date') return 'this_month';
  return 'equals';
}

// ── Single filter row ─────────────────────────────────────────────────────────

function FilterRow({ index, filter, fields, onChange, onRemove }) {
  const field = fields.find((f) => f.name === filter.field_name) ?? null;
  const ops = getOperatorsForField(field);
  const noValue = NO_VALUE_OPS.has(filter.operator);
  const twoValues = TWO_VALUE_OPS.has(filter.operator);

  const handleFieldChange = (e) => {
    const newField = fields.find((f) => f.name === e.target.value);
    onChange(index, {
      ...filter,
      field_name: e.target.value,
      operator: defaultOpForField(newField),
      value: '',
      value_to: '',
    });
  };

  const handleOpChange = (e) => {
    onChange(index, { ...filter, operator: e.target.value, value: '', value_to: '' });
  };

  const inputClass = 'bg-[#18181B] border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-primary-500/50 w-full';
  const selectClass = `${inputClass} cursor-pointer`;

  function renderValueInput() {
    if (noValue) return null;

    if (field?.type === 'enum') {
      if (filter.operator === 'in' || filter.operator === 'not_in') {
        // multi-select via checkboxes rendered as tag pills
        const selected = filter.value ? filter.value.split(',').map((v) => v.trim()).filter(Boolean) : [];
        const toggle = (opt) => {
          const next = selected.includes(opt) ? selected.filter((v) => v !== opt) : [...selected, opt];
          onChange(index, { ...filter, value: next.join(', ') });
        };
        return (
          <div className="flex flex-wrap gap-1.5 min-w-0">
            {(field.options ?? []).map((opt) => (
              <button key={opt} type="button" onClick={() => toggle(opt)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all ${
                  selected.includes(opt)
                    ? 'bg-primary-500/20 border-primary-500/40 text-primary-300'
                    : 'bg-[#18181B] border-zinc-700 text-zinc-500 hover:border-zinc-500'
                }`}>
                {opt.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        );
      }
      return (
        <select value={filter.value} onChange={(e) => onChange(index, { ...filter, value: e.target.value })} className={selectClass}>
          <option value="">Select…</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>
          ))}
        </select>
      );
    }

    if (field?.type === 'date') {
      if (twoValues) {
        return (
          <div className="flex items-center gap-1.5 min-w-0">
            <input type="date" value={filter.value || ''} onChange={(e) => onChange(index, { ...filter, value: e.target.value })} className={inputClass} />
            <span className="text-zinc-600 text-xs shrink-0">to</span>
            <input type="date" value={filter.value_to || ''} onChange={(e) => onChange(index, { ...filter, value_to: e.target.value })} className={inputClass} />
          </div>
        );
      }
      return (
        <input type="date" value={filter.value || ''} onChange={(e) => onChange(index, { ...filter, value: e.target.value })} className={inputClass} />
      );
    }

    if (twoValues) {
      return (
        <div className="flex items-center gap-1.5 min-w-0">
          <input type="text" value={filter.value || ''} onChange={(e) => onChange(index, { ...filter, value: e.target.value })} placeholder="From" className={inputClass} />
          <span className="text-zinc-600 text-xs shrink-0">to</span>
          <input type="text" value={filter.value_to || ''} onChange={(e) => onChange(index, { ...filter, value_to: e.target.value })} placeholder="To" className={inputClass} />
        </div>
      );
    }

    return (
      <input type="text" value={filter.value || ''} onChange={(e) => onChange(index, { ...filter, value: e.target.value })}
        placeholder="Value…" className={inputClass} />
    );
  }

  return (
    <div className="flex items-start gap-2 group">
      <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-600 w-6 pt-2 shrink-0 select-none">
        {index + 1}
      </div>

      {/* Field picker */}
      <div className="w-36 shrink-0">
        <select value={filter.field_name} onChange={handleFieldChange} className={selectClass}>
          <option value="">Field…</option>
          {fields.map((f) => (
            <option key={f.name} value={f.name}>{f.label}</option>
          ))}
        </select>
      </div>

      {/* Operator picker */}
      <div className="w-36 shrink-0">
        <select value={filter.operator} onChange={handleOpChange} disabled={!field} className={selectClass}>
          {ops.map((op) => (
            <option key={op.value} value={op.value}>{op.label}</option>
          ))}
        </select>
      </div>

      {/* Value input */}
      <div className="flex-1 min-w-0">
        {renderValueInput()}
      </div>

      {/* Remove */}
      <button type="button" onClick={() => onRemove(index)}
        className="p-1.5 rounded-lg text-zinc-600 hover:text-error-400 hover:bg-error-500/10 transition-all shrink-0 mt-0.5">
        <Icon icon="solar:trash-bin-minimalistic-linear" width={14} />
      </button>
    </div>
  );
}

// ── Filter builder ────────────────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export function emptyFilter(fields) {
  const first = fields[0];
  return {
    field_name: first?.name ?? '',
    operator: defaultOpForField(first),
    value: '',
    value_to: null,
  };
}

export default function FilterBuilder({ fields, filters, onChange, logic, onLogicChange }) {
  const addRow = () => onChange([...filters, emptyFilter(fields)]);

  const updateRow = (index, updated) => {
    const next = [...filters];
    next[index] = updated;
    onChange(next);
  };

  const removeRow = (index) => {
    onChange(filters.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {/* Logic toggle */}
      {filters.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Match</span>
          <div className="flex rounded-lg overflow-hidden border border-zinc-700">
            {['AND', 'OR'].map((val) => (
              <button key={val} type="button" onClick={() => onLogicChange(val)}
                className={`px-3 py-1 text-xs font-medium transition-all ${
                  logic === val
                    ? 'bg-primary-500 text-white'
                    : 'bg-[#18181B] text-zinc-500 hover:text-zinc-200'
                }`}>
                {val === 'AND' ? 'All Filters' : 'Any Filter'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Rows */}
      <div className="space-y-2">
        {filters.length === 0 ? (
          <p className="text-xs text-zinc-600 italic py-2">No filters — view shows all records.</p>
        ) : (
          filters.map((f, i) => (
            <FilterRow key={i} index={i} filter={f} fields={fields} onChange={updateRow} onRemove={removeRow} />
          ))
        )}
      </div>

      {/* Add row */}
      <button type="button" onClick={addRow}
        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-primary-400 transition-colors">
        <Icon icon="solar:add-circle-linear" width={14} />
        Add Filter
      </button>
    </div>
  );
}
