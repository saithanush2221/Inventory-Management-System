import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

const navSections = [
  {
    title: 'Sales',
    items: [
      { label: 'Customers', href: '/customers', icon: '👥' },
      { label: 'Sales Orders', href: '/orders', icon: '🛒' },
      { label: 'Invoices', href: '/invoices', icon: '📄' },
    ]
  },
  {
    title: 'Purchases',
    items: [
      { label: 'Suppliers', href: '/suppliers', icon: '🏭' },
      { label: 'Purchase Orders', href: '/purchase-orders', icon: '🛍️' },
    ]
  },
  {
    title: 'Inventory',
    items: [
      { label: 'Products', href: '/products', icon: '📦' },
      { label: 'Warehouses', href: '/warehouses', icon: '🏢' },
    ]
  },
  {
    title: 'Analytics',
    items: [
      { label: 'Dashboard', href: '/', icon: '📊' },
      { label: 'Reports', href: '/reports', icon: '📈' },
    ]
  }
];

export default function Sidebar() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">IV</div>
        <div>
          <div className="sidebar-title">InvenTrack</div>
          <div className="sidebar-subtitle">Management System</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navSections.map((section, idx) => (
          <div key={section.title} style={{ marginTop: idx === 0 ? 0 : 8 }}>
            <div className="sidebar-section-title">{section.title}</div>
            {section.items.map((item) => (
              <button
                key={item.href}
                className={`sidebar-link ${router.pathname === item.href ? 'active' : ''}`}
                onClick={() => router.push(item.href)}
              >
                <span className="icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      {user && (
        <div className="sidebar-user">
          <div className="sidebar-avatar">{getInitials(user.email)}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-email">{user.email}</div>
            <div className="sidebar-user-role">{user.role}</div>
          </div>
          <button className="sidebar-logout" onClick={logout} title="Sign out">
            🚪
          </button>
        </div>
      )}
    </aside>
  );
}
