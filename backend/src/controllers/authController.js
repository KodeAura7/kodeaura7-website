import {
  forgotPassword as forgotPasswordService,
  getMe,
  loginUser,
  resetPassword as resetPasswordService
} from '../services/authService.js';

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

export async function forgotPassword(request, response) {
  await forgotPasswordService(request.body.email);
  // Always succeed — never reveal whether an account exists.
  response.status(200).json({
    message: 'If that email is registered, a reset link has been sent. Check your inbox.'
  });
}

export async function resetPassword(request, response) {
  const { token, password, confirmPassword } = request.body;
  await resetPasswordService(token, password, confirmPassword);
  response.status(200).json({ message: 'Password updated successfully.' });
}
