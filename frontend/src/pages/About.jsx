import { useEffect, useState } from 'react';
import CTA from '../components/CTA';
import Icon from '../components/Icon';
import SEO from '../components/SEO';
import SectionHero from '../components/SectionHero';
import SiteLayout from '../layouts/SiteLayout';
import { values as staticValues } from '../constants/content';
import { tech as staticTechSite } from '../constants/site';

const API = import.meta.env.VITE_API_BASE_URL || '';

const DEFAULT = {
  hero: {
    eyebrow: 'About KodeAura7',
    title: 'We Engineer',
    gradient: 'Digital Growth',
    description: 'KodeAura7 is a full-service digital technology agency, India. We partner with businesses to design, build, and scale their digital infrastructure.'
  },
  story: {
    subtitle: 'Our Story',
    title: 'Built From Passion. Driven by Purpose.',
    paragraphs: [
      'KodeAura7 was founded with one conviction - that great technology should be accessible to every ambitious business, not just the Fortune 500.',
      "Today, we're a team of developers, designers, CRM specialists, and digital marketers who obsess over the details that turn a good product into a great one.",
      'Our edge is our breadth. We think in systems - how your website, your CRM, your ads, and your automations work together to create compounding growth.'
    ],
    stats: [
      { value: '8+', label: 'DIGITAL SERVICES' },
      { value: '100%', label: 'CUSTOM SOLUTIONS' },
      { value: '24/7', label: 'DEDICATED SUPPORT' },
    ]
  },
  values: {
    title: 'What Drives Us',
    subtitle: 'Four principles we refuse to compromise on.',
    items: staticValues || []
  },
  tech: {
    title: 'Our Technology Stack',
    subtitle: 'Built with tools that scale.',
    items: staticTechSite || []
  },
  cta: {
    title: 'Ready to build something extraordinary?',
    body: 'Book a free strategy session. No commitment.'
  }
};

export default function About() {
  const [content, setContent] = useState(DEFAULT);

  useEffect(() => {
    fetch(`${API}/api/pages/about`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setContent({ ...DEFAULT, ...data }); })
      .catch(() => null);
  }, []);

  const { hero, story, values, tech, cta } = content;

  return (
    <SiteLayout>
      <SEO
        title="About Us | Digital Agency, Dehradun"
        path="/about"
        description="KodeAura7 is a full-service digital technology agency, India. We design, build, and scale digital infrastructure — websites, CRMs, and campaigns — for ambitious businesses worldwide."
        keywords="about KodeAura7, digital agency Dehradun, software company India, web development team, Salesforce partner India"
      />

      <SectionHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        gradient={hero.gradient}
        description={hero.description}
      />

      {/* Story + Stats */}
      <section className="py-20 md:py-28 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <p className="font-mono text-xs text-zinc-500 tracking-widest uppercase mb-4">{story.subtitle}</p>
            <h2 className="font-display font-semibold text-3xl md:text-4xl tracking-tighter leading-tight mb-8">{story.title}</h2>
            <div className="space-y-5 text-zinc-400 leading-relaxed">
              {(story.paragraphs || []).map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </div>
          <div className="glass-panel border border-zinc-800 rounded-3xl p-8 lg:sticky lg:top-28">
            {(story.stats || []).map(({ value, label }, i) => (
              <div key={label}>
                <div className={`flex items-baseline justify-between py-5 ${i === 1 ? 'animate-float-delayed' : i === 2 ? 'animate-float-delayed-more' : 'animate-float'}`}>
                  <span className="font-display font-semibold text-3xl text-gradient">{value}</span>
                  <span className="text-xs uppercase tracking-widest text-zinc-500 font-mono text-right">{label}</span>
                </div>
                {i < (story.stats || []).length - 1 ? <div className="h-px bg-zinc-800" /> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 md:py-28 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="font-display font-semibold text-3xl md:text-5xl tracking-tighter mb-4">{values.title}</h2>
            <p className="text-zinc-400 text-lg">{values.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(values.items || []).map((v) => (
              <div key={v.title} className="bg-[#111113] rounded-2xl p-8 border border-zinc-800 hover:border-primary-500/30 hover:shadow-[0_0_30px_rgba(51, 112, 246,0.07)] transition-all duration-500">
                <div className="w-12 h-12 rounded-2xl bg-[#18181B] border border-zinc-800 flex items-center justify-center mb-6"
                  style={{ color: v.accent, borderColor: `color-mix(in srgb,${v.accent} 40%,transparent)` }}>
                  <Icon icon={v.icon} width={24} />
                </div>
                <h3 className="font-display text-xl tracking-tight mb-3">{v.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed font-extralight">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section className="py-20 md:py-28 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="font-display font-semibold text-3xl md:text-5xl tracking-tighter mb-4">{tech.title}</h2>
            <p className="text-zinc-400 text-lg">{tech.subtitle}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(tech.items || []).map((t) => (
              <div key={t.label} className="group bg-[#111113] border border-zinc-800 rounded-2xl p-6 flex flex-col items-center gap-3 hover:border-zinc-600 transition-all duration-300">
                <Icon icon={t.icon} width={32} className="text-zinc-400 group-hover:text-primary-400 transition-colors" />
                <span className="text-xs text-zinc-500 font-mono">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTA title={cta.title} body={cta.body} />
    </SiteLayout>
  );
}
