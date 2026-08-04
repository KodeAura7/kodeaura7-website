const STYLES = {
  new: 'bg-primary-500/10 text-primary-400 border-primary-500/20',
  in_progress: 'bg-warning-500/10 text-warning-400 border-warning-500/20',
  completed: 'bg-success-500/10 text-success-400 border-success-500/20',
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
