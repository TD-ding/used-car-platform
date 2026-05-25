import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || '登录失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span style={{ fontSize: '48px' }}>🚗</span>
          <h1>欢迎回来</h1>
          <p style={{ color: 'var(--gray-500)', marginTop: '4px' }}>登录你的二手车交易平台账号</p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用户名</label>
            <div className="input-with-icon">
              <span className="input-icon">👤</span>
              <input type="text" className="form-control" placeholder="请输入用户名"
                value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
          </div>
          <div className="form-group">
            <label>密码</label>
            <div className="input-with-icon">
              <span className="input-icon">🔒</span>
              <input type="password" className="form-control" placeholder="请输入密码"
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={submitting}>
            {submitting ? '登录中...' : '登录'}
          </button>
        </form>
        <p className="auth-footer">
          还没有账号？ <Link to="/register">去注册</Link>
        </p>
      </div>
    </div>
  );
}
