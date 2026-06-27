import { deleteSubscriber, exportAllSubscribers, listSubscribers } from '../services/adminNewsletterService.js';

export async function list(request, response) {
  const { page, limit, search, sort, dir } = request.query;
  const result = await listSubscribers({ page, limit, search, sort, dir });
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
