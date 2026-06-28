import {
  bulkUpdateContactStatus,
  deleteContact,
  exportAllContacts,
  getContact,
  listContacts,
  updateContactStatus
} from '../services/adminContactService.js';
import { getListView, buildWhereClause } from '../services/listViewService.js';
import { auditLog } from '../services/auditLogService.js';

function actor(req) {
  return { userId: req.user?.sub, userName: req.user?.name, userEmail: req.user?.email, ipAddress: req.ip };
}

async function resolveLvWhere(listViewId, userId, objectName) {
  if (!listViewId) return null;
  try {
    const lv = await getListView(listViewId, userId);
    return buildWhereClause(lv.filters, lv.filter_logic, objectName);
  } catch { return null; }
}

export async function list(request, response) {
  const { page, limit, search, sort, dir, status, list_view_id } = request.query;
  const lvWhere = await resolveLvWhere(list_view_id, request.user?.sub, 'contacts');
  const result = await listContacts({ page, limit, search, sort, dir, status, lvWhere });
  response.status(200).json(result);
}

export async function getOne(request, response) {
  const contact = await getContact(request.params.id);
  response.status(200).json(contact);
}

export async function updateStatus(request, response) {
  const contact = await updateContactStatus(request.params.id, request.body.status);
  auditLog({
    ...actor(request),
    action: 'contact.status_update',
    objectType: 'contact',
    objectId: contact.id,
    objectLabel: contact.name || contact.email,
    details: { status: request.body.status },
  });
  response.status(200).json(contact);
}

export async function bulkStatus(request, response) {
  const { ids, status } = request.body;
  const result = await bulkUpdateContactStatus(ids, status);
  auditLog({
    ...actor(request),
    action: 'contact.bulk_status_update',
    objectType: 'contact',
    details: { ids, status, count: ids.length },
  });
  response.status(200).json(result);
}

export async function remove(request, response) {
  const contact = await getContact(request.params.id).catch(() => null);
  await deleteContact(request.params.id);
  auditLog({
    ...actor(request),
    action: 'contact.delete',
    objectType: 'contact',
    objectId: request.params.id,
    objectLabel: contact?.name || contact?.email,
  });
  response.status(200).json({ message: 'Contact deleted.' });
}

export async function exportCsv(request, response) {
  const rows = await exportAllContacts();
  const header = 'Name,Email,Service,Message,Source,Status,Created At,Updated At';
  const csv = [
    header,
    ...rows.map((r) =>
      [
        csvCell(r.name),
        csvCell(r.email),
        csvCell(r.service),
        csvCell(r.message),
        csvCell(r.source),
        csvCell(r.status),
        csvCell(r.created_at?.toISOString?.() ?? r.created_at),
        csvCell(r.updated_at?.toISOString?.() ?? r.updated_at)
      ].join(',')
    )
  ].join('\n');

  response.setHeader('Content-Type', 'text/csv');
  response.setHeader('Content-Disposition', 'attachment; filename="contacts.csv"');
  response.status(200).send(csv);
}

function csvCell(value) {
  const str = String(value ?? '').replace(/"/g, '""');
  return `"${str}"`;
}
