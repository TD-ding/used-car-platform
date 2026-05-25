import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const roleLabel = user ? { admin: '管理员', super: '超级用户', user: '普通用户' }[user.role] : '';

  const navLinks = [
    { to: '/', label: '首页' },
    { to: '/vehicles', label: '车辆市场' },
    ...(user ? [
      { to: '/post', label: '发布车辆' },
      { to: '/favorites', label: '收藏' },
      { to: '/messages', label: '消息' },
    ] : []),
    ...(user && ['admin', 'super'].includes(user.role) ? [{ to: '/analysis', label: '数据分析' }] : []),
    ...(user && user.role === 'admin' ? [{ to: '/admin', label: '管理后台' }] : []),
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span style={{ fontSize: '24px' }}>🚗</span>
          <span>二手车交易平台</span>
        </Link>

        {/* 桌面端导航 */}
        <div className="navbar-links">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to}
              className={location.pathname === link.to ? 'active' : ''}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="navbar-user">
          {user ? (
            <>
              <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: 'var(--gray-700)' }}>
                <span style={{
                  width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, color: 'var(--primary)'
                }}>
                  {user.username[0].toUpperCase()}
                </span>
                <span style={{ fontSize: '14px' }}>{user.username}</span>
              </Link>
              <span className={`role-badge role-${user.role}`}>{roleLabel}</span>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>退出</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline btn-sm">登录</Link>
              <Link to="/register" className="btn btn-primary btn-sm">注册</Link>
            </>
          )}
        </div>

        {/* 移动端菜单按钮 */}
        <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* 移动端菜单 */}
      {mobileOpen && (
        <div className="mobile-menu">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}
              className={location.pathname === link.to ? 'active' : ''}>
              {link.label}
            </Link>
          ))}
          {user ? (
            <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="btn btn-outline" style={{ width: '100%', marginTop: '8px' }}>退出登录</button>
          ) : (
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <Link to="/login" onClick={() => setMobileOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>登录</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="btn btn-primary" style={{ flex: 1 }}>注册</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
