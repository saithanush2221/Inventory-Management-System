import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { generatePurchaseOrderPDF } from '../lib/pdf';
import { Download } from 'lucide-react';

interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplier?: { name: string };
  status: string;
  totalAmount: number;
  createdAt: string;
  items: { id: string; quantity: number; unitPrice: number; product?: { name: string } }[];
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [orderItems, setOrderItems] = useState([{ productId: '', quantity: '1', unitPrice: '' }]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const fetchOrders = () => {
    setLoading(true);
    api.get('/purchase-orders')
      .then((res) => setOrders(res.data))
      .catch(() => toast.error('Failed to load purchase orders'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
    api.get('/products').then((res) => setProducts(res.data)).catch(() => {});
    api.get('/suppliers').then((res) => setSuppliers(res.data)).catch(() => {});
  }, []);

  const addItem = () => {
    setOrderItems([...orderItems, { productId: '', quantity: '1', unitPrice: '' }]);
  };

  const removeItem = (i: number) => {
    setOrderItems(orderItems.filter((_, idx) => idx !== i));
  };

  const updateItem = (i: number, field: string, value: string) => {
    const updated = [...orderItems];
    (updated[i] as any)[field] = value;
    if (field === 'productId' && value) {
      const product = products.find((p: any) => p.id === value);
      if (product) updated[i].unitPrice = String(product.purchasePrice || 0);
    }
    setOrderItems(updated);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      toast.error('Please select a supplier');
      return;
    }
    try {
      const items = orderItems.map((item) => ({
        productId: item.productId,
        quantity: parseInt(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
      }));
      await api.post('/purchase-orders', { supplierId, items });
      toast.success('Purchase Order created');
      setShowCreate(false);
      setSupplierId('');
      setOrderItems([{ productId: '', quantity: '1', unitPrice: '' }]);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create purchase order');
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await api.patch(`/purchase-orders/${orderId}/status`, { status });
      toast.success(`Purchase Order ${status.toLowerCase()}`);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update');
    }
  };

  return (
    <Layout>
      <Head>
        <title>Purchase Orders — InvenTrack</title>
        <meta name="description" content="Manage and track your purchase orders" />
      </Head>

      <div className="page-header">
        <div>
          <h1 className="page-title">Purchase Orders</h1>
          <p className="page-description">Manage stock purchases from suppliers</p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + New PO
          </button>
        )}
      </div>

      <div className="glass-card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🛍️</div>
            <h3>No purchase orders yet</h3>
            <p>Create your first purchase order to get started</p>
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>PO ID</th>
                  <th>Supplier</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  {canEdit && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr key={order.id} style={{ cursor: 'pointer' }} onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                      <td style={{ fontWeight: 600, fontSize: 12 }}>{order.id.substring(0, 8)}...</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{order.supplier?.name || '—'}</td>
                      <td>{order.items.length} items</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(order.totalAmount)}</td>
                      <td>
                        <span className={`badge ${
                          order.status === 'RECEIVED' ? 'emerald' :
                          order.status === 'CANCELLED' ? 'danger' : 'amber'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatDate(order.createdAt)}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => generatePurchaseOrderPDF(order)} title="Download PDF">
                            <Download size={14} />
                          </button>
                          {canEdit && order.status === 'PENDING' && (
                            <>
                              <button className="btn btn-secondary btn-sm" onClick={() => updateStatus(order.id, 'RECEIVED')}>Receive</button>
                              <button className="btn btn-danger btn-sm" onClick={() => updateStatus(order.id, 'CANCELLED')}>Cancel</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedOrder === order.id && (
                      <tr key={`${order.id}-detail`}>
                        <td colSpan={7} style={{ background: 'rgba(15,25,50,0.4)', padding: '12px 24px' }}>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            <strong>Order Items:</strong>
                            {order.items.map((item, i) => (
                              <div key={item.id} style={{ padding: '4px 0' }}>
                                {item.product?.name || 'Unknown'} × {item.quantity} @ {formatCurrency(item.unitPrice)}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h2 className="modal-title">New Purchase Order</h2>
              <button className="modal-close" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Supplier</label>
                <select className="form-input" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required>
                  <option value="">Select supplier</option>
                  {suppliers.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: 20, marginBottom: 10, fontWeight: 600 }}>Order Items</div>
              {orderItems.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-end' }}>
                  <div style={{ flex: 2 }}>
                    <label className="form-label">Product</label>
                    <select className="form-input" value={item.productId} onChange={(e) => updateItem(i, 'productId', e.target.value)} required>
                      <option value="">Select product</option>
                      {products.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Qty</label>
                    <input className="form-input" type="number" min="1" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} required />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Price</label>
                    <input className="form-input" type="number" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', e.target.value)} required />
                  </div>
                  {orderItems.length > 1 && (
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => removeItem(i)} style={{ marginBottom: 0 }}>×</button>
                  )}
                </div>
              ))}
              <button type="button" className="btn btn-secondary btn-sm" onClick={addItem} style={{ marginBottom: 16 }}>
                + Add Item
              </button>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create PO</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
