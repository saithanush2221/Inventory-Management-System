import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const productSchema = z.object({
  name: z.string(),
  sku: z.string(),
  category: z.string().optional(),
  purchasePrice: z.number(),
  sellingPrice: z.number(),
  quantity: z.number().int().nonnegative(),
  supplierId: z.string().optional(),
});

// Create product – only ADMIN or MANAGER
router.post(
  '/',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  async (req: Request, res: Response) => {
    try {
      const data = productSchema.parse(req.body);
      const product = await prisma.product.create({ data });
      res.status(201).json(product);
    } catch (e) {
      res.status(400).json({ error: (e as any).message });
    }
  }
);

// Read all products – any authenticated user
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { search, category } = req.query;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { sku: { contains: search as string } },
      ];
    }
    if (category) {
      where.category = category as string;
    }
    const products = await prisma.product.findMany({
      where,
      include: { supplier: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(products);
  } catch (e) {
    res.status(500).json({ error: (e as any).message });
  }
});

// Get single product
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { supplier: true, inventoryLogs: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (e) {
    res.status(500).json({ error: (e as any).message });
  }
});

// Update product – ADMIN or MANAGER
router.put(
  '/:id',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  async (req: Request, res: Response) => {
    try {
      const data = productSchema.partial().parse(req.body);
      const updated = await prisma.product.update({ where: { id: req.params.id }, data });
      res.json(updated);
    } catch (e) {
      res.status(400).json({ error: (e as any).message });
    }
  }
);

// Delete product – ADMIN only
router.delete(
  '/:id',
  authenticate,
  authorize(['ADMIN']),
  async (req: Request, res: Response) => {
    try {
      await prisma.product.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (e) {
      res.status(400).json({ error: (e as any).message });
    }
  }
);

export default router;
