import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const purchaseOrderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number(),
});

const purchaseOrderSchema = z.object({
  supplierId: z.string(),
  items: z.array(purchaseOrderItemSchema).min(1),
});

// Create purchase order
router.post(
  '/',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  async (req: Request, res: Response) => {
    try {
      const { supplierId, items } = purchaseOrderSchema.parse(req.body);
      const result = await prisma.$transaction(async (tx) => {
        const po = await tx.purchaseOrder.create({
          data: { supplierId, status: 'PENDING', totalAmount: 0 },
        });
        let total = 0;
        for (const item of items) {
          await tx.purchaseOrderItem.create({
            data: {
              purchaseOrderId: po.id,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            },
          });
          total += item.quantity * item.unitPrice;
        }
        return tx.purchaseOrder.update({
          where: { id: po.id },
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

// Get purchase orders
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const pos = await prisma.purchaseOrder.findMany({
      include: { items: { include: { product: true } }, supplier: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(pos);
  } catch (e) {
    res.status(500).json({ error: (e as any).message });
  }
});

// Update purchase order status
router.patch(
  '/:id/status',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  async (req: Request, res: Response) => {
    try {
      const { status } = z.object({ status: z.enum(['PENDING', 'RECEIVED', 'CANCELLED']) }).parse(req.body);
      
      const result = await prisma.$transaction(async (tx) => {
        const po = await tx.purchaseOrder.findUnique({
          where: { id: req.params.id },
          include: { items: true }
        });
        
        if (!po) throw new Error("Purchase Order not found");
        
        if (po.status !== 'RECEIVED' && status === 'RECEIVED') {
          // Add items to stock
          for (const item of po.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { quantity: { increment: item.quantity } },
            });
            await tx.inventoryLog.create({
              data: {
                productId: item.productId,
                change: item.quantity,
                reason: 'purchase',
              },
            });
          }
        }
        
        return tx.purchaseOrder.update({
          where: { id: req.params.id },
          data: { status },
          include: { items: true, supplier: true },
        });
      });
      
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: (e as any).message });
    }
  }
);

export default router;
