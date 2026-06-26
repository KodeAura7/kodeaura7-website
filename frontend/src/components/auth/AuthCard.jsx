import { Link } from 'react-router-dom';
import AmbientBackground from '../AmbientBackground';
import Icon from '../Icon';
import SEO from '../SEO';

export default function AuthCard({ title, description, seoTitle, seoPath, seoDescription, children }) {
  return (
    <div className="antialiased selection:bg-indigo-500/30 overflow-x-hidden min-h-screen flex items-center justify-center relative">
      <SEO title={seoTitle} path={seoPath} description={seoDescription} />
      <AmbientBackground compact />
      <Link
        to="/"
        className="fixed top-6 left-6 inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors z-10 whitespace-nowrap"
      >
        <Icon icon="solar:arrow-left-linear" width={14} /> Back to site
      </Link>
      <div className="max-w-md w-full mx-auto px-6 py-16">
        <div className="fade-up relative bg-[#111113] rounded-3xl p-8 md:p-10 border border-zinc-800 shadow-2xl shadow-black/50">
          <div className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
              <div className="w-4 h-4 bg-[#09090B] rounded-sm" />
            </div>
            <span className="font-display font-semibold text-lg mt-3">KodeAura7</span>
            <span className="bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1 text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-2">
              Admin Portal
            </span>
          </div>
          <h1 className="font-display font-semibold text-2xl text-zinc-100 text-center mb-1">{title}</h1>
          {description && <p className="text-sm text-zinc-500 text-center">{description}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}
