import Icon from '../Icon';

export default function FormMessage({ type = 'error', message }) {
  if (!message) return null;

  if (type === 'success') {
    return (
      <div className="flex items-start gap-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
        <Icon icon="solar:check-circle-linear" width={16} className="text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-xs text-emerald-400">{message}</p>
      </div>
    );
  }

  return (
    <p className="text-xs text-rose-400 flex items-center gap-1.5">
      <Icon icon="solar:danger-circle-linear" width={14} /> {message}
    </p>
  );
}
