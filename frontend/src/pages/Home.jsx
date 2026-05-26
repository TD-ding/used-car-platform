import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

export default function Home() {
  const [products, setProducts] = useState([])
  const [keyword, setKeyword] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categories, setCategories] = useState([])

  useEffect(() => {
    api.get('/api/admin/categories').then(res => setCategories(res.data)).catch(() => {})
    loadProducts()
  }, [])

  const loadProducts = (params = {}) => {
    api.get('/api/products', { params }).then(res => setProducts(res.data))
  }

  const handleSearch = () => {
    const params = {}
    if (keyword) params.keyword = keyword
    if (categoryId) params.category_id = categoryId
    loadProducts(params)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className="container">
      <div className="search-bar">
        <input
          placeholder="搜索商品..."
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <select value={categoryId} onChange={e => setCategoryId(e.target.value)}>
          <option value="">全部分类</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button className="btn btn-primary" onClick={handleSearch}>搜索</button>
      </div>

      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--gray-500)' }}>
          暂无商品
        </div>
      ) : (
        <div className="product-grid">
          {products.map(p => (
            <Link to={`/product/${p.id}`} key={p.id} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card">
                <img
                  className="card-img"
                  src={p.image || 'https://via.placeholder.com/300x200?text=No+Image'}
                  alt={p.title}
                />
                <div className="card-body">
                  <div className="card-title">{p.title}</div>
                  <div className="card-price">¥{p.price.toFixed(2)}</div>
                  <div className="card-meta">
                    {p.condition_level} · {p.seller_name}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
