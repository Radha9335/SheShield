import { ZodError } from 'zod';
import multer from 'multer';
import { env } from '../config/env.js';

export function notFound(_req, res) {
  res.status(404).json({ error: 'Route not found.' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: err.issues[0]?.message || 'Invalid input.',
      details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  if (err instanceof multer.MulterError) {
    let msg = err.message;
    if (err.code === 'LIMIT_FILE_SIZE') msg = 'Each file must be 5 MB or smaller.';
    else if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT') msg = 'Too many files. Upload up to 8 files.';
    return res.status(400).json({ error: msg });
  }
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: status >= 500 && env.isProd ? 'Something went wrong on our side.' : err.message,
  });
}
