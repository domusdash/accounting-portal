import React, { useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { FaLock, FaEnvelope, FaSpinner, FaChartLine } from 'react-icons/fa';

interface LoginProps {
  onLoginSuccess: (user: any, token: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('benjosephroberts@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      toast.success('Welcome back, Ben!');
      onLoginSuccess(res.data.user, res.data.token);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      background: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.15) 0%, rgba(9, 13, 22, 0.95) 100%)'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: 420, padding: '2.5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 54, height: 54, borderRadius: 16, background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)'
          }}>
            <FaChartLine style={{ fontSize: '1.6rem', color: '#fff' }} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            Daily Flow Accounting
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 6 }}>
            Sign in to access live infrastructure cost & revenue intelligence
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Email Address
            </label>
            <div style={{ position: 'relative', marginTop: 6 }}>
              <FaEnvelope style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="benjosephroberts@gmail.com"
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.6rem',
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid var(--glass-border)',
                  color: '#fff',
                  borderRadius: 10,
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Password
            </label>
            <div style={{ position: 'relative', marginTop: 6 }}>
              <FaLock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.6rem',
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid var(--glass-border)',
                  color: '#fff',
                  borderRadius: 10,
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '0.8rem', marginTop: '0.5rem', fontSize: '1rem' }}
          >
            {loading ? <><FaSpinner className="spin" /> Authenticating...</> : 'Sign In to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
