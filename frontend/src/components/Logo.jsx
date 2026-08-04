import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
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
  const variantHeight = Number(branding?.logos?.[variant]?.height || branding?.logos?.universal?.height || 32) || 32;

  const logoUrl = logoData?.url || '';
  const [loading, setLoading] = useState(Boolean(logoUrl));
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (!logoUrl) {
      setLoading(false);
      setErrored(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    setErrored(false);
    const img = typeof window !== 'undefined' ? new window.Image() : null;
    if (!img) {
      // Not running in browser environment — assume not loading
      if (mounted) setLoading(false);
      return () => { mounted = false; };
    }
    img.onload = () => { if (mounted) setLoading(false); };
    img.onerror = () => { if (mounted) { setLoading(false); setErrored(true); } };
    img.src = resolveAssetUrl(logoUrl);

    return () => { mounted = false; };
  }, [logoUrl]);

  return (
    <Link to={to} className="flex items-center gap-2.5">
      {logoUrl ? (
        loading ? (
          <div
            className="rounded-md bg-zinc-900 animate-pulse"
            style={{ width: 'auto', height: `${variantHeight}px`, minWidth: `${variantHeight}px`, minHeight: `${variantHeight}px` }}
            aria-hidden
          />
        ) : errored ? (
          <>
            <div className="w-6 h-6 rounded-md brand-gradient-bg flex items-center justify-center shadow-[0_0_15px_var(--brand-primary-glow)] shrink-0">
              <div className="w-2.5 h-2.5 bg-[#09090B] rounded-sm" />
            </div>
            <span className="font-display font-semibold tracking-tighter text-lg">{name}</span>
          </>
        ) : (
          <img
            src={resolveAssetUrl(logoUrl)}
            alt={logoData.alt || name}
            className="w-auto object-contain"
            style={{ height: `${variantHeight}px` }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )
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
