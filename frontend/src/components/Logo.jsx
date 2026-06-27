import { Link } from 'react-router-dom';
import { useSiteData } from '../contexts/SiteDataContext';

export default function Logo({ to = '/', variant = 'universal' }) {
  const { branding } = useSiteData();

  const logoData =
    branding?.logos?.[variant]?.url
      ? branding.logos[variant]
      : branding?.logos?.universal?.url
        ? branding.logos.universal
        : null;

  const name = branding?.name || 'KodeAura7';

  return (
    <Link to={to} className="flex items-center gap-2.5">
      {logoData?.url ? (
        <img
          src={logoData.url}
          alt={logoData.alt || name}
          className="h-8 w-auto object-contain"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      ) : (
        <>
          <div className="w-6 h-6 rounded-md brand-gradient-bg flex items-center justify-center shadow-[0_0_15px_var(--brand-primary-glow)] shrink-0">
            <div className="w-2.5 h-2.5 bg-[#09090B] rounded-sm" />
          </div>
          <span className="font-display font-semibold tracking-tighter text-lg">{name}</span>
        </>
      )}
    </Link>
  );
}
