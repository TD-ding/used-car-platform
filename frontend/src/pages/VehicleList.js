import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import VehicleCard from '../components/VehicleCard';
import Pagination from '../components/Pagination';

export default function VehicleList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [vehicles, setVehicles] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword') || '',
    brand: searchParams.get('brand') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    fuelType: searchParams.get('fuelType') || '',
    transmission: searchParams.get('transmission') || '',
  });

  const page = parseInt(searchParams.get('page')) || 1;

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', 12);
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });

    api.get(`/vehicles?${params.toString()}`).then(res => {
      setVehicles(res.data.vehicles);
      setPagination(res.data.pagination);
    });
  }, [page, searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    params.set('page', '1');
    setSearchParams(params);
  };

  const handlePageChange = (p) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', p.toString());
    setSearchParams(params);
  };

  return (
    <div>
      <h1 style={{ marginBottom: '24px' }}>🚗 车辆市场</h1>

      {/* 搜索筛选 */}
      <form className="search-bar" onSubmit={handleSearch}>
        <div className="form-group">
          <label>关键词</label>
          <input className="form-control" placeholder="搜索品牌、型号..."
            value={filters.keyword} onChange={e => setFilters({ ...filters, keyword: e.target.value })} />
        </div>
        <div className="form-group">
          <label>品牌</label>
          <input className="form-control" placeholder="如：丰田、宝马"
            value={filters.brand} onChange={e => setFilters({ ...filters, brand: e.target.value })} />
        </div>
        <div className="form-group">
          <label>最低价（万）</label>
          <input className="form-control" type="number" placeholder="0"
            value={filters.minPrice} onChange={e => setFilters({ ...filters, minPrice: e.target.value })} />
        </div>
        <div className="form-group">
          <label>最高价（万）</label>
          <input className="form-control" type="number" placeholder="100"
            value={filters.maxPrice} onChange={e => setFilters({ ...filters, maxPrice: e.target.value })} />
        </div>
        <div className="form-group">
          <label>燃料</label>
          <select className="form-control" value={filters.fuelType} onChange={e => setFilters({ ...filters, fuelType: e.target.value })}>
            <option value="">全部</option>
            <option value="gasoline">汽油</option>
            <option value="diesel">柴油</option>
            <option value="electric">电动</option>
            <option value="hybrid">混动</option>
          </select>
        </div>
        <div className="form-group">
          <label>变速箱</label>
          <select className="form-control" value={filters.transmission} onChange={e => setFilters({ ...filters, transmission: e.target.value })}>
            <option value="">全部</option>
            <option value="automatic">自动</option>
            <option value="manual">手动</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary" style={{ marginBottom: 0 }}>搜索</button>
      </form>

      {/* 结果数量 */}
      <p style={{ color: 'var(--gray-500)', marginBottom: '16px' }}>共 {pagination.total} 辆车</p>

      {/* 车辆列表 */}
      {vehicles.length === 0 ? (
        <div className="empty">
          <h3>暂无车辆</h3>
          <p>换个条件试试？</p>
        </div>
      ) : (
        <>
          <div className="grid grid-3">
            {vehicles.map(v => <VehicleCard key={v.id} vehicle={v} />)}
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} onPageChange={handlePageChange} />
        </>
      )}
    </div>
  );
}
