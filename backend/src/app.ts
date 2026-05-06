import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import authRouter from './routes/auth';
import productsRouter from './routes/products';
import ordersRouter from './routes/orders';
import suppliersRouter from './routes/suppliers';
import warehousesRouter from './routes/warehouses';
import reportsRouter from './routes/reports';
import customersRouter from './routes/customers';
import purchaseOrdersRouter from './routes/purchase-orders';
import invoicesRouter from './routes/invoices';

dotenv.config();

export function createServer() {
  const app = express();

  // Global middlewares
  app.use(helmet());
  const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
  }
  
  app.use(cors({ 
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        // Fallback to allow Vercel domains dynamically if explicitly set
        if (origin.endsWith('.vercel.app')) {
           callback(null, true);
        } else {
           callback(new Error('Not allowed by CORS'));
        }
      }
    }, 
    credentials: true 
  }));
  app.use(express.json());
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 200,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  // Routes
  app.use('/api/auth', authRouter);
  app.use('/api/products', productsRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/suppliers', suppliersRouter);
  app.use('/api/warehouses', warehousesRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/customers', customersRouter);
  app.use('/api/purchase-orders', purchaseOrdersRouter);
  app.use('/api/invoices', invoicesRouter);

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Error handling
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
  });

  return app;
}
