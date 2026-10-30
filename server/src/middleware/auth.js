import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { HttpError } from '../utils/http.js';

export function signToken(user) {
  return jwt.sign({ sub: user._id.toString() }, env.jwtSecret, { expiresIn: '7d' });
}

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new HttpError(401, 'Sign in to continue.'));
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.userId = payload.sub;
    next();
  } catch {
    next(new HttpError(401, 'Your session has expired. Sign in again.'));
  }
}
