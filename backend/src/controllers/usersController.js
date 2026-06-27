import { createUser, deleteUser, getUserRollup, listUsers, updateUser } from '../services/usersService.js';

export async function rollup(_request, response) {
  const data = await getUserRollup();
  response.status(200).json(data);
}

export async function list(_request, response) {
  const users = await listUsers();
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
