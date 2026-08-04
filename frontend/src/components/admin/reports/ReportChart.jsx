import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const PALETTE = [
  '#1C63F3','#0AA9D6','#10B981','#F59E0B','#8B5CF6',
  '#EC4899','#F97316','#14B8A6','#84CC16','#EF4444',
];

const CHART_STYLE = {
  tooltip: {
    contentStyle: { background: '#18181B', border: '1px solid #27272A', borderRadius: 8, fontSize: 12, color: '#E4E4E7' },
    cursor: { fill: 'rgba(28,99,243,0.08)' },
  },
  axis: { tick: { fill: '#71717A', fontSize: 11 }, axisLine: false, tickLine: false },
  grid: { stroke: '#27272A', strokeDasharray: '3 3' },
};

function fmt(v) {
  if (typeof v !== 'number') return v ?? '';
  if (Number.isInteger(v)) return v.toLocaleString();
  return v.toFixed(2);
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#18181B] border border-zinc-800 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400 mb-1.5 font-medium">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color || p.fill }} />
          <span className="text-zinc-300">{p.name}:</span>
          <span className="text-zinc-100 font-mono">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

const CustomLegend = ({ payload }) => (
  <div className="flex flex-wrap gap-3 justify-center mt-1">
    {payload?.map((e, i) => (
      <div key={i} className="flex items-center gap-1.5 text-xs text-zinc-400">
        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: e.color }} />
        {e.value}
      </div>
    ))}
  </div>
);

export default function ReportChart({ type = 'bar', data = [], xKey = 'label', yKeys = ['value'], colors = PALETTE, height = 320 }) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center text-zinc-600 text-sm" style={{ height }}>
        No data to display
      </div>
    );
  }

  const commonProps = {
    data,
    margin: { top: 8, right: 8, left: -8, bottom: 0 },
  };

  if (type === 'pie' || type === 'donut') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey={yKeys[0]}
            nameKey={xKey}
            cx="50%"
            cy="45%"
            innerRadius={type === 'donut' ? '55%' : 0}
            outerRadius="70%"
            paddingAngle={2}
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart {...commonProps}>
          <CartesianGrid {...CHART_STYLE.grid} />
          <XAxis dataKey={xKey} {...CHART_STYLE.axis} />
          <YAxis {...CHART_STYLE.axis} />
          <Tooltip content={<CustomTooltip />} />
          {yKeys.map((k, i) => (
            <Line key={k} type="monotone" dataKey={k} stroke={colors[i % colors.length]}
              strokeWidth={2} dot={{ r: 3, fill: colors[i % colors.length] }} activeDot={{ r: 5 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'area') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart {...commonProps}>
          <defs>
            {yKeys.map((k, i) => (
              <linearGradient key={k} id={`grad_${k}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[i % colors.length]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={colors[i % colors.length]} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid {...CHART_STYLE.grid} />
          <XAxis dataKey={xKey} {...CHART_STYLE.axis} />
          <YAxis {...CHART_STYLE.axis} />
          <Tooltip content={<CustomTooltip />} />
          {yKeys.map((k, i) => (
            <Area key={k} type="monotone" dataKey={k} stroke={colors[i % colors.length]}
              strokeWidth={2} fill={`url(#grad_${k})`} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  // default: bar
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart {...commonProps}>
        <CartesianGrid {...CHART_STYLE.grid} vertical={false} />
        <XAxis dataKey={xKey} {...CHART_STYLE.axis} />
        <YAxis {...CHART_STYLE.axis} />
        <Tooltip content={<CustomTooltip />} cursor={CHART_STYLE.tooltip.cursor} />
        {yKeys.map((k, i) => (
          <Bar key={k} dataKey={k} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} maxBarSize={48} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
