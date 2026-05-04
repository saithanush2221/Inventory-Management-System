import { useEffect, useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  supplierId: string | null;
  supplier?: { id: string; name: string } | null;
  createdAt: string;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: '', sku: '', category: '', purchasePrice: '', sellingPrice: '', quantity: '', supplierId: '' });
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const fetchProducts = () => {
    setLoading(true);
    const params: any = {};
    if (search) params.search = search;
    api.get('/products', { params })
      .then((res) => setProducts(res.data))
      .catch((err) => toast.error('Failed to load products'))
      .finally(() => setLoading(false));
  };

  const fetchSuppliers = () => {
    api.get('/suppliers').then((res) => setSuppliers(res.data)).catch(() => {});
  };

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const openCreate = () => {
    setEditingProduct(null);
    setForm({ name: '', sku: '', category: '', purchasePrice: '', sellingPrice: '', quantity: '', supplierId: '' });
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({
      name: p.name,
      sku: p.sku,
      category: p.category || '',
      purchasePrice: String(p.purchasePrice),
      sellingPrice: String(p.sellingPrice),
      quantity: String(p.quantity),
      supplierId: p.supplierId || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      sku: form.sku,
      category: form.category || undefined,
      purchasePrice: parseFloat(form.purchasePrice),
      sellingPrice: parseFloat(form.sellingPrice),
      quantity: parseInt(form.quantity),
      supplierId: form.supplierId || undefined,
    };
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
        toast.success('Product updated');
      } else {
        await api.post('/products', payload);
        toast.success('Product created');
      }
      setShowModal(false);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  return (
    <Layout>
      <Head>
        <title>Products — InvenTrack</title>
        <meta name="description" content="Manage your product inventory" />
      </Head>

      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-description">Manage your product catalog and inventory levels</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {canEdit && (
            <button className="btn btn-primary" onClick={openCreate}>
              + Add Product
            </button>
          )}
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📦</div>
            <h3>No products found</h3>
            <p>{search ? 'Try a different search term' : 'Add your first product to get started'}</p>
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Purchase</th>
                  <th>Selling</th>
                  <th>Qty</th>
                  <th>Supplier</th>
                  {canEdit && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td><span className="badge blue">{p.sku}</span></td>
                    <td>{p.category || '—'}</td>
                    <td>{formatCurrency(p.purchasePrice)}</td>
                    <td>{formatCurrency(p.sellingPrice)}</td>
                    <td>
                      <span className={`badge ${p.quantity < 10 ? 'rose' : p.quantity < 50 ? 'amber' : 'emerald'}`}>
                        {p.quantity}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.supplier?.name || '—'}</td>
                    {canEdit && (
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>Edit</button>
                          {user?.role === 'ADMIN' && (
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Delete</button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingProduct ? 'Edit Product' : 'New Product'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input className="form-input" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU</label>
                  <input className="form-input" value={form.sku} onChange={(e) => setForm({...form, sku: e.target.value})} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input className="form-input" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} placeholder="e.g. Electronics" />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Purchase Price</label>
                  <input className="form-input" type="number" step="0.01" value={form.purchasePrice} onChange={(e) => setForm({...form, purchasePrice: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Selling Price</label>
                  <input className="form-input" type="number" step="0.01" value={form.sellingPrice} onChange={(e) => setForm({...form, sellingPrice: e.target.value})} required />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input className="form-input" type="number" value={form.quantity} onChange={(e) => setForm({...form, quantity: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Supplier</label>
                  <select className="form-input" value={form.supplierId} onChange={(e) => setForm({...form, supplierId: e.target.value})}>
                    <option value="">None</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingProduct ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
