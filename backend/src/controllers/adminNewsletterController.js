import { deleteSubscriber, exportAllSubscribers, getSubscriber, listSubscribers } from '../services/adminNewsletterService.js';
import { getListView, buildWhereClause } from '../services/listViewService.js';
import { auditLog } from '../services/auditLogService.js';

async function resolveLvWhere(listViewId, userId, objectName) {
  if (!listViewId) return null;
  try {
    const lv = await getListView(listViewId, userId);
    return buildWhereClause(lv.filters, lv.filter_logic, objectName);
  } catch { return null; }
}

export async function list(request, response) {
  const { page, limit, search, sort, dir, list_view_id } = request.query;
  const lvWhere = await resolveLvWhere(list_view_id, request.user?.sub, 'newsletter');
  const result = await listSubscribers({ page, limit, search, sort, dir, lvWhere });
  response.status(200).json(result);
}

export async function remove(request, response) {
  const sub = await getSubscriber(request.params.id).catch(() => null);
  await deleteSubscriber(request.params.id);
  auditLog({
    userId: request.user?.sub, userName: request.user?.name, userEmail: request.user?.email,
    ipAddress: request.ip,
    action: 'newsletter.delete',
    objectType: 'newsletter',
    objectId: request.params.id,
    objectLabel: sub?.email,
  });
  response.status(200).json({ message: 'Subscriber deleted.' });
}

export async function bulkDelete(request, response) {
  const { ids } = request.body;
  if (!Array.isArray(ids) || ids.length === 0)
    return response.status(400).json({ message: 'ids must be a non-empty array.' });
  let deleted = 0;
  for (const id of ids) {
    try { await deleteSubscriber(id); deleted++; } catch { /* skip */ }
  }
  auditLog({
    userId: request.user?.sub, userName: request.user?.name, userEmail: request.user?.email,
    ipAddress: request.ip,
    action: 'newsletter.bulk_delete', objectType: 'newsletter', details: { count: deleted },
  });
  response.json({ deleted });
}

export async function exportCsv(request, response) {
  const rows = await exportAllSubscribers();
  const header = 'Email,Source,Subscribed At';
  const csv = [
    header,
    ...rows.map((r) =>
      [
        csvCell(r.email),
        csvCell(r.source),
        csvCell(r.subscribed_at?.toISOString?.() ?? r.subscribed_at)
      ].join(',')
    )
  ].join('\n');

  response.setHeader('Content-Type', 'text/csv');
  response.setHeader('Content-Disposition', 'attachment; filename="newsletter.csv"');
  response.status(200).send(csv);
}

function csvCell(value) {
  const str = String(value ?? '').replace(/"/g, '""');
  return `"${str}"`;
}
