import { createUser, deleteUser, getUserRollup, listUsers, updateUser } from '../services/usersService.js';
import { getListView, buildWhereClause } from '../services/listViewService.js';

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
  response.status(201).json(user);
}

export async function update(request, response) {
  const user = await updateUser(request.params.id, request.body);
  response.status(200).json(user);
}

export async function remove(request, response) {
  await deleteUser(request.params.id, request.user.sub);
  response.status(200).json({ message: 'User deleted.' });
}
