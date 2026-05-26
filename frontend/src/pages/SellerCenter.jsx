import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const EMPTY_PRODUCT = { title: '', description: '', price: '', original_price: '', condition_level: '几乎全新', category_id: '', image: '' }

export default function SellerCenter() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('my')
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_PRODUCT)
  const [editId, setEditId] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (!user.token && user.role !== 'merchant' && user.role !== 'admin') {
      navigate('/login')
      return
    }
    loadProducts()
    api.get('/api/categories').then(res => setCategories(res.data)).catch(() => {})
  }, [navigate])

  const loadProducts = () => {
    api.get('/api/products/my').then(res => setProducts(res.data)).catch(() => {})
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('图片大小不能超过5MB')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/api/products/upload', formData)
      setForm({ ...form, image: res.data.url })
    } catch (err) {
      setError(err.response?.data?.detail || '上传失败')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    setError('')
    setSubmitting(true)
    const data = {
      ...form,
      price: parseFloat(form.price) || 0,
      original_price: parseFloat(form.original_price) || 0,
      category_id: form.category_id ? parseInt(form.category_id) : null,
    }
    try {
      if (editId) {
        await api.put(`/api/products/${editId}`, data)
      } else {
        await api.post('/api/products', data)
      }
      setShowForm(false)
      setForm(EMPTY_PRODUCT)
      setEditId(null)
      loadProducts()
    } catch (err) {
      setError(err.response?.data?.detail || '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (p) => {
    setForm({
      title: p.title,
      description: p.description,
      price: p.price.toString(),
      original_price: p.original_price.toString(),
      condition_level: p.condition_level,
      category_id: p.category_id ? p.category_id.toString() : '',
      image: p.image,
    })
    setEditId(p.id)
    setShowForm(true)
  }

  const handleDelete = (product) => {
    setConfirmDelete(product)
  }

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return
    await api.delete(`/api/products/${confirmDelete.id}`)
    setConfirmDelete(null)
    loadProducts()
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>卖家中心</h2>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY_PRODUCT); setEditId(null); setShowForm(true) }}>
          发布商品
        </button>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'my' ? 'active' : ''}`} onClick={() => setTab('my')}>我的商品</button>
        <button className={`tab ${tab === 'sold' ? 'active' : ''}`} onClick={() => setTab('sold')}>卖出订单</button>
      </div>

      {tab === 'my' && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>商品</th>
                <th>价格</th>
                <th>状态</th>
                <th>浏览</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>{p.title}</td>
                  <td>¥{p.price.toFixed(2)}</td>
                  <td><span className={`tag tag-${p.status}`}>{p.status}</span></td>
                  <td>{p.views}</td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => handleEdit(p)}>编辑</button>
                    {' '}
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p)}>下架</button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--gray-500)' }}>暂无商品</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'sold' && <SoldOrders />}

      {/* Product form modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => !submitting && setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editId ? '编辑商品' : '发布商品'}</h2>
            {error && <div className="error-msg">{error}</div>}
            <div className="form-group">
              <label>商品名称</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>商品描述</label>
              <textarea rows={3} maxLength={2000} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label>售价</label>
              <input type="number" min="0.01" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>原价（可选）</label>
              <input type="number" min="0" step="0.01" value={form.original_price} onChange={e => setForm({ ...form, original_price: e.target.value })} />
            </div>
            <div className="form-group">
              <label>成色</label>
              <select value={form.condition_level} onChange={e => setForm({ ...form, condition_level: e.target.value })}>
                <option value="全新">全新</option>
                <option value="几乎全新">几乎全新</option>
                <option value="轻微使用痕迹">轻微使用痕迹</option>
                <option value="明显使用痕迹">明显使用痕迹</option>
              </select>
            </div>
            <div className="form-group">
              <label>分类</label>
              <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                <option value="">请选择</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>商品图片</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                {uploading && <span style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>上传中...</span>}
              </div>
              {form.image && (
                <div style={{ marginTop: 8 }}>
                  <img src={form.image} alt="preview" style={{ maxWidth: 120, maxHeight: 80, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--gray-200)' }} />
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? '提交中...' : (editId ? '保存修改' : '发布')}
              </button>
              <button className="btn btn-outline" onClick={() => setShowForm(false)} disabled={submitting}>取消</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>⚠️</div>
            <h2>确认下架</h2>
            <p style={{ color: 'var(--gray-700)', margin: '12px 0' }}>
              确定要下架「<strong>{confirmDelete.title}</strong>」吗？
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
              <button className="btn btn-outline" onClick={() => setConfirmDelete(null)}>取消</button>
              <button className="btn btn-danger" onClick={confirmDeleteAction}>确认下架</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SoldOrders() {
  const [orders, setOrders] = useState([])

  useEffect(() => {
    api.get('/api/orders/sold').then(res => setOrders(res.data)).catch(() => {})
  }, [])

  const statusLabel = {
    pending: '待付款', paid: '已付款', shipped: '已发货', completed: '已完成', cancelled: '已取消',
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr><th>订单号</th><th>商品</th><th>金额</th><th>状态</th><th>时间</th><th>操作</th></tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id}>
              <td>{o.order_no}</td>
              <td>{o.items.map(i => i.product_title).join(', ')}</td>
              <td>¥{o.total_price.toFixed(2)}</td>
              <td><span className={`tag tag-${o.status === 'completed' ? 'approved' : o.status}`}>{statusLabel[o.status] || o.status}</span></td>
              <td>{new Date(o.created_at).toLocaleDateString()}</td>
              <td>
                {o.status === 'paid' && (
                  <button className="btn btn-primary btn-sm" onClick={async () => {
                    await api.put(`/api/orders/${o.id}/status?status=shipped`)
                    api.get('/api/orders/sold').then(res => setOrders(res.data))
                  }}>发货</button>
                )}
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray-500)' }}>暂无卖出订单</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
