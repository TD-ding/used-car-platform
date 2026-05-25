import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import VehicleCard from '../components/VehicleCard';
import Pagination from '../components/Pagination';

export default function VehicleList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [vehicles, setVehicles] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword') || '',
    brand: searchParams.get('brand') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    fuelType: searchParams.get('fuelType') || '',
    transmission: searchParams.get('transmission') || '',
    condition: searchParams.get('condition') || '',
  });
  const [sort, setSort] = useState(searchParams.get('sort') || 'latest');

  const page = parseInt(searchParams.get('page')) || 1;

  // 搜索历史
  const [searchHistory, setSearchHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('searchHistory') || '[]'); } catch { return []; }
  });

  const saveSearchHistory = (keyword) => {
    if (!keyword.trim()) return;
    const updated = [keyword, ...searchHistory.filter(k => k !== keyword)].slice(0, 8);
    setSearchHistory(updated);
    localStorage.setItem('searchHistory', JSON.stringify(updated));
  };

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', 12);
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    if (sort) params.set('sort', sort);

    api.get(`/vehicles?${params.toString()}`).then(res => {
      setVehicles(res.data.vehicles);
      setPagination(res.data.pagination);
    }).finally(() => setLoading(false));
  }, [page, searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    saveSearchHistory(filters.keyword);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    if (sort) params.set('sort', sort);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleSortChange = (newSort) => {
    setSort(newSort);
    const params = new URLSearchParams(searchParams);
    params.set('sort', newSort);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handlePageChange = (p) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', p.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setFilters({ keyword: '', brand: '', minPrice: '', maxPrice: '', fuelType: '', transmission: '', condition: '' });
    setSort('latest');
    setSearchParams({});
  };

  const hasActiveFilters = Object.values(filters).some(v => v) || sort !== 'latest';

  return (
    <div>
      <div className="page-header">
        <h1>车辆市场</h1>
        {hasActiveFilters && (
          <button className="btn btn-outline btn-sm" onClick={clearFilters}>清除筛选</button>
        )}
      </div>

      {/* 搜索筛选 */}
      <form className="search-bar" onSubmit={handleSearch}>
        <div className="form-group" style={{ flex: 2 }}>
          <label>关键词</label>
          <input className="form-control" placeholder="搜索品牌、型号..."
            value={filters.keyword} onChange={e => setFilters({ ...filters, keyword: e.target.value })} />
          {searchHistory.length > 0 && !filters.keyword && (
            <div className="search-history">
              {searchHistory.map((kw, i) => (
                <span key={i} className="search-history-tag"
                  onClick={() => { setFilters({ ...filters, keyword: kw }); }}>
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="form-group">
          <label>品牌</label>
          <input className="form-control" placeholder="如：丰田、宝马"
            value={filters.brand} onChange={e => setFilters({ ...filters, brand: e.target.value })} />
        </div>
        <div className="form-group">
          <label>价格区间（万）</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input className="form-control" type="number" placeholder="最低"
              value={filters.minPrice} onChange={e => setFilters({ ...filters, minPrice: e.target.value })} />
            <input className="form-control" type="number" placeholder="最高"
              value={filters.maxPrice} onChange={e => setFilters({ ...filters, maxPrice: e.target.value })} />
          </div>
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
        <div className="form-group">
          <label>车况</label>
          <select className="form-control" value={filters.condition} onChange={e => setFilters({ ...filters, condition: e.target.value })}>
            <option value="">全部</option>
            <option value="excellent">极好</option>
            <option value="good">良好</option>
            <option value="fair">一般</option>
            <option value="poor">较差</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary" style={{ marginBottom: 0, alignSelf: 'flex-end' }}>搜索</button>
      </form>

      {/* 排序 + 结果数量 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ color: 'var(--gray-500)' }}>共 {pagination.total} 辆车</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { key: 'latest', label: '最新' },
            { key: 'price_asc', label: '价格↑' },
            { key: 'price_desc', label: '价格↓' },
            { key: 'views', label: '热门' },
          ].map(s => (
            <button key={s.key} className={`btn btn-sm ${sort === s.key ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => handleSortChange(s.key)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* 车辆列表 */}
      {loading ? (
        <div className="loading"><div className="spinner"></div><p style={{ marginTop: '12px' }}>加载中...</p></div>
      ) : vehicles.length === 0 ? (
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
