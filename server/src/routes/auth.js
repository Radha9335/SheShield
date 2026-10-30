import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import { signToken, requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils/http.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: { error: 'Too many attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name.').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: z.string().min(10, 'Use at least 10 characters for your password.').max(128),
});
const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email });

router.post(
  '/register',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { name, email, password } = registerSchema.parse(req.body);
    if (await User.exists({ email })) throw new HttpError(409, 'An account with this email already exists.');
    const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  })
);

router.post(
  '/login',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const user = await User.findOne({ email }).select('+passwordHash');
    const ok = user && (await bcrypt.compare(password, user.passwordHash));
    if (!ok) throw new HttpError(401, 'Email or password is incorrect.');
    res.json({ token: signToken(user), user: publicUser(user) });
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) throw new HttpError(401, 'Account not found.');
    res.json({ user: publicUser(user) });
  })
);

export default router;
