import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function DataAnalysis() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then(res => setStats(res.data));
  }, []);

  if (!stats) return <div className="loading">加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>📊 数据分析</h1>
      </div>

      <div className="grid grid-4" style={{ marginBottom: '32px' }}>
        <div className="stat-card">
          <h3>总用户数</h3>
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
          <h3>消息总数</h3>
          <div className="stat-value">{stats.messages}</div>
        </div>
      </div>

      <div className="grid grid-2">
        {/* 品牌分布 */}
        <div className="card">
          <div className="card-body">
            <h3 style={{ marginBottom: '16px' }}>品牌分布</h3>
            {stats.brandStats.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{ width: '80px', fontSize: '14px' }}>{b.brand}</span>
                <div style={{ flex: 1, background: 'var(--gray-100)', borderRadius: '4px', height: '24px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${(b.count / stats.brandStats[0].count) * 100}%`,
                    background: 'var(--primary)', height: '100%', borderRadius: '4px'
                  }} />
                </div>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>{b.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 最近7天注册 */}
        <div className="card">
          <div className="card-body">
            <h3 style={{ marginBottom: '16px' }}>最近7天新增用户</h3>
            {stats.dailyUsers.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{ width: '100px', fontSize: '14px' }}>{d.date}</span>
                <div style={{ flex: 1, background: 'var(--gray-100)', borderRadius: '4px', height: '24px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.max((d.count / Math.max(...stats.dailyUsers.map(x => x.count), 1)) * 100, 2)}%`,
                    background: 'var(--success)', height: '100%', borderRadius: '4px'
                  }} />
                </div>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>{d.count}</span>
              </div>
            ))}
            {stats.dailyUsers.length === 0 && <p style={{ color: 'var(--gray-500)' }}>暂无数据</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
