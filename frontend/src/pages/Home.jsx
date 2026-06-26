import { Link } from 'react-router-dom';
import ContactForm from '../components/ContactForm';
import Icon from '../components/Icon';
import SEO from '../components/SEO';
import SiteLayout from '../layouts/SiteLayout';
import { services, tech } from '../constants/site';
import { steps, testimonials } from '../constants/content';

export default function Home() {
  const marquee = [...tech, ...tech];
  return (
    <SiteLayout>
      <SEO title="KodeAura7" path="/" description="KodeAura7 builds websites, CRMs, design systems, and campaigns that drive measurable business growth." />
      <section className="relative pt-32 md:pt-44 pb-20 md:pb-28">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center text-center">
          <div className="fade-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/50 border border-zinc-800 text-xs font-medium text-zinc-300 backdrop-blur-sm mb-8">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span>
           Test r Trusted by 150+ businesses across India
          </div>
          <h1 className="fade-up delay-1 font-display font-semibold text-5xl md:text-7xl tracking-tighter leading-[1.04] mb-6 max-w-4xl mx-auto">
            We Build <span className="text-gradient">Growth Systems</span> That Drive Results.
          </h1>
          <p className="fade-up delay-2 text-zinc-400 text-lg leading-relaxed max-w-2xl mx-auto mb-10">
            KodeAura7 is a premium digital technology agency from Dehradun. We design, build, and scale the websites, CRMs, and campaigns that turn ambitious businesses into market leaders.
          </p>
          <div className="fade-up delay-3 flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/#contact" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-500 text-white rounded-full text-sm font-medium hover:bg-indigo-400 transition-all shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] hover:-translate-y-0.5">Start Your Project <Icon icon="solar:arrow-right-linear" width={18} /></Link>
            <Link to="/portfolio" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 backdrop-blur-sm text-zinc-100 rounded-full text-sm font-medium hover:bg-white/10 transition-all border border-zinc-800 hover:border-zinc-600">View Our Work <Icon icon="solar:arrow-down-linear" width={18} /></Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl w-full mx-auto text-left">
            {[['150+', 'Projects Delivered'], ['4+', 'Years Experience'], ['98%', 'Client Satisfaction']].map(([value, label], index) => (
              <div key={label} className={`rounded-2xl border border-zinc-800 bg-[#111113] p-6 ${index === 1 ? 'animate-float-delayed' : index === 2 ? 'animate-float-delayed-more' : 'animate-float'}`}>
                <p className="font-display font-semibold text-3xl text-gradient">{value}</p>
                <p className="text-xs uppercase tracking-widest text-zinc-500 mt-2 font-mono">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <div>
              <p className="font-mono text-xs text-zinc-500 tracking-widest uppercase mb-4">What We Do</p>
              <h2 className="font-display font-semibold text-3xl md:text-5xl tracking-tighter leading-tight max-w-2xl">Everything Your Business Needs to <span className="text-gradient">Dominate.</span></h2>
              <p className="text-zinc-400 mt-5 max-w-xl leading-relaxed">End-to-end digital solutions crafted for modern enterprises.</p>
            </div>
            <Link to="/services" className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors shrink-0">View all services <Icon icon="solar:arrow-right-linear" width={16} /></Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((svc) => (
              <Link key={svc.name} to="/services" className="svc-card group block bg-[#111113] rounded-3xl p-8 md:p-10 border border-zinc-800 transition-all duration-500" style={{ '--accent': svc.accent, '--accent-light': svc.light }}>
                <div className="svc-icon w-16 h-16 rounded-2xl bg-[#18181B] border border-zinc-800 flex items-center justify-center mb-8 text-zinc-100 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3"><Icon icon={svc.icon} width={30} /></div>
                <h3 className="svc-title font-display font-light text-2xl tracking-tight mb-4 transition-colors">{svc.name}</h3>
                <p className="text-zinc-400 leading-relaxed mb-6 font-extralight">{svc.desc}</p>
                <div className="svc-rule h-[2px] w-12 bg-zinc-800 transition-all duration-700 mb-6" />
                <ul className="space-y-2.5 mb-8">
                  {svc.shortFeatures.map((feat) => <li key={feat} className="flex items-center gap-2.5 text-sm text-zinc-400"><Icon icon="solar:check-circle-linear" width={16} className="shrink-0" />{feat}</li>)}
                </ul>
                <div className="svc-cta flex items-center gap-2 text-sm font-medium text-zinc-300 transition-colors">Explore Service <Icon icon="solar:arrow-right-linear" width={16} /></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20"><h2 className="font-display font-semibold text-3xl md:text-5xl tracking-tighter">Our 4-Step Process</h2><p className="text-zinc-400 mt-5 max-w-xl mx-auto leading-relaxed">Predictable delivery. Transparent communication.</p></div>
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-y-14 gap-x-6">
            <div className="hidden md:block absolute top-7 left-[12.5%] right-[12.5%] h-px bg-zinc-800" />
            {steps.map((step) => <div key={step.name} className="relative flex flex-col items-center text-center px-2"><div className="w-14 h-14 rounded-2xl bg-[#18181B] border border-zinc-800 flex items-center justify-center text-zinc-200 relative z-10"><Icon icon={step.icon} width={24} /></div><h3 className="font-display text-lg tracking-tight mt-5 mb-2">{step.name}</h3><p className="text-sm text-zinc-500 leading-relaxed max-w-[220px]">{step.desc}</p></div>)}
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16"><p className="font-mono text-xs text-zinc-500 tracking-widest uppercase mb-4">Testimonials</p><h2 className="font-display font-semibold text-3xl md:text-5xl tracking-tighter">What Our <span className="text-gradient">Clients Say</span></h2><p className="text-zinc-400 mt-5 max-w-xl mx-auto leading-relaxed">Trusted by businesses across India.</p></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t) => <div key={t.name} className="bg-[#111113] rounded-2xl p-6 border border-zinc-800 hover:border-indigo-500/20 hover:shadow-[0_0_30px_rgba(99,102,241,0.07)] transition-all duration-500" style={{ animation: `float 6s ease-in-out ${t.delay} infinite` }}><div className="flex gap-1 mb-4 text-amber-400">{Array.from({ length: 5 }).map((_, i) => <Icon key={i} icon="solar:star-bold" width={16} />)}</div><p className="text-sm text-zinc-300 leading-relaxed font-medium italic">{t.quote}</p><div className="h-px bg-zinc-800 my-5" /><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-zinc-700 flex items-center justify-center font-display text-xs font-semibold text-zinc-200 shrink-0">{t.initials}</div><div><p className="text-sm text-zinc-100 font-semibold">{t.name}</p><p className="text-xs text-zinc-500">{t.role}</p></div></div></div>)}
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-zinc-900 overflow-hidden">
        <p className="text-center font-mono text-xs text-zinc-600 tracking-widest uppercase mb-10">Built with a modern stack</p>
        <div className="flex gap-12 animate-marquee items-center text-zinc-500">{marquee.map((m, i) => <span key={`${m.label}-${i}`} className="flex items-center gap-3 font-display font-semibold text-xl whitespace-nowrap shrink-0"><Icon icon={m.icon} width={24} />{m.label}</span>)}</div>
      </section>

      <section id="contact" className="py-24 md:py-32 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-6"><Icon icon="solar:letter-linear" width={12} /> Contact Us</div>
            <h2 className="font-display font-semibold text-3xl md:text-5xl tracking-tighter leading-tight mb-6">Let's Build the <span className="text-gradient">Digital Future.</span></h2>
            <p className="text-zinc-400 leading-relaxed max-w-md mb-10">Tell us about your project and we'll get back within one business day. No commitment, no pressure - just a conversation about what's possible.</p>
            <div className="space-y-5"><a href="mailto:info@kodeaura7.in" className="flex items-center gap-4 group"><div className="w-11 h-11 rounded-xl bg-[#18181B] border border-zinc-800 flex items-center justify-center text-indigo-400 group-hover:border-indigo-500/40 transition-all"><Icon icon="solar:letter-linear" width={20} /></div><div><p className="text-xs uppercase tracking-widest text-zinc-500 font-mono">Email</p><p className="text-sm text-zinc-200 group-hover:text-indigo-300 transition-colors">info@kodeaura7.in</p></div></a><div className="flex items-center gap-4"><div className="w-11 h-11 rounded-xl bg-[#18181B] border border-zinc-800 flex items-center justify-center text-cyan-400"><Icon icon="solar:map-point-linear" width={20} /></div><div><p className="text-xs uppercase tracking-widest text-zinc-500 font-mono">Location</p><p className="text-sm text-zinc-200">Dehradun, Uttarakhand, India</p></div></div></div>
          </div>
          <ContactForm />
        </div>
      </section>
    </SiteLayout>
  );
}
