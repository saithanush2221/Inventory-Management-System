import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Order {
  id: string;
  userId: string;
  user?: { email: string };
  status: string;
  totalAmount: number;
  createdAt: string;
  customer?: { name: string };
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [orderItems, setOrderItems] = useState([{ productId: '', quantity: '1', unitPrice: '' }]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const fetchOrders = () => {
    setLoading(true);
    api.get('/orders')
      .then((res) => setOrders(res.data))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
    api.get('/products').then((res) => setProducts(res.data)).catch(() => {});
    api.get('/customers').then((res) => setCustomers(res.data)).catch(() => {});
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
    // Auto-fill unit price from product
    if (field === 'productId' && value) {
      const product = products.find((p: any) => p.id === value);
      if (product) updated[i].unitPrice = String(product.sellingPrice);
    }
    setOrderItems(updated);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const items = orderItems.map((item) => ({
        productId: item.productId,
        quantity: parseInt(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
      }));
      await api.post('/orders', { customerId: customerId || undefined, items });
      toast.success('Order created');
      setShowCreate(false);
      setCustomerId('');
      setOrderItems([{ productId: '', quantity: '1', unitPrice: '' }]);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create order');
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      toast.success(`Order ${status.toLowerCase()}`);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update');
    }
  };

  return (
    <Layout>
      <Head>
        <title>Orders — InvenTrack</title>
        <meta name="description" content="Manage and track your orders" />
      </Head>

      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-description">Track and manage all sales orders</p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + New Order
          </button>
        )}
      </div>

      <div className="glass-card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🛒</div>
            <h3>No orders yet</h3>
            <p>Create your first order to get started</p>
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
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
                      <td style={{ color: 'var(--text-secondary)' }}>{order.customer?.name || order.user?.email || '—'}</td>
                      <td>{order.items.length} items</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(order.totalAmount)}</td>
                      <td>
                        <span className={`badge ${
                          order.status === 'DELIVERED' ? 'emerald' :
                          order.status === 'SHIPPED' ? 'blue' : 'amber'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatDate(order.createdAt)}</td>
                      {canEdit && (
                        <td onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {order.status === 'PENDING' && (
                              <button className="btn btn-secondary btn-sm" onClick={() => updateStatus(order.id, 'SHIPPED')}>Ship</button>
                            )}
                            {order.status === 'SHIPPED' && (
                              <button className="btn btn-secondary btn-sm" onClick={() => updateStatus(order.id, 'DELIVERED')}>Deliver</button>
                            )}
                          </div>
                        </td>
                      )}
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

      {/* Create Order Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h2 className="modal-title">New Order</h2>
              <button className="modal-close" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Customer (Optional)</label>
                <select className="form-input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                  <option value="">Select customer</option>
                  {customers.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
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
                        <option key={p.id} value={p.id}>{p.name} (Qty: {p.quantity})</option>
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
                <button type="submit" className="btn btn-primary">Create Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
