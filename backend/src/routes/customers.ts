import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const customerSchema = z.object({
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

// Create customer
router.post(
  '/',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  async (req: Request, res: Response) => {
    try {
      const data = customerSchema.parse(req.body);
      const customer = await prisma.customer.create({ data });
      res.status(201).json(customer);
    } catch (e) {
      res.status(400).json({ error: (e as any).message });
    }
  }
);

// List customers
router.get('/', authenticate, async (_req: Request, res: Response) => {
  try {
    const customers = await prisma.customer.findMany({
      include: { _count: { select: { orders: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(customers);
  } catch (e) {
    res.status(500).json({ error: (e as any).message });
  }
});

// Update customer
router.put(
  '/:id',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  async (req: Request, res: Response) => {
    try {
      const data = customerSchema.partial().parse(req.body);
      const updated = await prisma.customer.update({ where: { id: req.params.id }, data });
      res.json(updated);
    } catch (e) {
      res.status(400).json({ error: (e as any).message });
    }
  }
);

// Delete customer
router.delete(
  '/:id',
  authenticate,
  authorize(['ADMIN']),
  async (req: Request, res: Response) => {
    try {
      await prisma.customer.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (e) {
      res.status(400).json({ error: (e as any).message });
    }
  }
);

export default router;
