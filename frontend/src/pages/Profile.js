import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export default function Profile() {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [msg, setMsg] = useState('');

  const handleProfile = async (e) => {
    e.preventDefault();
    try {
      await api.put('/users/profile', { email, phone });
      setMsg('个人信息更新成功');
    } catch (err) {
      setMsg(err.response?.data?.message || '更新失败');
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    try {
      await api.put('/users/password', { oldPassword: oldPwd, newPassword: newPwd });
      setMsg('密码修改成功');
      setOldPwd('');
      setNewPwd('');
    } catch (err) {
      setMsg(err.response?.data?.message || '修改失败');
    }
  };

  if (!user) return null;

  const roleMap = { admin: '管理员', super: '超级用户', user: '普通用户' };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '24px' }}>👤 个人信息</h1>

      {msg && <div className="alert alert-info">{msg}</div>}

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '20px' }}>{user.username}</h2>
              <span className={`badge role-${user.role}`} style={{ marginTop: '4px' }}>{roleMap[user.role]}</span>
            </div>
            <div>
              <p style={{ color: 'var(--gray-500)', fontSize: '13px' }}>注册于 {new Date(user.created_at).toLocaleDateString()}</p>
              <p style={{ color: 'var(--gray-500)', fontSize: '13px' }}>发布限额：{user.vehicle_limit} 辆</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body">
          <h3 style={{ marginBottom: '16px' }}>修改信息</h3>
          <form onSubmit={handleProfile}>
            <div className="form-group">
              <label>邮箱</label>
              <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label>手机号</label>
              <input type="tel" className="form-control" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary">保存</button>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h3 style={{ marginBottom: '16px' }}>修改密码</h3>
          <form onSubmit={handlePassword}>
            <div className="form-group">
              <label>旧密码</label>
              <input type="password" className="form-control" value={oldPwd} onChange={e => setOldPwd(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>新密码</label>
              <input type="password" className="form-control" value={newPwd} onChange={e => setNewPwd(e.target.value)} required minLength={6} />
            </div>
            <button type="submit" className="btn btn-primary">修改密码</button>
          </form>
        </div>
      </div>
    </div>
  );
}
