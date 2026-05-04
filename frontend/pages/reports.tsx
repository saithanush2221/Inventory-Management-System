import { useEffect, useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import api from '../lib/api';
import toast from 'react-hot-toast';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);
}

export default function ReportsPage() {
  const [inventoryData, setInventoryData] = useState<any>(null);
  const [salesData, setSalesData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/reports/inventory'),
      api.get('/reports/sales', { params: dateRange }).catch(() => ({ data: null })),
    ])
      .then(([inv, sales]) => {
        setInventoryData(inv.data);
        if (sales.data) setSalesData(sales.data);
      })
      .catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoading(false));
  }, [dateRange]);

  const categories = inventoryData?.products?.reduce((acc: any, p: any) => {
    const cat = p.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = { count: 0, value: 0, quantity: 0 };
    acc[cat].count += 1;
    acc[cat].value += p.quantity * p.purchasePrice;
    acc[cat].quantity += p.quantity;
    return acc;
  }, {}) || {};

  return (
    <Layout>
      <Head>
        <title>Reports — InvenTrack</title>
        <meta name="description" content="Inventory and sales reports" />
      </Head>

      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-description">Analytics and insights for your inventory</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="stats-grid">
            <div className="glass-card stat-card emerald">
              <div className="stat-icon emerald">💰</div>
              <div className="stat-value">{formatCurrency(inventoryData?.valuation || 0)}</div>
              <div className="stat-label">Total Inventory Value (Cost)</div>
            </div>
            <div className="glass-card stat-card blue">
              <div className="stat-icon blue">📦</div>
              <div className="stat-value">{inventoryData?.productCount || 0}</div>
              <div className="stat-label">Total Products</div>
            </div>
            <div className="glass-card stat-card amber">
              <div className="stat-icon amber">📊</div>
              <div className="stat-value">{salesData?.totalOrders || 0}</div>
              <div className="stat-label">Orders (Period)</div>
            </div>
            <div className="glass-card stat-card violet">
              <div className="stat-icon violet">💎</div>
              <div className="stat-value">{formatCurrency(salesData?.totalRevenue || 0)}</div>
              <div className="stat-label">Revenue (Period)</div>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="glass-card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Sales Report Period</h3>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Start Date</label>
                <input
                  className="form-input"
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">End Date</label>
                <input
                  className="form-input"
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Inventory by Category */}
          <div className="glass-card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Inventory by Category</h3>
            {Object.keys(categories).length === 0 ? (
              <div className="empty-state"><p>No inventory data</p></div>
            ) : (
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Products</th>
                      <th>Total Quantity</th>
                      <th>Total Value</th>
                      <th>Distribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(categories).map(([cat, data]: [string, any]) => {
                      const pct = inventoryData?.valuation ? (data.value / inventoryData.valuation * 100) : 0;
                      return (
                        <tr key={cat}>
                          <td style={{ fontWeight: 600 }}>{cat}</td>
                          <td><span className="badge blue">{data.count}</span></td>
                          <td>{data.quantity.toLocaleString()}</td>
                          <td>{formatCurrency(data.value)}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, height: 6, background: 'rgba(60,100,180,0.15)', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{
                                  width: `${pct}%`,
                                  height: '100%',
                                  background: 'var(--gradient-primary)',
                                  borderRadius: 3,
                                  transition: 'width 0.5s ease',
                                }} />
                              </div>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 36 }}>{pct.toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="glass-card">
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Product Valuation Details</h3>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Qty</th>
                    <th>Cost Price</th>
                    <th>Sell Price</th>
                    <th>Total Value</th>
                    <th>Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {(inventoryData?.products || []).map((p: any) => {
                    const margin = p.sellingPrice > 0 ? ((p.sellingPrice - p.purchasePrice) / p.sellingPrice * 100) : 0;
                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td><span className="badge blue">{p.sku}</span></td>
                        <td>{p.category || '—'}</td>
                        <td>
                          <span className={`badge ${p.quantity < 10 ? 'rose' : p.quantity < 50 ? 'amber' : 'emerald'}`}>
                            {p.quantity}
                          </span>
                        </td>
                        <td>{formatCurrency(p.purchasePrice)}</td>
                        <td>{formatCurrency(p.sellingPrice)}</td>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(p.quantity * p.purchasePrice)}</td>
                        <td>
                          <span className={`badge ${margin > 50 ? 'emerald' : margin > 30 ? 'amber' : 'rose'}`}>
                            {margin.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
