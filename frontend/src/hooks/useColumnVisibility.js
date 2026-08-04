import { useState } from 'react';

const STORAGE_KEY = (key) => `ka7:cols:${key}`;

function loadState(storageKey, columns) {
  const defaultVisible = new Set(columns.filter((c) => c.default !== false).map((c) => c.key));
  const defaultOrder   = columns.map((c) => c.key);
  try {
    const raw = localStorage.getItem(STORAGE_KEY(storageKey));
    if (!raw) return { order: defaultOrder, visible: defaultVisible };
    const parsed = JSON.parse(raw);
    // v1 format: plain array of visible keys
    if (Array.isArray(parsed)) {
      return { order: defaultOrder, visible: new Set(parsed) };
    }
    // v2 format: { v: 2, order: [...], visible: [...] }
    if (parsed?.v === 2 && Array.isArray(parsed.order) && Array.isArray(parsed.visible)) {
      const knownKeys = new Set(columns.map((c) => c.key));
      const savedOrder = parsed.order.filter((k) => knownKeys.has(k));
      for (const c of columns) {
        if (!savedOrder.includes(c.key)) savedOrder.push(c.key);
      }
      return { order: savedOrder, visible: new Set(parsed.visible.filter((k) => knownKeys.has(k))) };
    }
  } catch { /* ignore */ }
  return { order: defaultOrder, visible: defaultVisible };
}

function saveState(storageKey, order, visible) {
  localStorage.setItem(
    STORAGE_KEY(storageKey),
    JSON.stringify({ v: 2, order, visible: [...visible] })
  );
}

export function useColumnVisibility(storageKey, columns) {
  const init = loadState(storageKey, columns);
  const [order,   setOrder]   = useState(() => init.order);
  const [visible, setVisible] = useState(() => init.visible);

  const toggle = (key) => {
    setVisible((prev) => {
      if (prev.has(key) && prev.size <= 1) return prev;
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      saveState(storageKey, order, next);
      return next;
    });
  };

  const reorder = (dragKey, dropKey) => {
    setOrder((prev) => {
      const from = prev.indexOf(dragKey);
      const to   = prev.indexOf(dropKey);
      if (from === -1 || to === -1 || from === to) return prev;
      const next = [...prev];
      next.splice(from, 1);
      next.splice(to, 0, dragKey);
      saveState(storageKey, next, visible);
      return next;
    });
  };

  const reset = () => {
    const defaultOrder   = columns.map((c) => c.key);
    const defaultVisible = new Set(columns.filter((c) => c.default !== false).map((c) => c.key));
    setOrder(defaultOrder);
    setVisible(defaultVisible);
    localStorage.removeItem(STORAGE_KEY(storageKey));
  };

  const allOrdered     = order.map((k) => columns.find((c) => c.key === k)).filter(Boolean);
  const visibleOrdered = allOrdered.filter((c) => visible.has(c.key));

  return {
    visibleCols: visible,    // kept for .has() calls still in use
    visibleOrdered,          // visible cols in user order — use for table rendering
    allOrdered,              // all cols in user order — use for column picker
    toggle,
    reorder,
    reset,
    isVisible: (k) => visible.has(k),
  };
}
