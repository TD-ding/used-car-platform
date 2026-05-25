import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import VehicleCard from '../components/VehicleCard';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [latest, setLatest] = useState([]);

  useEffect(() => {
    api.get('/vehicles?featured=true&limit=4').then(res => setFeatured(res.data.vehicles));
    api.get('/vehicles?limit=8').then(res => setLatest(res.data.vehicles));
  }, []);

  return (
    <div>
      {/* Hero 区域 */}
      <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)', color: 'white', borderRadius: 'var(--radius)', padding: '60px 40px', marginBottom: '32px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '12px' }}>找好车，上二手车交易平台</h1>
        <p style={{ fontSize: '18px', opacity: 0.9, marginBottom: '24px' }}>海量优质二手车，认证车源，买卖更放心</p>
        <Link to="/vehicles" className="btn btn-lg" style={{ background: 'white', color: 'var(--primary)' }}>浏览全部车辆</Link>
      </div>

      {/* 置顶推荐 */}
      {featured.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div className="page-header">
            <h1>🔥 推荐车辆</h1>
            <Link to="/vehicles?featured=true" className="btn btn-outline btn-sm">查看更多</Link>
          </div>
          <div className="grid grid-4">
            {featured.map(v => <VehicleCard key={v.id} vehicle={v} />)}
          </div>
        </div>
      )}

      {/* 最新发布 */}
      <div>
        <div className="page-header">
          <h1>📋 最新发布</h1>
          <Link to="/vehicles" className="btn btn-outline btn-sm">查看更多</Link>
        </div>
        <div className="grid grid-4">
          {latest.map(v => <VehicleCard key={v.id} vehicle={v} />)}
        </div>
      </div>
    </div>
  );
}
