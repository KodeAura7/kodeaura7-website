import {
  createSocialLink,
  deleteSocialLink,
  exportAllSocialLinks,
  getPublicSocialLinks,
  listAllSocialLinks,
  setSocialLinkEnabled,
  updateSocialLink
} from '../services/socialLinksService.js';

export async function publicList(_req, res) {
  const items = await getPublicSocialLinks();
  res.status(200).json(items);
}

export async function adminListAll(_req, res) {
  const items = await listAllSocialLinks();
  res.status(200).json(items);
}

export async function adminCreate(req, res) {
  const item = await createSocialLink(req.body);
  res.status(201).json(item);
}

export async function adminUpdate(req, res) {
  const item = await updateSocialLink(req.params.id, req.body);
  res.status(200).json(item);
}

export async function adminDelete(req, res) {
  await deleteSocialLink(req.params.id);
  res.status(204).end();
}

export async function adminSetEnabled(req, res) {
  const result = await setSocialLinkEnabled(req.params.id, req.body.enabled);
  res.status(200).json(result);
}

export async function adminExportCsv(_req, res) {
  const rows = await exportAllSocialLinks();
  const header = 'name,url,icon,enabled,sort_order';
  const csv = [
    header,
    ...rows.map((r) => [csvCell(r.name), csvCell(r.url), csvCell(r.icon), csvCell(r.enabled), csvCell(r.sort_order)].join(','))
  ].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="social-links.csv"');
  res.status(200).send(csv);
}

function csvCell(v) {
  return `"${String(v ?? '').replace(/"/g, '""')}"`;
}
