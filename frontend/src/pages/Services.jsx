import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CTA from '../components/CTA';
import Icon from '../components/Icon';
import SEO from '../components/SEO';
import SectionHero from '../components/SectionHero';
import SiteLayout from '../layouts/SiteLayout';
import { services as staticServices } from '../constants/site';
import { api } from '../services/api';

export default function Services() {
  const [services, setServices] = useState(null);

  useEffect(() => {
    api.services()
      .then((data) => setServices(data.length ? data : staticServices))
      .catch(() => setServices(staticServices));
  }, []);

  const list = services ?? staticServices;

  return (
    <SiteLayout>
      <SEO title="Services" path="/services" description="Web development, Salesforce CRM, UI/UX design, and digital advertising services by KodeAura7." />
      <SectionHero eyebrow="What We Do" title="Services Designed to" gradient="Scale Your Business" description="Four specialised disciplines. One unified vision. Engineered for growth.">
        <div className="fade-up delay-3 flex flex-wrap items-center justify-center gap-3">
          {list.map((svc) => (
            <a
              key={svc.id}
              href={`#${svc.slug || svc.id}`}
              className="rounded-full px-5 py-2 text-sm font-medium bg-[#111113] border border-zinc-800 text-zinc-300 hover:border-zinc-600 transition-all"
            >
              {svc.name}
            </a>
          ))}
        </div>
      </SectionHero>

      {list.map((service, index) => {
        const reverse = index % 2 === 1;
        const activeFeatures = (service.features || []).filter((f) => f.enabled !== false);
        const anchor = service.slug || service.id;

        return (
          <section key={service.id} id={anchor} className="py-20 md:py-28 border-t border-zinc-900 scroll-mt-24">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className={reverse ? 'lg:order-2' : 'lg:order-1'}>
                <span className="font-mono text-xs" style={{ color: service.accent }}>{service.num}</span>
                <h2 className="font-display font-semibold text-3xl md:text-4xl tracking-tighter text-zinc-100 mt-3 mb-4">{service.name}</h2>
                <div className="w-12 h-1 rounded-full mb-6" style={{ background: `linear-gradient(to right,${service.accent},transparent)` }} />
                <div className="space-y-4 text-zinc-400 leading-relaxed">
                  {service.p1 ? <p>{service.p1}</p> : null}
                  {service.p2 ? <p>{service.p2}</p> : null}
                </div>
                {activeFeatures.length > 0 ? (
                  <>
                    <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mt-8 mb-4">What's Included:</p>
                    <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                      {activeFeatures.map((feat) => {
                        const label = typeof feat === 'string' ? feat : feat.label;
                        return (
                          <li key={label} className="flex items-center gap-3 text-sm text-zinc-300">
                            <span
                              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                              style={{
                                background: `color-mix(in srgb,${service.accent} 12%,transparent)`,
                                border: `1px solid color-mix(in srgb,${service.accent} 22%,transparent)`,
                                color: service.accent
                              }}
                            >
                              <Icon icon="solar:check-circle-linear" width={14} />
                            </span>
                            {label}
                          </li>
                        );
                      })}
                    </ul>
                  </>
                ) : null}
                <Link
                  to="/#contact"
                  className="inline-flex items-center gap-2 text-sm font-medium mt-8 transition-opacity hover:opacity-80"
                  style={{ color: service.accent }}
                >
                  Start a {service.name} Project <Icon icon="solar:arrow-right-linear" width={16} />
                </Link>
              </div>

              <div className={reverse ? 'lg:order-1' : 'lg:order-2'}>
                <div
                  className="svc-visual relative overflow-hidden bg-[#111113] rounded-3xl p-8 border border-zinc-800 transition-all duration-700"
                  style={{ '--accent': service.accent }}
                >
                  <div
                    className="absolute inset-0"
                    style={{ background: `linear-gradient(to bottom right,color-mix(in srgb,${service.accent} 6%,transparent),transparent 60%)` }}
                  />
                  <div className="relative">
                    <div className="svc-bigicon w-20 h-20 rounded-2xl bg-[#18181B] border border-zinc-800 flex items-center justify-center text-zinc-100 mb-8 transition-all duration-500">
                      <Icon icon={service.icon || 'solar:code-square-linear'} width={40} />
                    </div>
                    {service.metrics && service.metrics.length > 0 ? (
                      <div className="grid grid-cols-3 gap-3 mb-8">
                        {service.metrics.map((m) => (
                          <div key={m.label} className="bg-[#18181B] border border-zinc-800 rounded-xl px-3 py-3 text-center">
                            <p className="font-display text-lg md:text-xl font-semibold text-zinc-100 leading-tight">{m.value}</p>
                            <p className="text-[11px] text-zinc-500 mt-1 leading-tight">{m.label}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <div className="svc-rule h-[2px] w-12 bg-zinc-800 transition-all duration-700" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })}

      <CTA title="Not Sure Which Service You Need?" body="Book a free 30-minute consultation. We'll map out exactly what your business needs." primary="Book a Free Call" secondary="See Our Work" />
    </SiteLayout>
  );
}
