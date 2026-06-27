import { getStats } from '../services/dashboardService.js';

export async function getDashboard(_request, response) {
  const data = await getStats();
  response.status(200).json(data);
}
