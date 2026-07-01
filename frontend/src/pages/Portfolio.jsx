import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import SEO from '../components/SEO';
import SectionHero from '../components/SectionHero';
import SiteLayout from '../layouts/SiteLayout';
import { projects } from '../constants/content';

const accents = {
  'Web Development': '#1C63F3',
  'Salesforce CRM': '#0AA9D6',
  'UI/UX Design': '#F43F5E',
  'Digital Ads': '#F59E0B'
};

export default function Portfolio() {
  const [filter, setFilter] = useState('All');
  const filters = ['All', 'Web Development', 'Salesforce CRM', 'UI/UX Design', 'Digital Ads'];
  const visibleProjects = useMemo(() => projects.filter((p) => filter === 'All' || p.category === filter), [filter]);

  return (
    <SiteLayout>
      <SEO
        title="Portfolio | Web, CRM & Design Projects"
        path="/portfolio"
        description="A curated portfolio of KodeAura7 projects — websites, Salesforce CRM systems, dashboards, and performance advertising campaigns for ambitious businesses."
        keywords="web development portfolio, Salesforce projects, UI/UX case studies, digital marketing results, KodeAura7 portfolio, India software agency"
      />
      <SectionHero eyebrow="Our Work" title="Projects That" gradient="Move the Needle" description="A curated selection of websites, CRM systems, and digital experiences we've built for ambitious brands.">
        <div className="fade-up delay-3 flex flex-wrap items-center justify-center gap-3">
          {['4 Service Categories', '98% On-Time Delivery'].map((item) => <span key={item} className="bg-[#111113] border border-zinc-800 rounded-full px-5 py-2 text-sm font-medium text-zinc-300">{item}</span>)}
        </div>
      </SectionHero>
      <div className="max-w-7xl mx-auto px-6 mb-12"><div className="flex md:justify-center gap-3 overflow-x-auto no-sb pb-2">{filters.map((name) => <button key={name} onClick={() => setFilter(name)} className="shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-all duration-300" style={name === filter ? { background: '#1C63F3', color: '#fff', border: '1px solid #1C63F3' } : { background: '#111113', border: '1px solid #27272A', color: '#a1a1aa' }}>{name}</button>)}</div></div>
      <div className="max-w-7xl mx-auto px-6 pb-24">
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
          {visibleProjects.map((project) => {
            const accent = accents[project.category];
            return <a key={project.title} href="#" className="group relative block mb-6 break-inside-avoid rounded-2xl overflow-hidden border border-zinc-800 hover:border-zinc-600 transition-all duration-500 cursor-pointer" style={{ height: project.tall ? '20rem' : '14rem' }}><div className="absolute inset-0 bg-[#111113] bg-grid opacity-100" /><div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-secondary-500/5" /><div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-700"><Icon icon="solar:gallery-linear" width={44} /><span className="text-xs font-mono">Project Image</span></div><span className="absolute top-4 right-4 w-2 h-2 rounded-full" style={{ background: accent }} /><div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" /><div className="absolute inset-x-0 bottom-0 p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500"><span className="inline-block rounded-full px-3 py-1 text-[10px] font-mono uppercase tracking-widest mb-3" style={{ background: `color-mix(in srgb,${accent} 18%,transparent)`, color: accent, border: `1px solid color-mix(in srgb,${accent} 35%,transparent)` }}>{project.category}</span><h3 className="font-display text-lg text-white tracking-tight mb-2">{project.title}</h3><span className="inline-flex items-center gap-1.5 text-sm text-primary-400 font-medium">View Project <Icon icon="solar:arrow-right-linear" width={14} /></span></div></a>;
          })}
        </div>
      </div>
      <section className="py-20 border-t border-zinc-900"><div className="max-w-3xl mx-auto px-6 text-center"><h2 className="font-display font-semibold text-3xl md:text-5xl tracking-tighter mb-5">Have a Project in Mind?</h2><p className="text-zinc-400 text-lg leading-relaxed mb-10">Let's turn your idea into a product your users will love.</p><div className="flex flex-col sm:flex-row gap-4 justify-center"><Link to="/#contact" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary-500 text-white rounded-full text-sm font-medium hover:bg-primary-400 transition-all shadow-[0_0_30px_rgba(51, 112, 246,0.3)] hover:shadow-[0_0_40px_rgba(51, 112, 246,0.5)] hover:-translate-y-0.5">Start a Project <Icon icon="solar:arrow-right-linear" width={18} /></Link><Link to="/services" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 backdrop-blur-sm text-zinc-100 rounded-full text-sm font-medium hover:bg-white/10 transition-all border border-zinc-800 hover:border-zinc-600">View All Work</Link></div></div></section>
    </SiteLayout>
  );
}
