import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function authenticate(request, response, next) {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return response.status(401).json({ message: 'Authentication required.' });
  }

  const token = header.slice(7);
  try {
    request.user = jwt.verify(token, env.jwtSecret);
    next();
  } catch {
    response.status(401).json({ message: 'Invalid or expired token.' });
  }
}
