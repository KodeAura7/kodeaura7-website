import * as reportsService from '../services/reportsService.js';

// ─── Meta ─────────────────────────────────────────────────────────────────────

export async function getSources(req, res) {
  res.json({ sources: reportsService.getSourcesMeta() });
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export async function listReports(req, res) {
  const { search, folder_id, is_public } = req.query;
  const reports = await reportsService.listReports({
    userId: req.user.id,
    search,
    folderId: folder_id,
    isPublic: is_public !== undefined ? is_public === 'true' : undefined,
  });
  res.json({ reports });
}

export async function getReport(req, res) {
  const report = await reportsService.getReport(req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });
  res.json({ report });
}

export async function createReport(req, res) {
  const { name, description, folderId, config, reportType, isPublic } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  if (!config?.source) return res.status(400).json({ error: 'config.source is required' });
  const report = await reportsService.createReport(
    { name, description, folderId, config, reportType, isPublic },
    req.user.id
  );
  res.status(201).json({ report });
}

export async function updateReport(req, res) {
  const { name, description, folderId, config, reportType, isPublic, isFavorite } = req.body;
  const report = await reportsService.updateReport(
    req.params.id,
    { name, description, folderId, config, reportType, isPublic, isFavorite },
    req.user.id
  );
  if (!report) return res.status(404).json({ error: 'Report not found' });
  res.json({ report });
}

export async function toggleFavorite(req, res) {
  const report = await reportsService.toggleFavoriteReport(req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });
  res.json({ report });
}

export async function deleteReport(req, res) {
  const report = await reportsService.deleteReport(req.params.id, req.user.id, {
    userEmail: req.user.email,
    userName: req.user.name,
    ip: req.ip,
  });
  if (!report) return res.status(404).json({ error: 'Report not found' });
  res.json({ success: true });
}

export async function runReport(req, res) {
  const result = await reportsService.runReport(req.params.id);
  res.json(result);
}

export async function executeConfig(req, res) {
  const { config } = req.body;
  if (!config?.source) return res.status(400).json({ error: 'config.source is required' });
  const data = await reportsService.executeConfig(config);
  res.json({ data });
}

// ─── Folders ──────────────────────────────────────────────────────────────────

export async function listFolders(req, res) {
  const folders = await reportsService.listFolders();
  res.json({ folders });
}

export async function createFolder(req, res) {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const folder = await reportsService.createFolder({ name }, req.user.id);
  res.status(201).json({ folder });
}

export async function deleteFolder(req, res) {
  await reportsService.deleteFolder(req.params.id);
  res.json({ success: true });
}

// ─── Dashboards ───────────────────────────────────────────────────────────────

export async function listDashboards(req, res) {
  const dashboards = await reportsService.listDashboards();
  res.json({ dashboards });
}

export async function getDashboard(req, res) {
  const dashboard = await reportsService.getDashboard(req.params.id);
  if (!dashboard) return res.status(404).json({ error: 'Dashboard not found' });
  res.json({ dashboard });
}

export async function getDefaultDashboard(req, res) {
  const dashboard = await reportsService.getDefaultDashboard();
  if (!dashboard) return res.status(404).json({ error: 'No default dashboard' });
  res.json({ dashboard });
}

export async function createDashboard(req, res) {
  const { name, description, widgets, isDefault } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const dashboard = await reportsService.createDashboard({ name, description, widgets, isDefault }, req.user.id);
  res.status(201).json({ dashboard });
}

export async function updateDashboard(req, res) {
  const { name, description, widgets, isDefault, isFavorite } = req.body;
  const dashboard = await reportsService.updateDashboard(
    req.params.id, { name, description, widgets, isDefault, isFavorite }, req.user.id
  );
  if (!dashboard) return res.status(404).json({ error: 'Dashboard not found' });
  res.json({ dashboard });
}

export async function deleteDashboard(req, res) {
  await reportsService.deleteDashboard(req.params.id);
  res.json({ success: true });
}

export async function getWidgetData(req, res) {
  const { widgetConfig } = req.body;
  if (!widgetConfig?.source) return res.status(400).json({ error: 'widgetConfig.source is required' });
  const data = await reportsService.getWidgetData(widgetConfig);
  res.json({ data });
}
