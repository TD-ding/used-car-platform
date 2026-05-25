import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function VehicleDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [message, setMessage] = useState('');
  const [currentImg, setCurrentImg] = useState(0);

  useEffect(() => {
    setLoading(true);
    api.get(`/vehicles/${id}`)
      .then(res => setVehicle(res.data))
      .finally(() => setLoading(false));
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

  if (loading) return (
    <div className="loading">
      <div className="spinner"></div>
      <p style={{ marginTop: '12px' }}>加载中...</p>
    </div>
  );

  if (!vehicle) return <div className="empty"><h3>车辆不存在</h3></div>;

  const conditionMap = { excellent: '极好', good: '良好', fair: '一般', poor: '较差' };
  const fuelMap = { gasoline: '汽油', diesel: '柴油', electric: '电动', hybrid: '混动' };
  const transMap = { automatic: '自动挡', manual: '手动挡' };

  return (
    <div className="vehicle-detail">
      <div className="vehicle-detail-grid">
        {/* 图片轮播 */}
        <div className="carousel">
          {vehicle.images && vehicle.images.length > 0 ? (
            <>
              <div className="carousel-main">
                <img src={vehicle.images[currentImg]} alt={`${vehicle.brand} ${vehicle.model}`} />
                {vehicle.images.length > 1 && (
                  <>
                    <button className="carousel-btn carousel-prev"
                      onClick={() => setCurrentImg(currentImg === 0 ? vehicle.images.length - 1 : currentImg - 1)}>
                      ‹
                    </button>
                    <button className="carousel-btn carousel-next"
                      onClick={() => setCurrentImg(currentImg === vehicle.images.length - 1 ? 0 : currentImg + 1)}>
                      ›
                    </button>
                    <div className="carousel-dots">
                      {vehicle.images.map((_, i) => (
                        <span key={i} className={`carousel-dot ${i === currentImg ? 'active' : ''}`}
                          onClick={() => setCurrentImg(i)} />
                      ))}
                    </div>
                  </>
                )}
              </div>
              {vehicle.images.length > 1 && (
                <div className="carousel-thumbs">
                  {vehicle.images.map((img, i) => (
                    <img key={i} src={img} alt={`${i}`}
                      className={`carousel-thumb ${i === currentImg ? 'active' : ''}`}
                      onClick={() => setCurrentImg(i)} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="carousel-placeholder">暂无图片</div>
          )}
        </div>

        {/* 详情 */}
        <div className="vehicle-info">
          <div style={{ marginBottom: '8px' }}>
            {vehicle.is_featured && <span className="badge badge-warning" style={{ marginRight: '8px' }}>置顶</span>}
            <span className="badge badge-info">{vehicle.status === 'approved' ? '已认证' : '待审核'}</span>
          </div>
          <h1 className="vehicle-title">{vehicle.brand} {vehicle.model}</h1>
          <p className="vehicle-price">¥{(vehicle.price / 10000).toFixed(2)}万</p>

          <div className="vehicle-params">
            <div className="param-item"><span className="param-label">年份</span><span className="param-value">{vehicle.year}年</span></div>
            <div className="param-item"><span className="param-label">里程</span><span className="param-value">{vehicle.mileage ? `${(vehicle.mileage / 10000).toFixed(1)}万km` : '未填写'}</span></div>
            <div className="param-item"><span className="param-label">车况</span><span className="param-value">{conditionMap[vehicle.condition_type]}</span></div>
            <div className="param-item"><span className="param-label">燃料</span><span className="param-value">{fuelMap[vehicle.fuel_type]}</span></div>
            <div className="param-item"><span className="param-label">变速箱</span><span className="param-value">{transMap[vehicle.transmission]}</span></div>
            <div className="param-item"><span className="param-label">地点</span><span className="param-value">{vehicle.location || '未填写'}</span></div>
            <div className="param-item"><span className="param-label">浏览</span><span className="param-value">{vehicle.views}次</span></div>
            <div className="param-item"><span className="param-label">发布</span><span className="param-value">{new Date(vehicle.created_at).toLocaleDateString()}</span></div>
          </div>

          {vehicle.description && (
            <div className="vehicle-desc">
              <h3>车辆描述</h3>
              <p>{vehicle.description}</p>
            </div>
          )}

          {/* 卖家信息 */}
          <div className="seller-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{
                width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 600, color: 'var(--primary)'
              }}>
                {(vehicle.seller_name || '?')[0].toUpperCase()}
              </span>
              <div>
                <div style={{ fontWeight: 600 }}>{vehicle.seller_name}</div>
                <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>{vehicle.seller_phone || '未填写电话'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className={`btn ${isFav ? 'btn-danger' : 'btn-outline'}`} onClick={toggleFavorite} style={{ flex: 1 }}>
                {isFav ? '❤ 已收藏' : '🤍 收藏'}
              </button>
            </div>
          </div>

          {/* 联系卖家 */}
          {user && user.id !== vehicle.user_id && (
            <div className="contact-card">
              <div className="form-group">
                <label>给卖家留言</label>
                <textarea className="form-control" rows={3} placeholder="我对这辆车很感兴趣..."
                  value={message} onChange={e => setMessage(e.target.value)} />
              </div>
              <button className="btn btn-primary btn-lg contact-btn" onClick={handleContact} style={{ width: '100%' }}>
                联系卖家
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
