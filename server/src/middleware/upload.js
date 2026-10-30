import multer from 'multer';
import { HttpError } from '../utils/http.js';

const ALLOWED = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/pjpeg']);

export const uploadImages = multer({
  storage: multer.memoryStorage(), // nothing is written to disk
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
  fileFilter: (_req, file, cb) => {
    const mime = (file.mimetype || '').toLowerCase();
    return ALLOWED.has(mime)
      ? cb(null, true)
      : cb(new HttpError(400, 'Only JPEG, PNG, WebP or GIF images are accepted.'));
  },
}).array('files', 8);
