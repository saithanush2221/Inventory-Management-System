import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateInvoicePDF = (invoice: any) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(40);
  doc.text('INVOICE', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Invoice #: ${invoice.id.substring(0, 8).toUpperCase()}`, 14, 30);
  doc.text(`Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 14, 35);
  if (invoice.dueDate) {
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 14, 40);
  }
  
  // Company Info
  doc.setFontSize(12);
  doc.setTextColor(40);
  doc.text('InvenTrack Corp.', 140, 22);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('123 Enterprise Avenue', 140, 27);
  doc.text('Business District, Tech City 10011', 140, 32);
  doc.text('billing@inventrack.com', 140, 37);

  // Bill To
  if (invoice.order?.customer) {
    doc.setTextColor(40);
    doc.setFontSize(12);
    doc.text('Bill To:', 14, 55);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(invoice.order.customer.name, 14, 60);
    if (invoice.order.customer.email) doc.text(invoice.order.customer.email, 14, 65);
    if (invoice.order.customer.address) doc.text(invoice.order.customer.address, 14, 70);
  }

  // Items Table
  const tableData = invoice.order?.items?.map((item: any) => [
    item.product?.name || 'Unknown Product',
    item.quantity.toString(),
    `Rs. ${item.unitPrice.toFixed(2)}`,
    `Rs. ${(item.quantity * item.unitPrice).toFixed(2)}`
  ]) || [];

  autoTable(doc, {
    startY: 85,
    head: [['Description', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] },
  });

  // Total
  const finalY = (doc as any).lastAutoTable.finalY || 85;
  doc.setFontSize(12);
  doc.setTextColor(40);
  doc.text('Total Amount:', 140, finalY + 10);
  doc.setFontSize(14);
  doc.text(`Rs. ${invoice.amount.toFixed(2)}`, 170, finalY + 10);

  // Status
  doc.setFontSize(12);
  doc.setTextColor(invoice.status === 'PAID' ? 46 : (invoice.status === 'CANCELLED' ? 220 : 243));
  // Note: jspdf colors: emerald(46, 204, 113), amber(243, 156, 18), rose(231, 76, 60)
  const statusColor = invoice.status === 'PAID' ? [46, 204, 113] : (invoice.status === 'CANCELLED' ? [231, 76, 60] : [243, 156, 18]);
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(`STATUS: ${invoice.status}`, 14, finalY + 10);

  doc.save(`Invoice_${invoice.id.substring(0,8)}.pdf`);
};

export const generatePurchaseOrderPDF = (po: any) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(40);
  doc.text('PURCHASE ORDER', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`PO #: ${po.id.substring(0, 8).toUpperCase()}`, 14, 30);
  doc.text(`Date: ${new Date(po.createdAt).toLocaleDateString()}`, 14, 35);
  
  // Vendor Info
  doc.setTextColor(40);
  doc.setFontSize(12);
  doc.text('Vendor:', 14, 55);
  doc.setFontSize(10);
  doc.setTextColor(100);
  if (po.supplier) {
    doc.text(po.supplier.name, 14, 60);
    if (po.supplier.email) doc.text(po.supplier.email, 14, 65);
    if (po.supplier.phone) doc.text(po.supplier.phone, 14, 70);
  }

  // Items Table
  const tableData = po.items?.map((item: any) => [
    item.product?.name || 'Unknown Product',
    item.quantity.toString(),
    `Rs. ${item.unitPrice.toFixed(2)}`,
    `Rs. ${(item.quantity * item.unitPrice).toFixed(2)}`
  ]) || [];

  autoTable(doc, {
    startY: 85,
    head: [['Item Description', 'Quantity', 'Cost per Unit', 'Line Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [52, 73, 94] },
  });

  // Total
  const finalY = (doc as any).lastAutoTable.finalY || 85;
  doc.setFontSize(12);
  doc.setTextColor(40);
  doc.text('Order Total:', 140, finalY + 10);
  doc.setFontSize(14);
  doc.text(`Rs. ${po.totalAmount.toFixed(2)}`, 170, finalY + 10);

  doc.save(`PurchaseOrder_${po.id.substring(0,8)}.pdf`);
};
