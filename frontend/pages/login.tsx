import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@inventory.com');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign In — InvenTrack</title>
        <meta name="description" content="Sign in to your InvenTrack inventory management dashboard" />
      </Head>
      <div className="auth-page">
        <div className="auth-bg" />
        <div className="auth-card">
          <div className="auth-logo">IV</div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to InvenTrack</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email</label>
              <input
                id="login-email"
                className="form-input"
                type="email"
                placeholder="admin@inventory.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-footer">
            Don&apos;t have an account?{' '}
            <a onClick={() => router.push('/register')} style={{ cursor: 'pointer' }}>
              Create one
            </a>
          </div>

          <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(59,130,246,0.08)', borderRadius: 10, fontSize: 12, color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--accent-blue)' }}>Demo Accounts:</strong>
            <div style={{ marginTop: 6, lineHeight: 1.8 }}>
              Admin: admin@inventory.com / admin123<br />
              Manager: manager@inventory.com / manager123<br />
              Staff: staff@inventory.com / staff123
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
