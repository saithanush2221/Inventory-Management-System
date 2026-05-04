import { useEffect, useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
  _count?: { orders: number };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const fetchCustomers = () => {
    setLoading(true);
    api.get('/customers')
      .then((res) => setCustomers(res.data))
      .catch(() => toast.error('Failed to load customers'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCustomers(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', phone: '', address: '' });
    setShowModal(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({ name: c.name, email: c.email || '', phone: c.phone || '', address: c.address || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      email: form.email || undefined,
      phone: form.phone || undefined,
      address: form.address || undefined,
    };
    try {
      if (editing) {
        await api.put(`/customers/${editing.id}`, payload);
        toast.success('Customer updated');
      } else {
        await api.post('/customers', payload);
        toast.success('Customer created');
      }
      setShowModal(false);
      fetchCustomers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this customer?')) return;
    try {
      await api.delete(`/customers/${id}`);
      toast.success('Customer deleted');
      fetchCustomers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  return (
    <Layout>
      <Head>
        <title>Customers — InvenTrack</title>
        <meta name="description" content="Manage your customers" />
      </Head>

      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-description">Manage your customer database</p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={openCreate}>+ Add Customer</button>
        )}
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : customers.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <div className="icon">👥</div>
            <h3>No customers yet</h3>
            <p>Add your first customer</p>
          </div>
        </div>
      ) : (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {customers.map((c) => (
            <div key={c.id} className="glass-card" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{c.name}</h3>
                  <span className="badge blue">{c._count?.orders || 0} orders</span>
                </div>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'var(--accent-blue-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  👥
                </div>
              </div>
              {c.email && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>📧 {c.email}</div>}
              {c.phone && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>📞 {c.phone}</div>}
              {c.address && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{c.address}</div>}
              {canEdit && (
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>Edit</button>
                  {user?.role === 'ADMIN' && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>Delete</button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Edit Customer' : 'New Customer'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-input" value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
