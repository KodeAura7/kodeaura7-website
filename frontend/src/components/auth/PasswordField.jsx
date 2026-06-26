import { useState } from 'react';
import Icon from '../Icon';

export default function PasswordField({ label, error, ...inputProps }) {
  const [show, setShow] = useState(false);
  const borderClass = error
    ? 'border-rose-500/50 focus:border-rose-500/50 focus:ring-rose-500/30'
    : 'border-zinc-800 focus:border-indigo-500/50 focus:ring-indigo-500/50';

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-medium text-zinc-400 ml-0.5">{label}</label>
      )}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none flex">
          <Icon icon="solar:lock-password-linear" width={18} />
        </span>
        <input
          type={show ? 'text' : 'password'}
          className={`w-full bg-[#18181B] border ${borderClass} rounded-xl pl-11 pr-11 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 transition-all`}
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          <Icon icon={show ? 'solar:eye-closed-linear' : 'solar:eye-linear'} width={18} />
        </button>
      </div>
      {error && (
        <p className="text-xs text-rose-400 ml-0.5 flex items-center gap-1">
          <Icon icon="solar:danger-circle-linear" width={12} /> {error}
        </p>
      )}
    </div>
  );
}
