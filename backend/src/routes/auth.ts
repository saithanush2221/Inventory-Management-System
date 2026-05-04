import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF']).default('STAFF'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const parsed = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: parsed.email } });
    if (existing) return res.status(409).json({ error: 'User already exists' });
    const hashed = await bcrypt.hash(parsed.password, 10);
    const user = await prisma.user.create({
      data: { email: parsed.email, passwordHash: hashed, role: parsed.role },
    });
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userId: user.id,
      },
    });
    res.status(201).json({ accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role } });
  } catch (e) {
    res.status(400).json({ error: (e as any).message });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: parsed.email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(parsed.password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userId: user.id,
      },
    });
    res.json({ accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role } });
  } catch (e) {
    res.status(400).json({ error: (e as any).message });
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken: oldToken } = req.body;
    if (!oldToken) return res.status(400).json({ error: 'Refresh token required' });

    let payload: any;
    try {
      payload = jwt.verify(oldToken, process.env.JWT_REFRESH_SECRET!);
    } catch {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token: oldToken } });
    if (!stored) return res.status(401).json({ error: 'Refresh token not recognized' });

    await prisma.refreshToken.delete({ where: { token: oldToken } });

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: '15m' }
    );
    const newRefreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );
    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userId: user.id,
      },
    });
    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (e) {
    res.status(400).json({ error: (e as any).message });
  }
});

// Get current user info
router.get('/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }
  try {
    const payload: any = jwt.verify(authHeader.split(' ')[1], process.env.JWT_ACCESS_SECRET!);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;