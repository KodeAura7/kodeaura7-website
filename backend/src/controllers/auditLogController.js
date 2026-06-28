import { getAuditLogs } from '../services/auditLogService.js';

export async function list(req, res) {
  const { page = 1, limit = 50, action, objectType, userId } = req.query;
  const result = await getAuditLogs({ page, limit, action, objectType, userId });
  res.status(200).json(result);
}
