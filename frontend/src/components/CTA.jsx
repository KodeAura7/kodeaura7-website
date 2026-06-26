import { Link } from 'react-router-dom';
import Icon from './Icon';

export default function CTA({ title, body, primary = 'Get in Touch', secondary, compact = false }) {
  return (
    <section className={`${compact ? 'py-20' : 'py-20 md:py-28'} border-t border-zinc-900`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="relative overflow-hidden bg-[#111113] rounded-3xl p-12 md:p-16 border border-zinc-800 text-center">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-indigo-500/15 rounded-full blur-[80px]" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-cyan-500/15 rounded-full blur-[80px]" />
          <div className="relative">
            <h2 className="font-display font-semibold text-3xl md:text-5xl tracking-tighter mb-5">{title}</h2>
            <p className="text-zinc-400 text-lg mb-10 max-w-xl mx-auto">{body}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/#contact" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-500 text-white rounded-full text-sm font-medium hover:bg-indigo-400 transition-all shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] hover:-translate-y-0.5">
                {primary} <Icon icon="solar:arrow-right-linear" width={18} />
              </Link>
              {secondary ? (
                <Link to="/portfolio" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 backdrop-blur-sm text-zinc-100 rounded-full text-sm font-medium hover:bg-white/10 transition-all border border-zinc-800 hover:border-zinc-600">
                  {secondary}
                </Link>
              ) : null}
            </div>
            <p className="text-sm text-zinc-500 mt-6 font-mono">info@kodeaura7.in</p>
          </div>
        </div>
      </div>
    </section>
  );
}
