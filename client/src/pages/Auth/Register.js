import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast/ToastProvider';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    department: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { register } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      const { confirmPassword, ...userData } = formData;
      const result = await register(userData);
      
      if (result.success) {
        show('success', 'Account created successfully');
        navigate('/dashboard');
      } else {
        show('error', result.message || 'Registration failed');
        setErrors({ general: result.message });
      }
    } catch (error) {
      show('error', 'An unexpected error occurred');
      setErrors({ general: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ 
      minHeight: 'calc(100vh - 70px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      backgroundColor: 'var(--bg-secondary)'
    }}>
      <div className="auth-container" style={{
        width: '100%',
        maxWidth: '450px'
      }}>
        <div className="card">
          <div className="card-header" style={{ textAlign: 'center' }}>
            <h1 className="card-title" style={{ fontSize: '28px', marginBottom: '8px' }}>
              Create Account
            </h1>
            <p className="card-subtitle">
              Join the CharusatStudentCare community
            </p>
          </div>

          {errors.general && (
            <div style={{
              padding: '12px',
              backgroundColor: '#FEE2E2',
              border: '1px solid #FECACA',
              borderRadius: '6px',
              color: '#DC2626',
              fontSize: '14px',
              marginBottom: '20px'
            }}>
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter your full name"
                disabled={loading}
              />
              {errors.name && (
                <div className="form-error">{errors.name}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter your email"
                disabled={loading}
              />
              {errors.email && (
                <div className="form-error">{errors.email}</div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <div className="input-password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Create password"
                    disabled={loading}
                    style={{ paddingRight: '40px' }}
                  />
                  <span
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="input-password-eye"
                    tabIndex={0}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setShowPassword(prev => !prev); }}
                  >
                    {showPassword ? (
                      // Eye-off SVG
                      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-5 0-9.27-3.11-11-7 1.21-2.7 3.29-4.88 5.94-6.06M1 1l22 22"/><path d="M9.53 9.53A3.5 3.5 0 0 0 12 16.5c1.38 0 2.63-.83 3.16-2.03"/><path d="M14.47 14.47A3.5 3.5 0 0 1 12 7.5c-.62 0-1.2.16-1.7.44"/></svg>
                    ) : (
                      // Eye SVG
                      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </span>
                </div>
                {errors.password && (
                  <div className="form-error">{errors.password}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password
                </label>
                <div className="input-password-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Confirm password"
                    disabled={loading}
                    style={{ paddingRight: '40px' }}
                  />
                  <span
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="input-password-eye"
                    tabIndex={0}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setShowConfirmPassword(prev => !prev); }}
                  >
                    {showConfirmPassword ? (
                      // Eye-off SVG
                      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-5 0-9.27-3.11-11-7 1.21-2.7 3.29-4.88 5.94-6.06M1 1l22 22"/><path d="M9.53 9.53A3.5 3.5 0 0 0 12 16.5c1.38 0 2.63-.83 3.16-2.03"/><path d="M14.47 14.47A3.5 3.5 0 0 1 12 7.5c-.62 0-1.2.16-1.7.44"/></svg>
                    ) : (
                      // Eye SVG
                      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </span>
                </div>
                {errors.confirmPassword && (
                  <div className="form-error">{errors.confirmPassword}</div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="role" className="form-label">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="form-select"
                disabled={loading}
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
              {errors.role && (
                <div className="form-error">{errors.role}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="department" className="form-label">
                Department (Optional)
              </label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Computer Science, Mathematics"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: '20px' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div style={{ 
            textAlign: 'center',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-color)'
          }}>
            <p style={{ color: 'var(--text-secondary)' }}>
              Already have an account?{' '}
              <Link 
                to="/login" 
                style={{ 
                  color: 'var(--primary-color)',
                  textDecoration: 'none',
                  fontWeight: '500'
                }}
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;