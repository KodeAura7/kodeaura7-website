import { Link } from 'react-router-dom';
import Icon from './Icon';
import Logo from './Logo';
import NewsletterForm from './NewsletterForm';
import { useSiteData } from '../contexts/SiteDataContext';

export default function Footer() {
  const { services, socialLinks } = useSiteData();
  const enabledServices = services.filter((s) => s.enabled);
  const enabledSocials = socialLinks.filter((s) => s.enabled).sort((a, b) => a.sort_order - b.sort_order);

  return (
    <footer className="bg-[#09090B] border-t border-zinc-900 pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-10 mb-16">
          <div className="col-span-2 md:col-span-5">
            <div className="mb-5">
              <Logo />
            </div>
            <p className="font-display text-xl text-zinc-300 tracking-tight mb-6 max-w-xs">We Build the Digital Future.</p>
            <div className="flex gap-3">
              {enabledSocials.map((s) => (
                <a key={s.id} href={s.url} title={s.name} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:border-zinc-600 transition-all">
                  <Icon icon={s.icon} width={17} />
                </a>
              ))}
            </div>
          </div>
          <div className="md:col-span-3">
            <p className="text-xs uppercase tracking-widest text-zinc-500 font-mono mb-5">Services</p>
            <ul className="space-y-3 text-sm text-zinc-400">
              {enabledServices.map((svc) => (
                <li key={svc.id || svc.slug}>
                  <Link to="/services" className="hover:text-zinc-100 transition-colors">
                    {svc.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-widest text-zinc-500 font-mono mb-5">Company</p>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li><Link to="/about" className="hover:text-zinc-100 transition-colors">About</Link></li>
              <li><Link to="/portfolio" className="hover:text-zinc-100 transition-colors">Portfolio</Link></li>
              <li><Link to="/#contact" className="hover:text-zinc-100 transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div className="col-span-2 md:col-span-2">
            <p className="text-xs uppercase tracking-widest text-zinc-500 font-mono mb-5">Newsletter</p>
            <NewsletterForm />
          </div>
        </div>
        <div className="border-t border-zinc-900 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
          <p>© 2025 KodeAura7. All rights reserved. · info@kodeaura7.in</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-zinc-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-400 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
