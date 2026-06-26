import { getMe, loginUser } from '../services/authService.js';

export async function login(request, response) {
  const result = await loginUser(request.body);
  response.status(200).json(result);
}

export async function logout(_request, response) {
  response.status(200).json({ message: 'Logged out.' });
}

export async function me(request, response) {
  const user = await getMe(request.user.sub);
  response.status(200).json(user);
}
