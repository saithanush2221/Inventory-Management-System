import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const invoiceSchema = z.object({
  orderId: z.string(),
  amount: z.number().positive(),
  dueDate: z.string().optional().transform(str => str ? new Date(str) : undefined)
});

// Create Invoice
router.post(
  '/',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  async (req: Request, res: Response) => {
    try {
      const data = invoiceSchema.parse(req.body);
      const invoice = await prisma.invoice.create({ data });
      res.status(201).json(invoice);
    } catch (e) {
      res.status(400).json({ error: (e as any).message });
    }
  }
);

// Get invoices
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: { order: { include: { customer: true, items: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(invoices);
  } catch (e) {
    res.status(500).json({ error: (e as any).message });
  }
});

// Update invoice status
router.patch(
  '/:id/status',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  async (req: Request, res: Response) => {
    try {
      const { status } = z.object({ status: z.enum(['UNPAID', 'PAID', 'CANCELLED']) }).parse(req.body);
      const invoice = await prisma.invoice.update({
        where: { id: req.params.id },
        data: { status },
        include: { order: true }
      });
      res.json(invoice);
    } catch (e) {
      res.status(400).json({ error: (e as any).message });
    }
  }
);

export default router;
