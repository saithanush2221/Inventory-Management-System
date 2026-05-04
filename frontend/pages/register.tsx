import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STAFF');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await register(email, password, role);
      toast.success('Account created!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Create Account — InvenTrack</title>
        <meta name="description" content="Create your InvenTrack account" />
      </Head>
      <div className="auth-page">
        <div className="auth-bg" />
        <div className="auth-card">
          <div className="auth-logo">IV</div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Get started with InvenTrack</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
                className="form-input"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                className="form-input"
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-role">Role</label>
              <select
                id="reg-role"
                className="form-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="STAFF">Staff</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Account'}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account?{' '}
            <a onClick={() => router.push('/login')} style={{ cursor: 'pointer' }}>
              Sign in
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
