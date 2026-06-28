import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi } from '../services/adminApi';

export function useListViews(objectName) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [views, setViews] = useState([]);
  const [recentViews, setRecentViews] = useState([]);
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
      adminApi.getRecentListViews(objectName),
    ])
      .then(([lvs, { fields }, recents]) => {
        setViews(lvs);
        setFieldConfig(fields || []);
        setRecentViews(recents || []);
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
    // Record recent access (fire and forget)
    if (id) adminApi.recordListViewRecent(id).catch(() => null);
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

  const togglePin = useCallback(async (id) => {
    await adminApi.toggleListViewPin(id);
    await load();
  }, [load]);

  return {
    views,
    recentViews,
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
    togglePin,
    reload: load,
  };
}
