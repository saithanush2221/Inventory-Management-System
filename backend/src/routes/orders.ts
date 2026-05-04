import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const orderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number(),
});

const orderSchema = z.object({
  customerId: z.string().optional(),
  items: z.array(orderItemSchema).min(1),
});

// Create order – ADMIN or MANAGER
router.post(
  '/',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    try {
      const { customerId, items } = orderSchema.parse(req.body);
      const result = await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: { userId, customerId, status: 'PENDING', totalAmount: 0 },
        });
        let total = 0;
        for (const item of items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });
          if (!product) throw new Error(`Product ${item.productId} not found`);
          if (product.quantity < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}`);
          }
          await tx.orderItem.create({
            data: {
              orderId: order.id,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            },
          });
          await tx.product.update({
            where: { id: item.productId },
            data: { quantity: { decrement: item.quantity } },
          });
          await tx.inventoryLog.create({
            data: {
              productId: item.productId,
              change: -item.quantity,
              reason: 'sale',
            },
          });
          total += item.quantity * item.unitPrice;
        }
        return tx.order.update({
          where: { id: order.id },
          data: { totalAmount: total },
          include: { items: true },
        });
      });
      res.status(201).json(result);
    } catch (e) {
      res.status(400).json({ error: (e as any).message });
    }
  }
);

// Get orders
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const where = user.role === 'ADMIN' ? {} : { userId: user.id };
    const orders = await prisma.order.findMany({
      where,
      include: { items: { include: { product: true } }, user: { select: { email: true } }, customer: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (e) {
    res.status(500).json({ error: (e as any).message });
  }
});

// Update order status
router.patch(
  '/:id/status',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  async (req: Request, res: Response) => {
    try {
      const { status } = z.object({ status: z.enum(['PENDING', 'SHIPPED', 'DELIVERED']) }).parse(req.body);
      const order = await prisma.order.update({
        where: { id: req.params.id },
        data: { status },
        include: { items: true },
      });
      res.json(order);
    } catch (e) {
      res.status(400).json({ error: (e as any).message });
    }
  }
);

export default router;
