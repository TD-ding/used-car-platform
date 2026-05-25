import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import VehicleCard from '../components/VehicleCard';

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = () => {
    setLoading(true);
    api.get('/favorites').then(res => setFavorites(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { loadFavorites(); }, []);

  const handleRemove = async (vehicleId) => {
    try {
      await api.delete(`/favorites/${vehicleId}`);
      setFavorites(prev => prev.filter(f => f.id !== vehicleId));
    } catch (err) {
      alert(err.response?.data?.message || '取消收藏失败');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>我的收藏</h1>
      </div>
      {loading ? (
        <div className="loading"><div className="spinner"></div><p style={{ marginTop: '12px' }}>加载中...</p></div>
      ) : favorites.length === 0 ? (
        <div className="empty">
          <h3>还没有收藏车辆</h3>
          <p>浏览车辆市场，点击收藏感兴趣的车辆</p>
        </div>
      ) : (
        <div className="grid grid-3">
          {favorites.map(v => (
            <div key={v.id}>
              <VehicleCard vehicle={v} />
              <button className="btn btn-outline btn-sm" style={{ marginTop: '8px', width: '100%' }}
                onClick={() => handleRemove(v.id)}>取消收藏</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
