import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.post('/auth/request-otp', { email });
      setSuccess('OTP sent to your Gmail. Please check your inbox.');
      setTimeout(() => navigate('/verify-otp', { state: { email } }), 1200);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to send OTP.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ minHeight: 'calc(100vh - 70px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', backgroundColor: 'var(--bg-secondary)' }}>
      <div className="auth-container" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="card">
          <div className="card-header" style={{ textAlign: 'center' }}>
            <h1 className="card-title" style={{ fontSize: '24px', marginBottom: '8px' }}>Forgot Password</h1>
            <p className="card-subtitle">Enter your Gmail to receive an OTP</p>
          </div>
          {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
          {success && <div style={{ color: 'green', marginBottom: 12 }}>{success}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">Gmail Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="form-input"
                placeholder="Enter your Gmail"
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword; 