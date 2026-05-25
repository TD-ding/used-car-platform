import React from 'react';
import { Link } from 'react-router-dom';

export default function VehicleCard({ vehicle }) {
  const image = vehicle.images && vehicle.images.length > 0
    ? vehicle.images[0]
    : 'https://via.placeholder.com/400x200?text=No+Image';

  const conditionMap = { excellent: '极好', good: '良好', fair: '一般', poor: '较差' };

  return (
    <div className="card">
      <Link to={`/vehicles/${vehicle.id}`}>
        <img className="card-img" src={image} alt={`${vehicle.brand} ${vehicle.model}`} />
      </Link>
      <div className="card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to={`/vehicles/${vehicle.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <h3 className="card-title">{vehicle.brand} {vehicle.model}</h3>
          </Link>
          {vehicle.is_featured && <span className="badge badge-warning">置顶</span>}
        </div>
        <div style={{ display: 'flex', gap: '12px', color: 'var(--gray-500)', fontSize: '13px', marginBottom: '8px' }}>
          <span>{vehicle.year}年</span>
          {vehicle.mileage && <span>{vehicle.mileage}km</span>}
          <span className="badge badge-info">{conditionMap[vehicle.condition_type] || '良好'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="price">¥{(vehicle.price / 10000).toFixed(2)}万</span>
          <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{vehicle.location || '未填写'}</span>
        </div>
      </div>
    </div>
  );
}
