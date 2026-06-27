import {
  createService,
  deleteService,
  exportServices,
  getPublicServices,
  getServiceById,
  getServiceHistory,
  importServices,
  listAllServices,
  setServiceEnabled,
  updateService,
  updateServiceOrder
} from '../services/servicesService.js';
import { buildWhereClause, getListView } from '../services/listViewService.js';

async function resolveLvWhere(listViewId, userId) {
  if (!listViewId) return null;
  try {
    const lv = await getListView(listViewId, userId);
    return buildWhereClause(lv.filters, lv.filter_logic, 'services');
  } catch { return null; }
}

export async function publicList(_req, res) {
  const items = await getPublicServices();
  res.status(200).json(items);
}

export async function adminListAll(req, res) {
  const { list_view_id } = req.query;
  const lvWhere = await resolveLvWhere(list_view_id, req.user?.sub);
  const items = await listAllServices({ lvWhere });
  res.status(200).json(items);
}

export async function adminGetOne(req, res) {
  const item = await getServiceById(req.params.id);
  res.status(200).json(item);
}

export async function adminCreate(req, res) {
  const item = await createService(req.body);
  res.status(201).json(item);
}

export async function adminUpdate(req, res) {
  const item = await updateService(req.params.id, req.body, req.user.sub);
  res.status(200).json(item);
}

export async function adminGetHistory(req, res) {
  const history = await getServiceHistory(req.params.id);
  res.status(200).json(history);
}

export async function adminDelete(req, res) {
  await deleteService(req.params.id);
  res.status(204).end();
}

export async function adminSetEnabled(req, res) {
  const result = await setServiceEnabled(req.params.id, req.body.enabled);
  res.status(200).json(result);
}

export async function adminSetOrder(req, res) {
  const result = await updateServiceOrder(req.params.id, req.body.sort_order);
  res.status(200).json(result);
}

export async function adminExportCsv(req, res) {
  const ids = req.query.ids ? req.query.ids.split(',').filter(Boolean) : [];
  const rows = await exportServices(ids.length ? ids : null);

  const header = 'slug,num,name,icon,accent,light,description,p1,p2,features,metrics,sort_order,enabled';
  const csv = [
    header,
    ...rows.map((r) =>
      [
        csvCell(r.slug),
        csvCell(r.num),
        csvCell(r.name),
        csvCell(r.icon),
        csvCell(r.accent),
        csvCell(r.light),
        csvCell(r.description),
        csvCell(r.p1),
        csvCell(r.p2),
        csvCell(JSON.stringify(r.features)),
        csvCell(JSON.stringify(r.metrics)),
        csvCell(r.sort_order),
        csvCell(r.enabled)
      ].join(',')
    )
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="services.csv"');
  res.status(200).send(csv);
}

export async function adminImportCsv(req, res) {
  const { csv } = req.body;
  if (!csv || typeof csv !== 'string')
    throw Object.assign(new Error('CSV data is required.'), { status: 400 });
  const rows = parseCsvRows(csv);
  const result = await importServices(rows);
  res.status(200).json(result);
}

function csvCell(value) {
  const str = String(value ?? '').replace(/"/g, '""');
  return `"${str}"`;
}

function parseCsvRows(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, '_'));
  return lines
    .slice(1)
    .map((line) => {
      const values = splitCsvLine(line);
      return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
    })
    .filter((row) => Object.values(row).some((v) => v));
}

function splitCsvLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else current += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { cells.push(current); current = ''; }
      else current += ch;
    }
  }
  cells.push(current);
  return cells;
}
