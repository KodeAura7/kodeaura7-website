import { deleteContact, exportAllContacts, listContacts } from '../services/adminContactService.js';

export async function list(request, response) {
  const { page, limit, search, sort, dir } = request.query;
  const result = await listContacts({ page, limit, search, sort, dir });
  response.status(200).json(result);
}

export async function remove(request, response) {
  await deleteContact(request.params.id);
  response.status(200).json({ message: 'Contact deleted.' });
}

export async function exportCsv(request, response) {
  const rows = await exportAllContacts();
  const header = 'Name,Email,Service,Message,Source,Status,Created At';
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
        csvCell(r.created_at?.toISOString?.() ?? r.created_at)
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
