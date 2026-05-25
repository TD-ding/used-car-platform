import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

export default function AdminVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });

  const loadVehicles = (page = 1) => {
    api.get('/admin/vehicles', { params: { page, limit: 20 } }).then(res => {
      setVehicles(res.data.vehicles);
      setPagination(res.data.pagination);
    });
  };

  useEffect(() => { loadVehicles(); }, []);

  const handleReview = async (id, status) => {
    try {
      await api.put(`/admin/vehicles/${id}/review`, { status });
      loadVehicles(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || '操作失败');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除该车辆吗？')) return;
    try {
      await api.delete(`/vehicles/${id}`);
      loadVehicles(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || '删除失败');
    }
  };

  const handleFeature = async (id, featured) => {
    try {
      await api.put(`/vehicles/${id}/feature`, { featured });
      loadVehicles(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || '操作失败');
    }
  };

  const statusMap = {
    pending: { label: '待审核', badge: 'badge-warning' },
    approved: { label: '已通过', badge: 'badge-success' },
    rejected: { label: '已拒绝', badge: 'badge-danger' },
    sold: { label: '已售出', badge: 'badge-info' }
  };

  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <Link to="/admin">仪表盘</Link>
        <Link to="/admin/users">用户管理</Link>
        <Link to="/admin/vehicles" style={{ fontWeight: '600' }}>车辆管理</Link>
        <Link to="/admin/config">系统配置</Link>
      </div>
      <div className="admin-content">
        <h1 style={{ marginBottom: '24px' }}>车辆管理</h1>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>ID</th><th>品牌/型号</th><th>价格</th><th>发布者</th><th>状态</th><th>置顶</th><th>浏览</th><th>操作</th></tr>
            </thead>
            <tbody>
              {vehicles.map(v => (
                <tr key={v.id}>
                  <td>{v.id}</td>
                  <td>{v.brand} {v.model}</td>
                  <td>¥{(v.price / 10000).toFixed(2)}万</td>
                  <td>{v.seller_name}</td>
                  <td><span className={`badge ${statusMap[v.status]?.badge}`}>{statusMap[v.status]?.label}</span></td>
                  <td>{v.is_featured ? '是' : '否'}</td>
                  <td>{v.views}</td>
                  <td>
                    {v.status === 'pending' && (
                      <>
                        <button className="btn btn-success btn-sm" onClick={() => handleReview(v.id, 'approved')}>通过</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleReview(v.id, 'rejected')} style={{ marginLeft: '4px' }}>拒绝</button>
                      </>
                    )}
                    <button className="btn btn-outline btn-sm" onClick={() => handleFeature(v.id, !v.is_featured)} style={{ marginLeft: '4px' }}>
                      {v.is_featured ? '取消置顶' : '置顶'}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(v.id)} style={{ marginLeft: '4px' }}>删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination" style={{ marginTop: '16px' }}>
          <button disabled={pagination.page <= 1} onClick={() => loadVehicles(pagination.page - 1)}>上一页</button>
          <span style={{ padding: '8px' }}>第 {pagination.page} / {pagination.pages} 页</span>
          <button disabled={pagination.page >= pagination.pages} onClick={() => loadVehicles(pagination.page + 1)}>下一页</button>
        </div>
      </div>
    </div>
  );
}
