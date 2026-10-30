import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import caseRoutes from './routes/cases.js';
import { notFound, errorHandler } from './middleware/error.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../../client/dist');
const hasClientDist = fs.existsSync(clientDistPath);

const app = express();
app.set('trust proxy', 1);

const allowedOrigins = [env.clientOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan(env.isProd ? 'combined' : 'dev'));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));

app.get('/api/health', (_req, res) =>
  res.json({
    ok: true,
    ai: Boolean(env.geminiKey || env.openrouterKey || env.anthropicKey),
    provider: env.geminiKey
      ? `gemini (${env.geminiModel})`
      : env.openrouterKey
      ? `openrouter (${env.openrouterModel})`
      : env.anthropicKey
      ? 'anthropic'
      : 'local-opencv',
  })
);
app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);

// If client build exists, serve static assets and SPA fallback
if (hasClientDist) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => res.redirect(env.clientOrigin));
}

app.use(notFound);
app.use(errorHandler);

connectDB()
  .then(() => {
    const server = app.listen(env.port, () => console.log(`SheShield API on :${env.port}`));
    const shutdown = () => server.close(() => process.exit(0));
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  })
  .catch((err) => {
    console.error('Failed to start:', err.message);
    process.exit(1);
  });

