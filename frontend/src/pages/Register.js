import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '', email: '', phone: '' });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      return setError('两次密码不一致');
    }
    try {
      await register({ username: form.username, password: form.password, email: form.email, phone: form.phone });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || '注册失败');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto' }}>
      <div className="card">
        <div className="card-body" style={{ padding: '32px' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '24px', fontSize: '24px' }}>注册</h1>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>用户名</label>
              <input name="username" type="text" className="form-control" value={form.username} onChange={handleChange} required minLength={3} />
            </div>
            <div className="form-group">
              <label>密码</label>
              <input name="password" type="password" className="form-control" value={form.password} onChange={handleChange} required minLength={6} />
            </div>
            <div className="form-group">
              <label>确认密码</label>
              <input name="confirmPassword" type="password" className="form-control" value={form.confirmPassword} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>邮箱（选填）</label>
              <input name="email" type="email" className="form-control" value={form.email} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>手机号（选填）</label>
              <input name="phone" type="tel" className="form-control" value={form.phone} onChange={handleChange} />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>注册</button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '16px', color: 'var(--gray-500)' }}>
            已有账号？ <Link to="/login" style={{ color: 'var(--primary)' }}>去登录</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
