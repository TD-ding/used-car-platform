import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '', email: '', phone: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      return setError('两次密码不一致');
    }
    setSubmitting(true);
    try {
      await register({ username: form.username, password: form.password, email: form.email, phone: form.phone });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || '注册失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span style={{ fontSize: '48px' }}>🚗</span>
          <h1>创建账号</h1>
          <p style={{ color: 'var(--gray-500)', marginTop: '4px' }}>注册一个二手车交易平台账号</p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用户名</label>
            <div className="input-with-icon">
              <span className="input-icon">👤</span>
              <input name="username" type="text" className="form-control" placeholder="3-50个字符"
                value={form.username} onChange={handleChange} required minLength={3} />
            </div>
          </div>
          <div className="form-group">
            <label>密码</label>
            <div className="input-with-icon">
              <span className="input-icon">🔒</span>
              <input name="password" type="password" className="form-control" placeholder="至少6位"
                value={form.password} onChange={handleChange} required minLength={6} />
            </div>
          </div>
          <div className="form-group">
            <label>确认密码</label>
            <div className="input-with-icon">
              <span className="input-icon">🔒</span>
              <input name="confirmPassword" type="password" className="form-control" placeholder="再次输入密码"
                value={form.confirmPassword} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-group">
            <label>邮箱（选填）</label>
            <div className="input-with-icon">
              <span className="input-icon">📧</span>
              <input name="email" type="email" className="form-control" placeholder="example@email.com"
                value={form.email} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label>手机号（选填）</label>
            <div className="input-with-icon">
              <span className="input-icon">📱</span>
              <input name="phone" type="tel" className="form-control" placeholder="13800138000"
                value={form.phone} onChange={handleChange} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={submitting}>
            {submitting ? '注册中...' : '注册'}
          </button>
        </form>
        <p className="auth-footer">
          已有账号？ <Link to="/login">去登录</Link>
        </p>
      </div>
    </div>
  );
}
