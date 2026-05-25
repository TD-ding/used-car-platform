import React from 'react';
import { Link } from 'react-router-dom';

export default function AdminConfig() {
  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <Link to="/admin">仪表盘</Link>
        <Link to="/admin/users">用户管理</Link>
        <Link to="/admin/vehicles">车辆管理</Link>
        <Link to="/admin/config" style={{ fontWeight: '600' }}>系统配置</Link>
      </div>
      <div className="admin-content">
        <h1 style={{ marginBottom: '24px' }}>系统配置</h1>

        <div className="card">
          <div className="card-body">
            <h3 style={{ marginBottom: '16px' }}>系统信息</h3>
            <div className="grid grid-2" style={{ gap: '16px' }}>
              <div>
                <p><strong>系统名称：</strong>二手车交易平台</p>
                <p><strong>版本：</strong>1.0.0</p>
                <p><strong>技术栈：</strong>React + Node.js + MySQL</p>
              </div>
              <div>
                <p><strong>默认发布限额（普通用户）：</strong>3辆</p>
                <p><strong>超级用户发布限额：</strong>可自定义</p>
                <p><strong>图片上传大小限制：</strong>5MB</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: '20px' }}>
          <div className="card-body">
            <h3 style={{ marginBottom: '16px' }}>角色权限说明</h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>功能</th><th>普通用户</th><th>超级用户</th><th>管理员</th></tr>
                </thead>
                <tbody>
                  <tr><td>浏览/搜索车辆</td><td>✅</td><td>✅</td><td>✅</td></tr>
                  <tr><td>发布车辆</td><td>✅ (3辆上限)</td><td>✅ (可自定义上限)</td><td>✅</td></tr>
                  <tr><td>收藏车辆</td><td>✅</td><td>✅</td><td>✅</td></tr>
                  <tr><td>发送消息</td><td>✅</td><td>✅</td><td>✅</td></tr>
                  <tr><td>置顶车辆</td><td>❌</td><td>✅</td><td>✅</td></tr>
                  <tr><td>数据分析</td><td>❌</td><td>✅</td><td>✅</td></tr>
                  <tr><td>审核车辆</td><td>❌</td><td>❌</td><td>✅</td></tr>
                  <tr><td>用户管理</td><td>❌</td><td>❌</td><td>✅</td></tr>
                  <tr><td>系统配置</td><td>❌</td><td>❌</td><td>✅</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
