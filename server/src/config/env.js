import 'dotenv/config';

const required = (name, fallback) => {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const isProd = process.env.NODE_ENV === 'production';

export const env = {
  isProd,
  port: Number(process.env.PORT || 5000),
  mongoUri: required('MONGO_URI', 'mongodb://127.0.0.1:27017/sheshield'),
  jwtSecret: required('JWT_SECRET', isProd ? undefined : 'dev-only-secret-change-me'),
  clientOrigin: required('CLIENT_ORIGIN', 'http://localhost:5173'),
  openrouterKey: process.env.OPENROUTER_API_KEY || '',
  openrouterModel: process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free',
  anthropicKey: process.env.ANTHROPIC_API_KEY || '',
  geminiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
  model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest',
};
