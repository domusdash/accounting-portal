import { useState } from 'react';
import toast from 'react-hot-toast';
import { FaChartLine, FaShieldAlt } from 'react-icons/fa';
import { GoogleLogin } from '@react-oauth/google';
import api from '../api';

interface LoginProps {
  onLoginSuccess: (user: any, token: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setLoading(true);
      const res = await api.post('/auth/google', { credential: credentialResponse.credential });
      const { token, user } = res.data;

      toast.success(`Welcome back, ${user.name}!`);
      onLoginSuccess(user, token);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Google Sign-In failed or access denied');
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
      <div className="glass-panel" style={{ width: '100%', maxWidth: 420, padding: '3rem 2rem', textAlign: 'center' }}>
        <div style={{
          width: 60, height: 60, borderRadius: 18, background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem',
          boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)'
        }}>
          <FaChartLine style={{ fontSize: '1.8rem', color: '#fff' }} />
        </div>

        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
          Daily Flow Accounting
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 6, marginBottom: '2.25rem' }}>
          Sign in with Google to access studio financial intelligence & server metrics
        </p>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {loading ? (
            <div style={{ color: 'var(--primary)', fontWeight: 600 }}>Authenticating with Google...</div>
          ) : (
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Google Sign In failed')}
              theme="filled_black"
              shape="pill"
              size="large"
              width="320"
            />
          )}
        </div>

        <div style={{ marginTop: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          <FaShieldAlt style={{ color: '#10b981' }} /> Encrypted OAuth 2.0 Studio Security Gate
        </div>
      </div>
    </div>
  );
}
