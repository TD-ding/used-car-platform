import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function Favorites() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/products/favorites')
      .then(res => setProducts(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggleFavorite = async (productId) => {
    try {
      await api.post(`/api/products/${productId}/favorite`)
      setProducts(products.filter(p => p.id !== productId))
    } catch (err) {
      // ignore
    }
  }

  if (loading) return <div className="container">加载中...</div>

  return (
    <div className="container">
      <h2 style={{ marginBottom: 24 }}>我的收藏 ({products.length})</h2>
      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--gray-500)' }}>
          暂无收藏，去首页逛逛吧！
        </div>
      ) : (
        <div className="product-grid">
          {products.map(p => (
            <div key={p.id} className="card" style={{ position: 'relative' }}>
              <Link to={`/product/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <img className="card-img" src={p.image || 'https://via.placeholder.com/300x200?text=No+Image'} alt={p.title} />
                <div className="card-body">
                  <div className="card-title">{p.title}</div>
                  <div className="card-price">¥{p.price.toFixed(2)}</div>
                </div>
              </Link>
              <button
                onClick={(e) => { e.preventDefault(); toggleFavorite(p.id) }}
                style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: '1rem' }}
              >
                ❤️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
