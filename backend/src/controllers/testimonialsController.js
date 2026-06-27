import {
  getPublicTestimonials,
  getMyTestimonials,
  submitTestimonial,
  updateMyTestimonial,
  deleteMyTestimonial,
  listAllTestimonials,
  setVisibility,
  updateOrder,
  exportAllTestimonials,
  importTestimonials
} from '../services/testimonialsService.js';

export async function publicList(_request, response) {
  const items = await getPublicTestimonials();
  response.status(200).json(items);
}

// Returns array — 0 or 1 for customers, many for admins
export async function myTestimonials(request, response) {
  const items = await getMyTestimonials(request.user.sub);
  response.status(200).json(items);
}

export async function submit(request, response) {
  const item = await submitTestimonial(request.user.sub, request.body, request.user);
  response.status(201).json(item);
}

export async function updateOwn(request, response) {
  const item = await updateMyTestimonial(request.params.id, request.user.sub, request.body, request.user);
  response.status(200).json(item);
}

export async function deleteOwn(request, response) {
  await deleteMyTestimonial(request.params.id, request.user.sub);
  response.status(204).end();
}

export async function adminList(_request, response) {
  const items = await listAllTestimonials();
  response.status(200).json(items);
}

export async function updateVisibility(request, response) {
  const result = await setVisibility(request.params.id, request.body.visible, request.user.sub);
  response.status(200).json(result);
}

export async function updateSortOrder(request, response) {
  const result = await updateOrder(request.params.id, request.body.sort_order);
  response.status(200).json(result);
}

export async function exportCsv(_request, response) {
  const rows = await exportAllTestimonials();
  const header = 'Name,Designation,Rating,Review,Visible,Sort Order,Submitted By,Submitted Email,Created At';
  const csv = [
    header,
    ...rows.map((r) =>
      [
        csvCell(r.name),
        csvCell(r.designation),
        csvCell(r.rating),
        csvCell(r.review),
        csvCell(r.visible),
        csvCell(r.sort_order),
        csvCell(r.user_name),
        csvCell(r.user_email),
        csvCell(r.created_at?.toISOString?.() ?? r.created_at)
      ].join(',')
    )
  ].join('\n');

  response.setHeader('Content-Type', 'text/csv');
  response.setHeader('Content-Disposition', 'attachment; filename="testimonials.csv"');
  response.status(200).send(csv);
}

export async function importCsv(request, response) {
  const { csv } = request.body;
  if (!csv || typeof csv !== 'string') throw Object.assign(new Error('CSV data is required.'), { status: 400 });

  const rows = parseCsvRows(csv);
  const result = await importTestimonials(rows, request.user.sub);
  response.status(200).json(result);
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
