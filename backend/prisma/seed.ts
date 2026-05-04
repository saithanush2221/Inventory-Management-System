import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@inventory.com' },
    update: {},
    create: {
      email: 'admin@inventory.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('  ✅ Admin user created:', admin.email);

  // Create manager user
  const managerPassword = await bcrypt.hash('manager123', 10);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@inventory.com' },
    update: {},
    create: {
      email: 'manager@inventory.com',
      passwordHash: managerPassword,
      role: 'MANAGER',
    },
  });
  console.log('  ✅ Manager user created:', manager.email);

  // Create staff user
  const staffPassword = await bcrypt.hash('staff123', 10);
  const staff = await prisma.user.upsert({
    where: { email: 'staff@inventory.com' },
    update: {},
    create: {
      email: 'staff@inventory.com',
      passwordHash: staffPassword,
      role: 'STAFF',
    },
  });
  console.log('  ✅ Staff user created:', staff.email);

  // Create suppliers
  const supplierA = await prisma.supplier.create({
    data: { name: 'TechParts Co.', email: 'orders@techparts.com', phone: '+1-555-0100', contactInfo: 'Premium electronics supplier' },
  });
  const supplierB = await prisma.supplier.create({
    data: { name: 'GlobalMaterials Inc.', email: 'sales@globalmaterials.com', phone: '+1-555-0200', contactInfo: 'Raw materials and components' },
  });
  const supplierC = await prisma.supplier.create({
    data: { name: 'QuickShip Logistics', email: 'info@quickship.com', phone: '+1-555-0300', contactInfo: 'Packaging and shipping supplies' },
  });
  console.log('  ✅ 3 suppliers created');

  // Create warehouses
  const wh1 = await prisma.warehouse.create({
    data: { name: 'Main Distribution Center', location: 'Building A, Industrial Park' },
  });
  const wh2 = await prisma.warehouse.create({
    data: { name: 'Secondary Storage', location: 'Building B, Downtown' },
  });
  const wh3 = await prisma.warehouse.create({
    data: { name: 'Returns Processing', location: 'Building C, Airport Zone' },
  });
  console.log('  ✅ 3 warehouses created');

  // Create products
  const products = [
    { name: 'Wireless Mouse', sku: 'TECH-001', category: 'Electronics', purchasePrice: 1000, sellingPrice: 1999, quantity: 150, supplierId: supplierA.id },
    { name: 'Mechanical Keyboard', sku: 'TECH-002', category: 'Electronics', purchasePrice: 2800, sellingPrice: 6499, quantity: 75, supplierId: supplierA.id },
    { name: 'USB-C Hub', sku: 'TECH-003', category: 'Electronics', purchasePrice: 1400, sellingPrice: 3199, quantity: 200, supplierId: supplierA.id },
    { name: 'Monitor Stand', sku: 'FURN-001', category: 'Furniture', purchasePrice: 1700, sellingPrice: 3999, quantity: 45, supplierId: supplierB.id },
    { name: 'Desk Lamp', sku: 'FURN-002', category: 'Furniture', purchasePrice: 1200, sellingPrice: 2799, quantity: 60, supplierId: supplierB.id },
    { name: 'Ergonomic Chair', sku: 'FURN-003', category: 'Furniture', purchasePrice: 9500, sellingPrice: 24000, quantity: 8, supplierId: supplierB.id },
    { name: 'Shipping Box (Large)', sku: 'PACK-001', category: 'Packaging', purchasePrice: 120, sellingPrice: 320, quantity: 500, supplierId: supplierC.id },
    { name: 'Bubble Wrap Roll', sku: 'PACK-002', category: 'Packaging', purchasePrice: 640, sellingPrice: 1200, quantity: 120, supplierId: supplierC.id },
    { name: 'Packing Tape', sku: 'PACK-003', category: 'Packaging', purchasePrice: 160, sellingPrice: 480, quantity: 300, supplierId: supplierC.id },
    { name: 'Webcam HD', sku: 'TECH-004', category: 'Electronics', purchasePrice: 2000, sellingPrice: 4800, quantity: 5, supplierId: supplierA.id },
  ];

  for (const p of products) {
    await prisma.product.create({ data: p });
  }
  console.log('  ✅ 10 products created');

  // Create some orders
  const allProducts = await prisma.product.findMany();
  const order1 = await prisma.order.create({
    data: {
      userId: admin.id,
      status: 'DELIVERED',
      totalAmount: 0,
      items: {
        create: [
          { productId: allProducts[0].id, quantity: 5, unitPrice: allProducts[0].sellingPrice },
          { productId: allProducts[1].id, quantity: 2, unitPrice: allProducts[1].sellingPrice },
        ],
      },
    },
    include: { items: true },
  });
  const total1 = order1.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  await prisma.order.update({ where: { id: order1.id }, data: { totalAmount: total1 } });

  const order2 = await prisma.order.create({
    data: {
      userId: manager.id,
      status: 'SHIPPED',
      totalAmount: 0,
      items: {
        create: [
          { productId: allProducts[2].id, quantity: 10, unitPrice: allProducts[2].sellingPrice },
        ],
      },
    },
    include: { items: true },
  });
  const total2 = order2.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  await prisma.order.update({ where: { id: order2.id }, data: { totalAmount: total2 } });

  const order3 = await prisma.order.create({
    data: {
      userId: admin.id,
      status: 'PENDING',
      totalAmount: 0,
      items: {
        create: [
          { productId: allProducts[5].id, quantity: 1, unitPrice: allProducts[5].sellingPrice },
          { productId: allProducts[3].id, quantity: 3, unitPrice: allProducts[3].sellingPrice },
        ],
      },
    },
    include: { items: true },
  });
  const total3 = order3.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  await prisma.order.update({ where: { id: order3.id }, data: { totalAmount: total3 } });
  console.log('  ✅ 3 orders created');

  // Create inventory logs
  await prisma.inventoryLog.createMany({
    data: [
      { productId: allProducts[0].id, warehouseId: wh1.id, change: 150, reason: 'purchase' },
      { productId: allProducts[1].id, warehouseId: wh1.id, change: 75, reason: 'purchase' },
      { productId: allProducts[0].id, warehouseId: wh1.id, change: -5, reason: 'sale' },
      { productId: allProducts[1].id, warehouseId: wh1.id, change: -2, reason: 'sale' },
      { productId: allProducts[2].id, warehouseId: wh2.id, change: 200, reason: 'purchase' },
      { productId: allProducts[2].id, warehouseId: wh2.id, change: -10, reason: 'sale' },
      { productId: allProducts[5].id, warehouseId: wh1.id, change: -3, reason: 'adjustment' },
    ],
  });
  console.log('  ✅ Inventory logs created');

  console.log('\n🎉 Seed complete!');
  console.log('\n📋 Login credentials:');
  console.log('  Admin:   admin@inventory.com / admin123');
  console.log('  Manager: manager@inventory.com / manager123');
  console.log('  Staff:   staff@inventory.com / staff123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
