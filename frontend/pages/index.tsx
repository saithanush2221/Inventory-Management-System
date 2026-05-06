import { useEffect, useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, IndianRupee, ShoppingCart, AlertTriangle, Factory, Building, Gem, TrendingUp } from 'lucide-react';

interface DashboardData {
  stats: {
    productCount: number;
    orderCount: number;
    supplierCount: number;
    warehouseCount: number;
    totalInventoryValue: number;
    totalRetailValue: number;
    lowStockProducts: number;
  };
  salesTrend: { date: string, sales: number }[];
  recentOrders: any[];
  recentLogs: any[];
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/reports/dashboard')
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <Layout>
      <Head>
        <title>Dashboard — InvenTrack Analytics</title>
        <meta name="description" content="InvenTrack industry-ready dashboard" />
      </Head>

      <div className="page-header">
        <div>
          <h1 className="page-title">{getGreeting()}, {user?.email?.split('@')[0]} 👋</h1>
          <p className="page-description">Here&apos;s your daily inventory & sales intelligence.</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : data ? (
        <>
          {/* Main KPIs */}
          <div className="stats-grid">
            <div className="glass-card stat-card blue">
              <div className="stat-icon blue"><Package size={24} /></div>
              <div className="stat-value">{data.stats.productCount}</div>
              <div className="stat-label">Total Products</div>
            </div>
            <div className="glass-card stat-card emerald">
              <div className="stat-icon emerald"><IndianRupee size={24} /></div>
              <div className="stat-value">{formatCurrency(data.stats.totalInventoryValue)}</div>
              <div className="stat-label">Inventory Value</div>
            </div>
            <div className="glass-card stat-card amber">
              <div className="stat-icon amber"><ShoppingCart size={24} /></div>
              <div className="stat-value">{data.stats.orderCount}</div>
              <div className="stat-label">Total Sales Orders</div>
            </div>
            <div className="glass-card stat-card rose">
              <div className="stat-icon rose"><AlertTriangle size={24} /></div>
              <div className="stat-value">{data.stats.lowStockProducts}</div>
              <div className="stat-label">Low Stock Alerts</div>
            </div>
          </div>

          <div className="grid-2" style={{ gridTemplateColumns: '2fr 1fr', marginBottom: 28 }}>
            {/* Chart */}
            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <TrendingUp className="text-blue" size={20} style={{ color: 'var(--accent-blue)' }} />
                <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Sales Trend (Last 7 Days)</h2>
              </div>
              <div style={{ height: 300, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.salesTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 8, color: '#fff' }}
                      itemStyle={{ color: 'var(--accent-blue)' }}
                      formatter={(val: any) => [formatCurrency(Number(val) || 0), 'Sales']}
                    />
                    <Area type="monotone" dataKey="sales" stroke="var(--accent-blue)" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Secondary KPIs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="glass-card stat-card violet" style={{ flex: 1, padding: 24 }}>
                <div className="stat-icon violet"><Factory size={24} /></div>
                <div className="stat-value">{data.stats.supplierCount}</div>
                <div className="stat-label">Active Suppliers</div>
              </div>
              <div className="glass-card stat-card blue" style={{ flex: 1, padding: 24 }}>
                <div className="stat-icon blue"><Building size={24} /></div>
                <div className="stat-value">{data.stats.warehouseCount}</div>
                <div className="stat-label">Warehouses</div>
              </div>
              <div className="glass-card stat-card emerald" style={{ flex: 1, padding: 24 }}>
                <div className="stat-icon emerald"><Gem size={24} /></div>
                <div className="stat-value">{formatCurrency(data.stats.totalRetailValue)}</div>
                <div className="stat-label">Projected Retail Value</div>
              </div>
            </div>
          </div>

          {/* Recent Orders & Activity */}
          <div className="grid-2">
            <div className="glass-card">
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Recent Sales Orders</h2>
              {data.recentOrders.length === 0 ? (
                <div className="empty-state"><p>No orders yet</p></div>
              ) : (
                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Order Ref</th>
                        <th>Status</th>
                        <th>Total Amount</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentOrders.map((order) => (
                        <tr key={order.id}>
                          <td style={{ fontWeight: 600, fontSize: 12 }}>{order.id.substring(0, 8)}...</td>
                          <td>
                            <span className={`badge ${
                              order.status === 'DELIVERED' ? 'emerald' :
                              order.status === 'SHIPPED' ? 'blue' : 'amber'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>{formatCurrency(order.totalAmount)}</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{timeAgo(order.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="glass-card">
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Live Inventory Log</h2>
              {data.recentLogs.length === 0 ? (
                <div className="empty-state"><p>No activity yet</p></div>
              ) : (
                <div className="activity-list">
                  {data.recentLogs.map((log) => (
                    <div key={log.id} className="activity-item">
                      <div className={`activity-dot ${
                        log.change > 0 ? 'emerald' : 
                        log.reason === 'transfer' ? 'blue' : 'rose'
                      }`} />
                      <span className="activity-text">
                        <strong>{log.product?.name || 'Unknown'}</strong>{' '}
                        <span style={{ color: log.change > 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: 600 }}>
                          {log.change > 0 ? `+${log.change}` : log.change}
                        </span> units ({log.reason})
                      </span>
                      <span className="activity-time">{timeAgo(log.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <div className="icon">❌</div>
          <h3>Failed to load analytics</h3>
          <p>Please check your connection or contact support.</p>
        </div>
      )}
    </Layout>
  );
}
