import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const roleLabel = user ? { admin: '管理员', super: '超级用户', user: '普通用户' }[user.role] : '';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">🚗 二手车交易平台</Link>
        <div className="navbar-links">
          <Link to="/">首页</Link>
          <Link to="/vehicles">车辆市场</Link>
          {user && <Link to="/post">发布车辆</Link>}
          {user && <Link to="/favorites">收藏</Link>}
          {user && <Link to="/messages">消息</Link>}
          {user && ['admin', 'super'].includes(user.role) && <Link to="/analysis">数据分析</Link>}
          {user && user.role === 'admin' && <Link to="/admin">管理后台</Link>}
        </div>
        <div className="navbar-user">
          {user ? (
            <>
              <Link to="/profile">{user.username}</Link>
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
      </div>
    </nav>
  );
}
