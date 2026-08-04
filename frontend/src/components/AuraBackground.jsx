import { useEffect, useRef } from 'react';

const SCRIPT_SRC = 'https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.29/dist/unicornStudio.umd.js';

let scriptLoadingPromise = null;

function loadUnicornStudioScript() {
  if (window.UnicornStudio && typeof window.UnicornStudio.init === 'function') {
    return Promise.resolve();
  }
  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise((resolve) => {
    window.UnicornStudio = { isInitialized: false };
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
  return scriptLoadingPromise;
}

// Renders an animated aura/gradient via UnicornStudio (aura.build embed).
// init() is re-run on every mount so SPA route changes re-hook the fresh DOM node.
export default function AuraBackground({ projectId = 'HzcaAbRLaALMhHJp8gLY', className = '', diffused = false }) {
  const elRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    loadUnicornStudioScript().then(() => {
      if (cancelled) return;
      window.UnicornStudio.init();
      window.UnicornStudio.isInitialized = true;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={`fixed inset-x-0 top-[30px] bottom-0 -z-10 overflow-hidden pointer-events-none ${className}`}>
      {/* Opaque so .aura-tint's mix-blend-mode has something to blend against
          before the canvas has painted — otherwise the raw gradient flashes unblended. */}
      <div className="absolute inset-0 bg-[#09090B]" />
      <div ref={elRef} data-us-project={projectId} className="absolute inset-0" />
      <div className="absolute inset-0 aura-tint" />
      {diffused && <div className="absolute inset-0 backdrop-blur-[70px] bg-[#09090B]/78" />}
    </div>
  );
}
