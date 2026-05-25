import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import VehicleCard from '../components/VehicleCard';

export default function MyVehicles() {
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    api.get('/vehicles/my/list').then(res => setVehicles(res.data));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这辆车吗？')) return;
    try {
      await api.delete(`/vehicles/${id}`);
      setVehicles(vehicles.filter(v => v.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || '删除失败');
    }
  };

  const statusMap = {
    pending: { label: '待审核', badge: 'badge-warning' },
    approved: { label: '已通过', badge: 'badge-success' },
    rejected: { label: '已拒绝', badge: 'badge-danger' },
    sold: { label: '已售出', badge: 'badge-info' }
  };

  return (
    <div>
      <div className="page-header">
        <h1>🚙 我的车辆</h1>
      </div>
      {vehicles.length === 0 ? (
        <div className="empty">
          <h3>还没有发布车辆</h3>
          <p>点击"发布车辆"开始卖车</p>
        </div>
      ) : (
        <div className="grid grid-3">
          {vehicles.map(v => (
            <div key={v.id} style={{ position: 'relative' }}>
              <VehicleCard vehicle={v} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', padding: '0 4px' }}>
                <span className={`badge ${statusMap[v.status]?.badge}`}>{statusMap[v.status]?.label}</span>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(v.id)}>删除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
