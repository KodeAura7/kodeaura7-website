import { Link } from 'react-router-dom';
import { useSiteData } from '../contexts/SiteDataContext';
import { resolveAssetUrl } from '../utils/assetUrl';

function getPreferredTheme() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function Logo({ to = '/', variant = 'universal' }) {
  const { branding } = useSiteData();
  const theme = getPreferredTheme();

  const themeLogo = branding?.logos?.[variant]?.[theme];
  const universalLogo = branding?.logos?.universal?.[theme];
  const legacyVariant = branding?.logos?.[variant];
  const legacyUniversal = branding?.logos?.universal;

  const logoData =
    themeLogo?.url
      ? themeLogo
      : universalLogo?.url
        ? universalLogo
        : legacyVariant?.url
          ? legacyVariant
          : legacyUniversal?.url
            ? legacyUniversal
            : null;

  const name = branding?.name || 'KodeAura7';

  return (
    <Link to={to} className="flex items-center gap-2.5">
      {logoData?.url ? (
        <img
          src={resolveAssetUrl(logoData.url)}
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
