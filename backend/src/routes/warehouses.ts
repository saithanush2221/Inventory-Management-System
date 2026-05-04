import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const warehouseSchema = z.object({
  name: z.string(),
  location: z.string().optional(),
});

// Create warehouse – ADMIN or MANAGER
router.post(
  '/',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  async (req: Request, res: Response) => {
    try {
      const data = warehouseSchema.parse(req.body);
      const warehouse = await prisma.warehouse.create({ data });
      res.status(201).json(warehouse);
    } catch (e) {
      res.status(400).json({ error: (e as any).message });
    }
  }
);

// List warehouses – any authenticated user
router.get('/', authenticate, async (_req: Request, res: Response) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: { _count: { select: { inventoryLogs: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(warehouses);
  } catch (e) {
    res.status(500).json({ error: (e as any).message });
  }
});

// Update warehouse – ADMIN or MANAGER
router.put(
  '/:id',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  async (req: Request, res: Response) => {
    try {
      const data = warehouseSchema.partial().parse(req.body);
      const updated = await prisma.warehouse.update({ where: { id: req.params.id }, data });
      res.json(updated);
    } catch (e) {
      res.status(400).json({ error: (e as any).message });
    }
  }
);

// Delete warehouse – ADMIN only
router.delete(
  '/:id',
  authenticate,
  authorize(['ADMIN']),
  async (req: Request, res: Response) => {
    try {
      await prisma.warehouse.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (e) {
      res.status(400).json({ error: (e as any).message });
    }
  }
);

// Transfer stock between warehouses
const transferSchema = z.object({
  productId: z.string(),
  fromWarehouseId: z.string(),
  toWarehouseId: z.string(),
  quantity: z.number().int().positive(),
});

router.post(
  '/transfer',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  async (req: Request, res: Response) => {
    try {
      const { productId, fromWarehouseId, toWarehouseId, quantity } =
        transferSchema.parse(req.body);
      await prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product) throw new Error('Product not found');
        if (product.quantity < quantity) throw new Error('Insufficient stock');
        await tx.inventoryLog.create({
          data: {
            productId,
            warehouseId: fromWarehouseId,
            change: -quantity,
            reason: 'transfer',
          },
        });
        await tx.inventoryLog.create({
          data: {
            productId,
            warehouseId: toWarehouseId,
            change: quantity,
            reason: 'transfer',
          },
        });
      });
      res.json({ message: 'Transfer recorded' });
    } catch (e) {
      res.status(400).json({ error: (e as any).message });
    }
  }
);

export default router;
