import {
  OBJECT_CONFIGS,
  createListView,
  deleteListView,
  duplicateListView,
  getListView,
  getListViewsForUser,
  getRecentViews,
  recordRecentView,
  setDefault,
  toggleFavorite,
  togglePin,
  updateListView,
} from '../services/listViewService.js';

function userId(req) {
  return req.user?.sub;
}

export async function list(req, res) {
  const objectName = req.query.object;
  if (!objectName) return res.status(400).json({ message: 'object query param is required.' });
  const views = await getListViewsForUser(objectName, userId(req));
  res.json(views);
}

export async function getOne(req, res) {
  const lv = await getListView(req.params.id, userId(req));
  res.json(lv);
}

export async function create(req, res) {
  const { objectName, name, description, filterLogic, filters } = req.body;
  const lv = await createListView({ objectName, name, description, filterLogic, filters, userId: userId(req) });
  res.status(201).json(lv);
}

export async function update(req, res) {
  const { name, description, filterLogic, filters } = req.body;
  const lv = await updateListView(req.params.id, { name, description, filterLogic, filters }, userId(req));
  res.json(lv);
}

export async function remove(req, res) {
  await deleteListView(req.params.id, userId(req));
  res.json({ message: 'List view deleted.' });
}

export async function duplicate(req, res) {
  const lv = await duplicateListView(req.params.id, userId(req));
  res.status(201).json(lv);
}

export async function makeDefault(req, res) {
  const lv = await setDefault(req.params.id, userId(req));
  res.json(lv);
}

export async function favorite(req, res) {
  const lv = await toggleFavorite(req.params.id, userId(req));
  res.json(lv);
}

export async function pin(req, res) {
  const nowPinned = await togglePin(req.params.id, userId(req));
  res.json({ pinned: nowPinned });
}

export async function recents(req, res) {
  const objectName = req.query.object;
  if (!objectName) return res.status(400).json({ message: 'object query param is required.' });
  const views = await getRecentViews(userId(req), objectName);
  res.json(views);
}

export async function recordRecent(req, res) {
  await recordRecentView(req.params.id, userId(req));
  res.json({ ok: true });
}

export async function getFieldConfig(req, res) {
  const objectName = req.query.object;
  if (!objectName || !OBJECT_CONFIGS[objectName]) {
    return res.status(400).json({ message: 'Unknown object.' });
  }
  const fields = Object.entries(OBJECT_CONFIGS[objectName].fields).map(([name, def]) => ({
    name,
    label: def.label,
    type: def.type,
    options: def.options ?? [],
  }));
  res.json({ fields });
}
