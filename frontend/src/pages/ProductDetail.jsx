import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [showOrder, setShowOrder] = useState(false)
  const [orderForm, setOrderForm] = useState({ address: '', phone: '', remark: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/api/products/${id}`).then(res => setProduct(res.data))
    api.get(`/api/comments/product/${id}`).then(res => setComments(res.data))
  }, [id])

  const handleComment = async () => {
    if (!commentText.trim()) return
    try {
      const res = await api.post(`/api/comments/product/${id}`, { content: commentText })
      setComments([res.data, ...comments])
      setCommentText('')
    } catch (err) {
      setError(err.response?.data?.detail || '评论失败')
    }
  }

  const handleOrder = async () => {
    try {
      await api.post(`/api/orders/${id}`, orderForm)
      alert('下单成功！')
      setShowOrder(false)
      navigate('/orders')
    } catch (err) {
      setError(err.response?.data?.detail || '下单失败')
    }
  }

  if (!product) return <div className="container">加载中...</div>

  return (
    <div className="container">
      <div className="product-detail">
        <img className="product-image" src={product.image || 'https://via.placeholder.com/600x400?text=No+Image'} alt={product.title} />
        <div className="product-info">
          <h1>{product.title}</h1>
          <div className="price-section">
            <span className="current-price">¥{product.price.toFixed(2)}</span>
            {product.original_price > 0 && (
              <span className="original-price">¥{product.original_price.toFixed(2)}</span>
            )}
          </div>
          <div className="meta-info">
            <div>成色：{product.condition_level}</div>
            <div>分类：{product.category_name || '未分类'}</div>
            <div>卖家：{product.seller_name}</div>
            <div>浏览：{product.views} 次</div>
          </div>
          <p style={{ margin: '16px 0', color: 'var(--gray-700)' }}>{product.description}</p>
          <button className="btn btn-primary" onClick={() => setShowOrder(true)}>立即购买</button>
        </div>
      </div>

      {/* Comments section */}
      <div style={{ marginTop: 32 }}>
        <h3 style={{ marginBottom: 16 }}>评价 ({comments.length})</h3>
        <div style={{ marginBottom: 16 }}>
          <textarea
            style={{ width: '100%', padding: 10, border: '1px solid var(--gray-300)', borderRadius: 'var(--radius)', minHeight: 80 }}
            placeholder="写下你的评价..."
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
          />
          <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={handleComment}>发表评论</button>
        </div>
        {comments.map(c => (
          <div className="comment-item" key={c.id}>
            <div className="comment-header">
              <span className="comment-user">{c.username}</span>
              <span className="stars">{'★'.repeat(c.rating)}{'☆'.repeat(5 - c.rating)}</span>
              <span className="comment-time">{new Date(c.created_at).toLocaleDateString()}</span>
            </div>
            <div>{c.content}</div>
          </div>
        ))}
      </div>

      {/* Order modal */}
      {showOrder && (
        <div className="modal-overlay" onClick={() => setShowOrder(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>确认购买</h2>
            {error && <div className="error-msg">{error}</div>}
            <div className="form-group">
              <label>收货地址</label>
              <input value={orderForm.address} onChange={e => setOrderForm({ ...orderForm, address: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>联系电话</label>
              <input value={orderForm.phone} onChange={e => setOrderForm({ ...orderForm, phone: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>备注</label>
              <textarea value={orderForm.remark} onChange={e => setOrderForm({ ...orderForm, remark: e.target.value })} />
            </div>
            <p style={{ margin: '12px 0', fontWeight: 600 }}>总价：¥{product.price.toFixed(2)}</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-primary" onClick={handleOrder}>确认下单</button>
              <button className="btn btn-outline" onClick={() => setShowOrder(false)}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
