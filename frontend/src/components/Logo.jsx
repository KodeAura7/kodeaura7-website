import { Link } from 'react-router-dom';

export default function Logo({ to = '/' }) {
  return (
    <Link to={to} className="flex items-center gap-2.5">
      <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)]">
        <div className="w-2.5 h-2.5 bg-[#09090B] rounded-sm" />
      </div>
      <span className="font-display font-semibold tracking-tighter text-lg">KodeAura7</span>
    </Link>
  );
}
