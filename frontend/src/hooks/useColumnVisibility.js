import { useState } from 'react';

export function useColumnVisibility(storageKey, columns) {
  const [visibleCols, setVisibleCols] = useState(() => {
    try {
      const saved = localStorage.getItem(`ka7:cols:${storageKey}`);
      if (saved) return new Set(JSON.parse(saved));
    } catch { /* ignore */ }
    return new Set(columns.filter((c) => c.default !== false).map((c) => c.key));
  });

  const toggle = (key) => {
    setVisibleCols((prev) => {
      if (prev.has(key) && prev.size <= 1) return prev;
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      localStorage.setItem(`ka7:cols:${storageKey}`, JSON.stringify([...next]));
      return next;
    });
  };

  const reset = () => {
    const defaults = new Set(columns.filter((c) => c.default !== false).map((c) => c.key));
    setVisibleCols(defaults);
    localStorage.removeItem(`ka7:cols:${storageKey}`);
  };

  const isVisible = (key) => visibleCols.has(key);

  return { visibleCols, toggle, reset, isVisible };
}
