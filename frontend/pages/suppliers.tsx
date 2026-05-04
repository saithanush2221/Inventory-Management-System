import { useEffect, useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  contactInfo: string | null;
  createdAt: string;
  _count?: { products: number };
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', contactInfo: '' });
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const fetchSuppliers = () => {
    setLoading(true);
    api.get('/suppliers')
      .then((res) => setSuppliers(res.data))
      .catch(() => toast.error('Failed to load suppliers'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', phone: '', contactInfo: '' });
    setShowModal(true);
  };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({ name: s.name, email: s.email || '', phone: s.phone || '', contactInfo: s.contactInfo || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      email: form.email || undefined,
      phone: form.phone || undefined,
      contactInfo: form.contactInfo || undefined,
    };
    try {
      if (editing) {
        await api.put(`/suppliers/${editing.id}`, payload);
        toast.success('Supplier updated');
      } else {
        await api.post('/suppliers', payload);
        toast.success('Supplier created');
      }
      setShowModal(false);
      fetchSuppliers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this supplier?')) return;
    try {
      await api.delete(`/suppliers/${id}`);
      toast.success('Supplier deleted');
      fetchSuppliers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  return (
    <Layout>
      <Head>
        <title>Suppliers — InvenTrack</title>
        <meta name="description" content="Manage your supplier network" />
      </Head>

      <div className="page-header">
        <div>
          <h1 className="page-title">Suppliers</h1>
          <p className="page-description">Manage your supplier directory and contacts</p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={openCreate}>+ Add Supplier</button>
        )}
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : suppliers.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <div className="icon">🏭</div>
            <h3>No suppliers yet</h3>
            <p>Add your first supplier</p>
          </div>
        </div>
      ) : (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {suppliers.map((s) => (
            <div key={s.id} className="glass-card" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{s.name}</h3>
                  <span className="badge blue">{s._count?.products || 0} products</span>
                </div>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'var(--accent-violet-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  🏭
                </div>
              </div>
              {s.email && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>📧 {s.email}</div>}
              {s.phone && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>📞 {s.phone}</div>}
              {s.contactInfo && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{s.contactInfo}</div>}
              {canEdit && (
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>Edit</button>
                  {user?.role === 'ADMIN' && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>Delete</button>
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
              <h2 className="modal-title">{editing ? 'Edit Supplier' : 'New Supplier'}</h2>
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
                <label className="form-label">Additional Info</label>
                <input className="form-input" value={form.contactInfo} onChange={(e) => setForm({...form, contactInfo: e.target.value})} placeholder="Notes about this supplier" />
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
