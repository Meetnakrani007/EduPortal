import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api';

const VerifyOTP = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, otp });
      setSuccess('OTP verified. You can now reset your password.');
      setTimeout(() => navigate('/reset-password', { state: { email } }), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ minHeight: 'calc(100vh - 70px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', backgroundColor: 'var(--bg-secondary)' }}>
      <div className="auth-container" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="card">
          <div className="card-header" style={{ textAlign: 'center' }}>
            <h1 className="card-title" style={{ fontSize: '24px', marginBottom: '8px' }}>Verify OTP</h1>
            <p className="card-subtitle">Enter the OTP sent to your Gmail</p>
          </div>
          {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
          {success && <div style={{ color: 'green', marginBottom: 12 }}>{success}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="otp" className="form-label">OTP</label>
              <input
                type="text"
                id="otp"
                name="otp"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                className="form-input"
                placeholder="Enter OTP"
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP; 