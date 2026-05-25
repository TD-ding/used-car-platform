import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function VehicleDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [isFav, setIsFav] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get(`/vehicles/${id}`).then(res => setVehicle(res.data));
    if (user) {
      api.get('/favorites').then(res => {
        setIsFav(res.data.some(f => f.id === parseInt(id)));
      });
    }
  }, [id, user]);

  const toggleFavorite = async () => {
    if (!user) return navigate('/login');
    try {
      if (isFav) {
        await api.delete(`/favorites/${id}`);
      } else {
        await api.post('/favorites', { vehicleId: parseInt(id) });
      }
      setIsFav(!isFav);
    } catch (err) {
      alert(err.response?.data?.message || '操作失败');
    }
  };

  const handleContact = async () => {
    if (!user) return navigate('/login');
    if (!message.trim()) return;
    try {
      await api.post('/messages', {
        receiverId: vehicle.user_id,
        vehicleId: parseInt(id),
        content: message
      });
      navigate(`/messages/${vehicle.user_id}`);
    } catch (err) {
      alert(err.response?.data?.message || '发送失败');
    }
  };

  if (!vehicle) return <div className="loading">加载中...</div>;

  const conditionMap = { excellent: '极好', good: '良好', fair: '一般', poor: '较差' };
  const fuelMap = { gasoline: '汽油', diesel: '柴油', electric: '电动', hybrid: '混动' };
  const transMap = { automatic: '自动挡', manual: '手动挡' };

  return (
    <div>
      <div className="grid grid-2" style={{ gap: '32px' }}>
        {/* 图片 */}
        <div>
          {vehicle.images && vehicle.images.length > 0 ? (
            <img src={vehicle.images[0]} alt={vehicle.brand} style={{ width: '100%', borderRadius: 'var(--radius)', maxHeight: '400px', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '400px', background: 'var(--gray-100)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-500)' }}>
              暂无图片
            </div>
          )}
          {vehicle.images && vehicle.images.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', overflowX: 'auto' }}>
              {vehicle.images.map((img, i) => (
                <img key={i} src={img} alt={`${i}`} style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
              ))}
            </div>
          )}
        </div>

        {/* 详情 */}
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>{vehicle.brand} {vehicle.model}</h1>
          <p className="price" style={{ fontSize: '28px', marginBottom: '16px' }}>¥{(vehicle.price / 10000).toFixed(2)}万</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            <div><strong>年份：</strong>{vehicle.year}年</div>
            <div><strong>里程：</strong>{vehicle.mileage ? `${vehicle.mileage}km` : '未填写'}</div>
            <div><strong>车况：</strong>{conditionMap[vehicle.condition_type]}</div>
            <div><strong>燃料：</strong>{fuelMap[vehicle.fuel_type]}</div>
            <div><strong>变速箱：</strong>{transMap[vehicle.transmission]}</div>
            <div><strong>地点：</strong>{vehicle.location || '未填写'}</div>
            <div><strong>浏览：</strong>{vehicle.views}次</div>
            <div><strong>发布：</strong>{new Date(vehicle.created_at).toLocaleDateString()}</div>
          </div>

          {vehicle.description && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '8px' }}>车辆描述</h3>
              <p style={{ color: 'var(--gray-500)' }}>{vehicle.description}</p>
            </div>
          )}

          {/* 卖家信息 & 操作 */}
          <div style={{ background: 'var(--gray-50)', padding: '16px', borderRadius: 'var(--radius)', marginBottom: '16px' }}>
            <h3 style={{ marginBottom: '8px' }}>卖家信息</h3>
            <p><strong>卖家：</strong>{vehicle.seller_name}</p>
            <p><strong>电话：</strong>{vehicle.seller_phone || '未填写'}</p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className={`btn ${isFav ? 'btn-danger' : 'btn-outline'}`} onClick={toggleFavorite}>
              {isFav ? '取消收藏' : '收藏车辆'}
            </button>
          </div>

          {/* 联系卖家 */}
          {user && user.id !== vehicle.user_id && (
            <div style={{ marginTop: '16px' }}>
              <div className="form-group">
                <label>给卖家留言</label>
                <textarea className="form-control" rows={3} placeholder="我对这辆车很感兴趣..."
                  value={message} onChange={e => setMessage(e.target.value)} />
              </div>
              <button className="btn btn-primary" onClick={handleContact}>发送消息</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
