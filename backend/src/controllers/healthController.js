export function getHealth(_request, response) {
  response.json({ status: 'ok', service: 'kodeaura7-api' });
}
