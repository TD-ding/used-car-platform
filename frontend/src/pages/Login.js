import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || '登录失败');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto' }}>
      <div className="card">
        <div className="card-body" style={{ padding: '32px' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '24px', fontSize: '24px' }}>登录</h1>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>用户名</label>
              <input type="text" className="form-control" value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>密码</label>
              <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>登录</button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '16px', color: 'var(--gray-500)' }}>
            还没有账号？ <Link to="/register" style={{ color: 'var(--primary)' }}>去注册</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
