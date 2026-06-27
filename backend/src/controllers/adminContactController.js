import {
  bulkUpdateContactStatus,
  deleteContact,
  exportAllContacts,
  getContact,
  listContacts,
  updateContactStatus
} from '../services/adminContactService.js';

export async function list(request, response) {
  const { page, limit, search, sort, dir, status } = request.query;
  const result = await listContacts({ page, limit, search, sort, dir, status });
  response.status(200).json(result);
}

export async function getOne(request, response) {
  const contact = await getContact(request.params.id);
  response.status(200).json(contact);
}

export async function updateStatus(request, response) {
  const contact = await updateContactStatus(request.params.id, request.body.status);
  response.status(200).json(contact);
}

export async function bulkStatus(request, response) {
  const { ids, status } = request.body;
  const result = await bulkUpdateContactStatus(ids, status);
  response.status(200).json(result);
}

export async function remove(request, response) {
  await deleteContact(request.params.id);
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
