import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [search, setSearch] = useState('');

  const loadUsers = (page = 1) => {
    api.get('/users', { params: { page, limit: 20, search } }).then(res => {
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    });
  };

  useEffect(() => { loadUsers(); }, []);

  const handleRoleChange = async (id, role) => {
    try {
      await api.put(`/users/${id}`, { role });
      loadUsers(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || '操作失败');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/users/${id}`, { status });
      loadUsers(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || '操作失败');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除该用户吗？')) return;
    try {
      await api.delete(`/users/${id}`);
      loadUsers(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || '删除失败');
    }
  };

  const roleMap = { admin: '管理员', super: '超级用户', user: '普通用户' };

  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <Link to="/admin">仪表盘</Link>
        <Link to="/admin/users" style={{ fontWeight: '600' }}>用户管理</Link>
        <Link to="/admin/vehicles">车辆管理</Link>
        <Link to="/admin/config">系统配置</Link>
      </div>
      <div className="admin-content">
        <h1 style={{ marginBottom: '24px' }}>用户管理</h1>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input className="form-control" placeholder="搜索用户名或邮箱..."
            value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadUsers(1)} />
          <button className="btn btn-primary" onClick={() => loadUsers(1)}>搜索</button>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>ID</th><th>用户名</th><th>角色</th><th>邮箱</th><th>状态</th><th>发布限额</th><th>注册时间</th><th>操作</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.username}</td>
                  <td>
                    <select className="form-control" value={u.role}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      style={{ width: '120px', padding: '4px 8px', fontSize: '13px' }}>
                      <option value="user">普通用户</option>
                      <option value="super">超级用户</option>
                      <option value="admin">管理员</option>
                    </select>
                  </td>
                  <td>{u.email || '-'}</td>
                  <td>
                    <span className={`badge ${u.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                      {u.status === 'active' ? '正常' : '封禁'}
                    </span>
                  </td>
                  <td>{u.vehicle_limit}</td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-sm btn-outline"
                      onClick={() => handleStatusChange(u.id, u.status === 'active' ? 'banned' : 'active')}>
                      {u.status === 'active' ? '封禁' : '解封'}
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u.id)}
                      style={{ marginLeft: '4px' }}>删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination" style={{ marginTop: '16px' }}>
          <button disabled={pagination.page <= 1} onClick={() => loadUsers(pagination.page - 1)}>上一页</button>
          <span style={{ padding: '8px' }}>第 {pagination.page} / {pagination.pages} 页</span>
          <button disabled={pagination.page >= pagination.pages} onClick={() => loadUsers(pagination.page + 1)}>下一页</button>
        </div>
      </div>
    </div>
  );
}
