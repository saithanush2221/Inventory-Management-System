import { useEffect, useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Warehouse {
  id: string;
  name: string;
  location: string | null;
  createdAt: string;
  _count?: { inventoryLogs: number };
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [form, setForm] = useState({ name: '', location: '' });
  const [transferForm, setTransferForm] = useState({ productId: '', fromWarehouseId: '', toWarehouseId: '', quantity: '' });
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const fetchWarehouses = () => {
    setLoading(true);
    api.get('/warehouses')
      .then((res) => setWarehouses(res.data))
      .catch(() => toast.error('Failed to load warehouses'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWarehouses();
    api.get('/products').then((res) => setProducts(res.data)).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', location: '' });
    setShowModal(true);
  };

  const openEdit = (w: Warehouse) => {
    setEditing(w);
    setForm({ name: w.name, location: w.location || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: form.name, location: form.location || undefined };
    try {
      if (editing) {
        await api.put(`/warehouses/${editing.id}`, payload);
        toast.success('Warehouse updated');
      } else {
        await api.post('/warehouses', payload);
        toast.success('Warehouse created');
      }
      setShowModal(false);
      fetchWarehouses();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this warehouse?')) return;
    try {
      await api.delete(`/warehouses/${id}`);
      toast.success('Warehouse deleted');
      fetchWarehouses();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/warehouses/transfer', {
        productId: transferForm.productId,
        fromWarehouseId: transferForm.fromWarehouseId,
        toWarehouseId: transferForm.toWarehouseId,
        quantity: parseInt(transferForm.quantity),
      });
      toast.success('Stock transfer recorded');
      setShowTransfer(false);
      setTransferForm({ productId: '', fromWarehouseId: '', toWarehouseId: '', quantity: '' });
      fetchWarehouses();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Transfer failed');
    }
  };

  return (
    <Layout>
      <Head>
        <title>Warehouses — InvenTrack</title>
        <meta name="description" content="Manage warehouses and stock transfers" />
      </Head>

      <div className="page-header">
        <div>
          <h1 className="page-title">Warehouses</h1>
          <p className="page-description">Manage storage locations and stock movements</p>
        </div>
        {canEdit && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={() => setShowTransfer(true)}>🔄 Transfer Stock</button>
            <button className="btn btn-primary" onClick={openCreate}>+ Add Warehouse</button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : warehouses.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <div className="icon">🏢</div>
            <h3>No warehouses yet</h3>
            <p>Add your first warehouse</p>
          </div>
        </div>
      ) : (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {warehouses.map((w) => (
            <div key={w.id} className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{w.name}</h3>
                  {w.location && <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>📍 {w.location}</div>}
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--accent-blue-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  🏢
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
                <div style={{ flex: 1, padding: '10px 0', textAlign: 'center', background: 'rgba(15,25,50,0.5)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{w._count?.inventoryLogs || 0}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Log Entries</div>
                </div>
              </div>
              {canEdit && (
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(w)}>Edit</button>
                  {user?.role === 'ADMIN' && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(w.id)}>Delete</button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Warehouse Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Edit Warehouse' : 'New Warehouse'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-input" value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} placeholder="e.g. Building A, Floor 2" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransfer && (
        <div className="modal-overlay" onClick={() => setShowTransfer(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Transfer Stock</h2>
              <button className="modal-close" onClick={() => setShowTransfer(false)}>×</button>
            </div>
            <form onSubmit={handleTransfer}>
              <div className="form-group">
                <label className="form-label">Product</label>
                <select className="form-input" value={transferForm.productId} onChange={(e) => setTransferForm({...transferForm, productId: e.target.value})} required>
                  <option value="">Select product</option>
                  {products.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name} (Qty: {p.quantity})</option>
                  ))}
                </select>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">From Warehouse</label>
                  <select className="form-input" value={transferForm.fromWarehouseId} onChange={(e) => setTransferForm({...transferForm, fromWarehouseId: e.target.value})} required>
                    <option value="">Select source</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">To Warehouse</label>
                  <select className="form-input" value={transferForm.toWarehouseId} onChange={(e) => setTransferForm({...transferForm, toWarehouseId: e.target.value})} required>
                    <option value="">Select destination</option>
                    {warehouses.filter(w => w.id !== transferForm.fromWarehouseId).map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input className="form-input" type="number" min="1" value={transferForm.quantity} onChange={(e) => setTransferForm({...transferForm, quantity: e.target.value})} required />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTransfer(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
