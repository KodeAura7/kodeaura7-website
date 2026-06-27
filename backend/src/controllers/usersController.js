import { createUser, deleteUser, getUserById, getUserRollup, listUsers, updateUser } from '../services/usersService.js';
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

export async function rollup(_request, response) {
  const data = await getUserRollup();
  response.status(200).json(data);
}

export async function list(request, response) {
  const { list_view_id } = request.query;
  const lvWhere = await resolveLvWhere(list_view_id, request.user?.sub, 'users');
  const users = await listUsers({ lvWhere });
  response.status(200).json(users);
}

export async function create(request, response) {
  const user = await createUser(request.body);
  auditLog({ ...actor(request), action: 'admin_user.create', objectType: 'admin_user', objectId: user.id, objectLabel: user.name || user.email });
  response.status(201).json(user);
}

export async function update(request, response) {
  const user = await updateUser(request.params.id, request.body);
  auditLog({ ...actor(request), action: 'admin_user.update', objectType: 'admin_user', objectId: user.id, objectLabel: user.name || user.email });
  response.status(200).json(user);
}

export async function remove(request, response) {
  const target = await getUserById(request.params.id).catch(() => null);
  await deleteUser(request.params.id, request.user.sub);
  auditLog({
    ...actor(request),
    action: 'admin_user.delete',
    objectType: 'admin_user',
    objectId: request.params.id,
    objectLabel: target?.name || target?.email,
  });
  response.status(200).json({ message: 'User deleted.' });
}
