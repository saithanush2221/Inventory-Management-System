import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const supplierSchema = z.object({
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  contactInfo: z.string().optional(),
});

// Create supplier – ADMIN or MANAGER
router.post(
  '/',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  async (req: Request, res: Response) => {
    try {
      const data = supplierSchema.parse(req.body);
      const supplier = await prisma.supplier.create({ data });
      res.status(201).json(supplier);
    } catch (e) {
      res.status(400).json({ error: (e as any).message });
    }
  }
);

// List suppliers – any authenticated user
router.get('/', authenticate, async (_req: Request, res: Response) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(suppliers);
  } catch (e) {
    res.status(500).json({ error: (e as any).message });
  }
});

// Update supplier – ADMIN or MANAGER
router.put(
  '/:id',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  async (req: Request, res: Response) => {
    try {
      const data = supplierSchema.partial().parse(req.body);
      const updated = await prisma.supplier.update({ where: { id: req.params.id }, data });
      res.json(updated);
    } catch (e) {
      res.status(400).json({ error: (e as any).message });
    }
  }
);

// Delete supplier – ADMIN only
router.delete(
  '/:id',
  authenticate,
  authorize(['ADMIN']),
  async (req: Request, res: Response) => {
    try {
      await prisma.supplier.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (e) {
      res.status(400).json({ error: (e as any).message });
    }
  }
);

export default router;
