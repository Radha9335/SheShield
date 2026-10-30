import { Router } from 'express';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import Case from '../models/Case.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadImages } from '../middleware/upload.js';
import { asyncHandler, HttpError } from '../utils/http.js';
import { analyzeMedia, analyzeText, analyzeProfile } from '../services/aiService.js';
import { computeTrust } from '../services/scoring.js';

const router = Router();
router.use(requireAuth);

// AI calls cost money, so they get a tighter limit than the rest of the API.
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 40,
  keyGenerator: (req) => req.userId || req.ip || 'anonymous',
  message: { error: 'Analysis limit reached for this hour. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const caseSchema = z.object({
  title: z.string().trim().min(1, 'Give the case a title.').max(120),
  subject: z.string().trim().max(200).optional(),
});

const textSchema = z.object({
  text: z.string().trim().min(20, 'Paste at least 20 characters of text.').max(5000),
  context: z.string().trim().max(300).optional(),
});

const profileSchema = z.object({
  platform: z.string().trim().max(40).optional(),
  username: z.string().trim().max(60).optional(),
  displayName: z.string().trim().max(80).optional(),
  bio: z.string().trim().max(600).optional(),
  accountAgeDays: z.coerce.number().int().min(0).max(36500).optional(),
  followers: z.coerce.number().int().min(0).max(1e9).optional(),
  following: z.coerce.number().int().min(0).max(1e9).optional(),
  posts: z.coerce.number().int().min(0).max(1e7).optional(),
  links: z.array(z.string().trim().max(200)).max(5).optional(),
}).refine((p) => p.username || p.displayName || p.bio, { message: 'Enter at least a username, display name or bio.' });

async function ownedCase(req) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new HttpError(404, 'Case not found.');
  const doc = await Case.findOne({ _id: id, user: req.userId });
  if (!doc) throw new HttpError(404, 'Case not found.');
  return doc;
}

async function saveModule(doc, type, result) {
  doc.modules.push({
    type,
    score: Math.round(result.authenticityScore),
    confidence: result.confidence,
    summary: result.summary,
    signals: result.signals,
    inputNote: result.inputNote,
    metrics: result.metrics,
  });
  const { trustScore, verdict, explanation } = computeTrust(doc.modules);
  Object.assign(doc, { trustScore, verdict, explanation });
  await doc.save();
  return doc;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const cases = await Case.find({ user: req.userId })
      .select('title subject trustScore verdict updatedAt modules.type')
      .sort({ updatedAt: -1 })
      .limit(100);
    res.json({ cases });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = caseSchema.parse(req.body);
    const doc = await Case.create({ ...data, user: req.userId });
    res.status(201).json({ case: doc });
  })
);

router.get('/:id', asyncHandler(async (req, res) => res.json({ case: await ownedCase(req) })));

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const doc = await ownedCase(req);
    await doc.deleteOne();
    res.status(204).end();
  })
);

router.post(
  '/:id/analyze/media',
  aiLimiter,
  uploadImages,
  asyncHandler(async (req, res) => {
    const doc = await ownedCase(req);
    const kind = z.enum(['image', 'video']).parse(req.body.kind);
    const files = req.files || [];
    if (!files.length) throw new HttpError(400, 'Add at least one file.');
    if (kind === 'video' && files.length < 3) throw new HttpError(400, 'Video analysis needs at least 3 frames.');
    const result = await analyzeMedia({ kind, files });
    res.json({ case: await saveModule(doc, kind, result) });
  })
);

router.post(
  '/:id/analyze/text',
  aiLimiter,
  asyncHandler(async (req, res) => {
    const doc = await ownedCase(req);
    const result = await analyzeText(textSchema.parse(req.body));
    res.json({ case: await saveModule(doc, 'text', result) });
  })
);

router.post(
  '/:id/analyze/profile',
  aiLimiter,
  asyncHandler(async (req, res) => {
    const doc = await ownedCase(req);
    const result = await analyzeProfile(profileSchema.parse(req.body));
    res.json({ case: await saveModule(doc, 'profile', result) });
  })
);

export default router;
