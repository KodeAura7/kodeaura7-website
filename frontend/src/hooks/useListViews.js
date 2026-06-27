import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../services/adminApi';

/**
 * Manages list views for a given object.
 * - Loads all views (system + personal) on mount
 * - Syncs active view with `?lv=<id>` URL param
 * - Falls back to the default system view on first load
 */
export function useListViews(objectName) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [views, setViews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fieldConfig, setFieldConfig] = useState([]);
  const didInit = useRef(false);

  const lvIdFromUrl = searchParams.get('lv') || null;
  const [activeId, setActiveIdState] = useState(lvIdFromUrl);

  const load = useCallback(() => {
    setLoading(true);
    return Promise.all([
      adminApi.getListViews(objectName),
      adminApi.getListViewFields(objectName),
    ])
      .then(([lvs, { fields }]) => {
        setViews(lvs);
        setFieldConfig(fields || []);
        // On first mount: if no URL param, find & activate the default view
        if (!didInit.current) {
          didInit.current = true;
          if (!lvIdFromUrl) {
            const def =
              lvs.find((v) => v.is_system && v.is_default) ||
              lvs.find((v) => v.is_default) ||
              lvs[0];
            if (def) {
              setActiveIdState(def.id);
              setSearchParams((p) => {
                const next = new URLSearchParams(p);
                next.set('lv', def.id);
                return next;
              }, { replace: true });
            }
          }
        }
      })
      .finally(() => setLoading(false));
  }, [objectName]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  // Keep local activeId in sync when URL changes externally (browser back/fwd)
  useEffect(() => {
    if (lvIdFromUrl && lvIdFromUrl !== activeId) setActiveIdState(lvIdFromUrl);
  }, [lvIdFromUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const setActiveView = useCallback((id) => {
    setActiveIdState(id);
    setSearchParams((p) => {
      const next = new URLSearchParams(p);
      if (id) next.set('lv', id);
      else next.delete('lv');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const activeView = views.find((v) => v.id === activeId) ?? views.find((v) => v.is_system && v.is_default) ?? null;

  const createView = useCallback(async (data) => {
    const lv = await adminApi.createListView({ ...data, objectName });
    await load();
    setActiveView(lv.id);
    return lv;
  }, [objectName, load, setActiveView]);

  const updateView = useCallback(async (id, data) => {
    const lv = await adminApi.updateListView(id, data);
    await load();
    return lv;
  }, [load]);

  const deleteView = useCallback(async (id) => {
    await adminApi.deleteListView(id);
    // If we just deleted the active view, reset to default
    if (id === activeId) {
      const def = views.find((v) => v.is_system && v.is_default && v.id !== id) ?? views.find((v) => v.id !== id);
      setActiveView(def?.id ?? null);
    }
    await load();
  }, [activeId, views, load, setActiveView]);

  const duplicateView = useCallback(async (id) => {
    const lv = await adminApi.duplicateListView(id);
    await load();
    setActiveView(lv.id);
    return lv;
  }, [load, setActiveView]);

  const setDefault = useCallback(async (id) => {
    await adminApi.setListViewDefault(id);
    await load();
  }, [load]);

  const toggleFavorite = useCallback(async (id) => {
    await adminApi.toggleListViewFavorite(id);
    await load();
  }, [load]);

  return {
    views,
    activeId,
    activeView,
    loading,
    fieldConfig,
    setActiveView,
    createView,
    updateView,
    deleteView,
    duplicateView,
    setDefault,
    toggleFavorite,
    reload: load,
  };
}
