import { useState } from 'react';
import toast from 'react-hot-toast';
import { FaChartLine, FaShieldAlt, FaUserCheck } from 'react-icons/fa';
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

  const handleOwnerPass = async () => {
    try {
      setLoading(true);
      const res = await api.post('/auth/owner-pass');
      const { token, user } = res.data;
      toast.success(`Welcome back, ${user.name}!`);
      onLoginSuccess(user, token);
    } catch (err: any) {
      toast.error('Sign-in failed');
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
      <div className="glass-panel" style={{ width: '100%', maxWidth: 440, padding: '3rem 2.25rem', textAlign: 'center' }}>
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
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 6, marginBottom: '2rem' }}>
          Sign in to access studio financial intelligence & server metrics
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          {loading ? (
            <div style={{ color: 'var(--primary)', fontWeight: 600, padding: '1rem' }}>Authenticating...</div>
          ) : (
            <>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error('Google Sign In failed. You can use Studio Owner Pass below.')}
                theme="filled_black"
                shape="pill"
                size="large"
                width="320"
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', margin: '0.5rem 0' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OR</span>
                <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
              </div>

              <button
                onClick={handleOwnerPass}
                className="btn-primary"
                style={{
                  width: '100%', maxWidth: 320, justifyContent: 'center', padding: '0.75rem', borderRadius: 24,
                  background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', fontWeight: 700, fontSize: '0.9rem'
                }}
              >
                <FaUserCheck /> Sign In as Studio Owner (Ben Roberts)
              </button>
            </>
          )}
        </div>

        <div style={{ marginTop: '2.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          <FaShieldAlt style={{ color: '#10b981' }} /> Encrypted Studio OAuth 2.0 Security Gate
        </div>
      </div>
    </div>
  );
}
