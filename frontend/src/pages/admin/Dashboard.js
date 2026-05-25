import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pendingVehicles, setPendingVehicles] = useState([]);

  useEffect(() => {
    api.get('/admin/stats').then(res => setStats(res.data));
    api.get('/admin/vehicles/pending').then(res => setPendingVehicles(res.data));
  }, []);

  const handleReview = async (id, status) => {
    try {
      await api.put(`/admin/vehicles/${id}/review`, { status });
      setPendingVehicles(pendingVehicles.filter(v => v.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || '操作失败');
    }
  };

  if (!stats) return <div className="loading">加载中...</div>;

  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <Link to="/admin" style={{ fontWeight: '600' }}>仪表盘</Link>
        <Link to="/admin/users">用户管理</Link>
        <Link to="/admin/vehicles">车辆管理</Link>
        <Link to="/admin/config">系统配置</Link>
      </div>
      <div className="admin-content">
        <h1 style={{ marginBottom: '24px' }}>管理后台</h1>

        <div className="grid grid-4" style={{ marginBottom: '32px' }}>
          <div className="stat-card">
            <h3>总用户</h3>
            <div className="stat-value">{stats.users}</div>
          </div>
          <div className="stat-card">
            <h3>在售车辆</h3>
            <div className="stat-value">{stats.vehicles}</div>
          </div>
          <div className="stat-card">
            <h3>待审核</h3>
            <div className="stat-value" style={{ color: 'var(--warning)' }}>{stats.pending}</div>
          </div>
          <div className="stat-card">
            <h3>消息数</h3>
            <div className="stat-value">{stats.messages}</div>
          </div>
        </div>

        {/* 待审核车辆 */}
        <h2 style={{ marginBottom: '16px' }}>待审核车辆 ({pendingVehicles.length})</h2>
        {pendingVehicles.length === 0 ? (
          <div className="card"><div className="card-body"><p style={{ color: 'var(--gray-500)' }}>暂无待审核车辆</p></div></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>ID</th><th>品牌/型号</th><th>价格</th><th>发布者</th><th>时间</th><th>操作</th></tr>
              </thead>
              <tbody>
                {pendingVehicles.map(v => (
                  <tr key={v.id}>
                    <td>{v.id}</td>
                    <td>{v.brand} {v.model}</td>
                    <td>¥{(v.price / 10000).toFixed(2)}万</td>
                    <td>{v.seller_name}</td>
                    <td>{new Date(v.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-success btn-sm" onClick={() => handleReview(v.id, 'approved')}>通过</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleReview(v.id, 'rejected')} style={{ marginLeft: '8px' }}>拒绝</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
