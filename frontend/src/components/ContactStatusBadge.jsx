const STYLES = {
  new: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  in_progress: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  closed: 'bg-zinc-800 text-zinc-500 border-zinc-700'
};

const LABELS = {
  new: 'New',
  in_progress: 'In Progress',
  completed: 'Completed',
  closed: 'Closed'
};

export default function ContactStatusBadge({ status }) {
  const style = STYLES[status] ?? STYLES.new;
  const label = LABELS[status] ?? status;
  return (
    <span className={`inline-block border rounded-full px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider whitespace-nowrap ${style}`}>
      {label}
    </span>
  );
}
