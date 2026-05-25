import React from 'react';
import { Link } from 'react-router-dom';

export default function VehicleCard({ vehicle }) {
  const image = vehicle.images && vehicle.images.length > 0
    ? vehicle.images[0]
    : 'https://via.placeholder.com/400x200?text=No+Image';

  const conditionMap = { excellent: '极好', good: '良好', fair: '一般', poor: '较差' };
  const conditionColor = { excellent: 'badge-success', good: 'badge-info', fair: 'badge-warning', poor: 'badge-danger' };

  return (
    <div className="card vehicle-card">
      <Link to={`/vehicles/${vehicle.id}`}>
        <div className="vehicle-card-img">
          <img src={image} alt={`${vehicle.brand} ${vehicle.model}`} />
          {vehicle.is_featured && <span className="featured-badge">置顶</span>}
          {vehicle.images && vehicle.images.length > 1 && (
            <span className="img-count-badge">{vehicle.images.length}张</span>
          )}
        </div>
      </Link>
      <div className="card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <Link to={`/vehicles/${vehicle.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
            <h3 className="card-title" style={{ marginBottom: 0 }}>{vehicle.brand} {vehicle.model}</h3>
          </Link>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <span className="badge badge-info">{vehicle.year}年</span>
          {vehicle.mileage && <span className="badge" style={{ background: 'var(--gray-100)', color: 'var(--gray-700)' }}>{(vehicle.mileage / 10000).toFixed(1)}万km</span>}
          <span className={`badge ${conditionColor[vehicle.condition_type] || 'badge-info'}`}>
            {conditionMap[vehicle.condition_type] || '良好'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="price" style={{ fontSize: '22px' }}>¥{(vehicle.price / 10000).toFixed(2)}<span style={{ fontSize: '14px' }}>万</span></span>
          {vehicle.location && (
            <span style={{ fontSize: '12px', color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              📍 {vehicle.location}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
