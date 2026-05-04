import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const dateRangeSchema = z.object({
  start: z.string().refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid start date' }),
  end: z.string().refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid end date' }),
});

// Dashboard stats
router.get('/dashboard', authenticate, async (_req: Request, res: Response) => {
  try {
    const [productCount, orderCount, supplierCount, warehouseCount] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.supplier.count(),
      prisma.warehouse.count(),
    ]);

    const products = await prisma.product.findMany({
      select: { quantity: true, purchasePrice: true, sellingPrice: true },
    });
    const totalInventoryValue = products.reduce((sum, p) => sum + p.quantity * p.purchasePrice, 0);
    const totalRetailValue = products.reduce((sum, p) => sum + p.quantity * p.sellingPrice, 0);
    const lowStockProducts = products.filter(p => p.quantity < 10).length;

    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true } }, items: { include: { product: true } } },
    });

    const recentLogs = await prisma.inventoryLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { name: true } } },
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentSalesForTrend = await prisma.order.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        status: { in: ['SHIPPED', 'DELIVERED', 'PENDING'] }
      },
      select: { totalAmount: true, createdAt: true }
    });

    const salesTrendMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      salesTrendMap[dateStr] = 0;
    }

    recentSalesForTrend.forEach(order => {
      const dateStr = new Date(order.createdAt).toISOString().split('T')[0];
      if (salesTrendMap[dateStr] !== undefined) {
        salesTrendMap[dateStr] += order.totalAmount;
      }
    });

    const salesTrend = Object.keys(salesTrendMap).map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      sales: salesTrendMap[date]
    }));

    res.json({
      stats: {
        productCount,
        orderCount,
        supplierCount,
        warehouseCount,
        totalInventoryValue,
        totalRetailValue,
        lowStockProducts,
      },
      salesTrend,
      recentOrders,
      recentLogs,
    });
  } catch (e) {
    res.status(500).json({ error: (e as any).message });
  }
});

// Sales summary report
router.get('/sales', authenticate, async (req: Request, res: Response) => {
  try {
    const { start, end } = dateRangeSchema.parse(req.query);
    const sales = await prisma.order.findMany({
      where: {
        status: { in: ['SHIPPED', 'DELIVERED'] },
        createdAt: { gte: new Date(start), lte: new Date(end) },
      },
      include: { items: true },
    });
    const totalRevenue = sales.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const totalOrders = sales.length;
    res.json({ totalRevenue, totalOrders, period: { start, end } });
  } catch (e) {
    res.status(400).json({ error: (e as any).message });
  }
});

// Inventory valuation report
router.get('/inventory', authenticate, async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      select: { id: true, name: true, sku: true, quantity: true, purchasePrice: true, sellingPrice: true, category: true },
    });
    const valuation = products.reduce(
      (sum, p) => sum + p.quantity * p.purchasePrice,
      0
    );
    res.json({ valuation, productCount: products.length, products });
  } catch (e) {
    res.status(500).json({ error: (e as any).message });
  }
});

export default router;
