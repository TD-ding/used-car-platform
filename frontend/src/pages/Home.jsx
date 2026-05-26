import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

function Stars({ rating, size = 12 }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5 ? 1 : 0
  const empty = 5 - full - half
  return (
    <span style={{ fontSize: size, color: 'var(--warning)' }}>
      {'★'.repeat(full)}{half ? '☆' : ''}{'☆'.repeat(empty)}
      <span style={{ color: 'var(--gray-500)', fontSize: size * 0.85, marginLeft: 2 }}>
        {rating > 0 ? rating.toFixed(1) : ''}
      </span>
    </span>
  )
}

export default function Home() {
  const [products, setProducts] = useState([])
  const [keyword, setKeyword] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [sort, setSort] = useState('newest')
  const sentinelRef = useRef(null)
  const PAGE_SIZE = 12

  useEffect(() => {
    api.get('/api/categories').then(res => setCategories(res.data)).catch(() => {})
    loadProducts(1)
  }, [])

  const loadProducts = useCallback((pageNum = 1, params = {}) => {
    setLoading(true)
    const queryParams = { page: pageNum, page_size: PAGE_SIZE, sort, ...params }
    api.get('/api/products', { params: queryParams })
      .then(res => {
        if (pageNum === 1) {
          setProducts(res.data)
        } else {
          setProducts(prev => [...prev, ...res.data])
        }
        setHasMore(res.data.length === PAGE_SIZE)
        setPage(pageNum)
      })
      .finally(() => setLoading(false))
  }, [sort])

  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading) return
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const currentParams = {}
          if (keyword) currentParams.keyword = keyword
          if (categoryId) currentParams.category_id = categoryId
          loadProducts(page + 1, currentParams)
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loading, page, keyword, categoryId, loadProducts])

  const handleSearch = () => {
    const params = { sort }
    if (keyword) params.keyword = keyword
    if (categoryId) params.category_id = categoryId
    loadProducts(1, params)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  const handleCategoryTag = (catId) => {
    const newCatId = categoryId === catId.toString() ? '' : catId.toString()
    setCategoryId(newCatId)
    const params = { sort }
    if (keyword) params.keyword = keyword
    if (newCatId) params.category_id = newCatId
    loadProducts(1, params)
  }

  const handleSortChange = (newSort) => {
    setSort(newSort)
    const params = { sort: newSort }
    if (keyword) params.keyword = keyword
    if (categoryId) params.category_id = categoryId
    loadProducts(1, params)
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
        <select value={categoryId} onChange={e => { setCategoryId(e.target.value); handleSearch() }}>
          <option value="">全部分类</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
          {loading ? '搜索中...' : '搜索'}
        </button>
      </div>

      {/* Category tags + Sort */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {categories.map(c => (
            <button
              key={c.id}
              className={`cat-tag ${categoryId === c.id.toString() ? 'active' : ''}`}
              onClick={() => handleCategoryTag(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
        <select value={sort} onChange={e => handleSortChange(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--gray-300)' }}>
          <option value="newest">最新发布</option>
          <option value="price_asc">价格从低到高</option>
          <option value="price_desc">价格从高到低</option>
        </select>
      </div>

      {products.length === 0 && !loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--gray-500)' }}>暂无商品</div>
      ) : (
        <>
          <div className="product-grid">
            {products.map(p => (
              <Link to={`/product/${p.id}`} key={p.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card">
                  <img className="card-img" src={p.image || 'https://via.placeholder.com/300x200?text=No+Image'} alt={p.title} />
                  <div className="card-body">
                    <div className="card-title">{p.title}</div>
                    <div className="card-price">¥{p.price.toFixed(2)}</div>
                    {p.avg_rating > 0 && (
                      <div style={{ marginTop: 4 }}>
                        <Stars rating={p.avg_rating} size={11} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginLeft: 4 }}>({p.rating_count})</span>
                      </div>
                    )}
                    <div className="card-meta">
                      {p.condition_level} · {p.seller_name}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div ref={sentinelRef} className="load-more-sentinel">
            {loading && <span>加载中...</span>}
            {!hasMore && products.length > 0 && <span>没有更多了</span>}
          </div>
        </>
      )}
    </div>
  )
}
