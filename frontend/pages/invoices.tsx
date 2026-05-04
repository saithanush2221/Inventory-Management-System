import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { generateInvoicePDF } from '../lib/pdf';
import { Download } from 'lucide-react';

interface Invoice {
  id: string;
  orderId: string;
  order?: { id: string, totalAmount: number };
  amount: number;
  status: string;
  issueDate: string;
  dueDate: string | null;
  createdAt: string;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [form, setForm] = useState({ orderId: '', amount: '', dueDate: '' });
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const fetchInvoices = () => {
    setLoading(true);
    api.get('/invoices')
      .then((res) => setInvoices(res.data))
      .catch(() => toast.error('Failed to load invoices'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInvoices();
    api.get('/orders').then((res) => setOrders(res.data)).catch(() => {});
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.orderId) {
      toast.error('Please select an order');
      return;
    }
    try {
      await api.post('/invoices', {
        orderId: form.orderId,
        amount: parseFloat(form.amount),
        dueDate: form.dueDate || undefined,
      });
      toast.success('Invoice created');
      setShowCreate(false);
      setForm({ orderId: '', amount: '', dueDate: '' });
      fetchInvoices();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create invoice');
    }
  };

  const updateStatus = async (invoiceId: string, status: string) => {
    try {
      await api.patch(`/invoices/${invoiceId}/status`, { status });
      toast.success(`Invoice marked as ${status.toLowerCase()}`);
      fetchInvoices();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update');
    }
  };

  return (
    <Layout>
      <Head>
        <title>Invoices — InvenTrack</title>
        <meta name="description" content="Manage your invoices" />
      </Head>

      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-description">Generate and track customer invoices</p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + New Invoice
          </button>
        )}
      </div>

      <div className="glass-card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : invoices.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📄</div>
            <h3>No invoices yet</h3>
            <p>Create an invoice for an existing order</p>
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Order Ref</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  {canEdit && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 600, fontSize: 12 }}>{inv.id.substring(0, 8)}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{inv.orderId.substring(0, 8)}...</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(inv.amount)}</td>
                    <td>
                      <span className={`badge ${
                        inv.status === 'PAID' ? 'emerald' :
                        inv.status === 'CANCELLED' ? 'danger' : 'amber'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatDate(inv.issueDate)}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{inv.dueDate ? formatDate(inv.dueDate) : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => generateInvoicePDF(inv)} title="Download PDF">
                          <Download size={14} />
                        </button>
                        {canEdit && inv.status === 'UNPAID' && (
                          <>
                            <button className="btn btn-secondary btn-sm" onClick={() => updateStatus(inv.id, 'PAID')}>Mark Paid</button>
                            <button className="btn btn-danger btn-sm" onClick={() => updateStatus(inv.id, 'CANCELLED')}>Cancel</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2 className="modal-title">New Invoice</h2>
              <button className="modal-close" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Sales Order</label>
                <select 
                  className="form-input" 
                  value={form.orderId} 
                  onChange={(e) => {
                    const oId = e.target.value;
                    const order = orders.find(o => o.id === oId);
                    setForm({ ...form, orderId: oId, amount: order ? String(order.totalAmount) : '' });
                  }} 
                  required
                >
                  <option value="">Select order</option>
                  {orders.map((o: any) => (
                    <option key={o.id} value={o.id}>
                      Order {o.id.substring(0,8)} - {formatCurrency(o.totalAmount)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Amount</label>
                <input 
                  className="form-input" 
                  type="number" 
                  step="0.01" 
                  value={form.amount} 
                  onChange={(e) => setForm({ ...form, amount: e.target.value })} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Due Date (Optional)</label>
                <input 
                  className="form-input" 
                  type="date" 
                  value={form.dueDate} 
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })} 
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
