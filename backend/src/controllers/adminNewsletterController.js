import { deleteSubscriber, exportAllSubscribers, listSubscribers } from '../services/adminNewsletterService.js';
import { getListView, buildWhereClause } from '../services/listViewService.js';

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
  await deleteSubscriber(request.params.id);
  response.status(200).json({ message: 'Subscriber deleted.' });
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
