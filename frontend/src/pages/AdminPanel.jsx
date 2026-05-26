import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

// Animated counter from 0 to value
function AnimatedNumber({ value, decimals = 0, duration = 800 }) {
  const [display, setDisplay] = useState(0)
  const startRef = useRef(null)

  useEffect(() => {
    const start = 0
    const startTime = performance.now()
    const animate = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(start + (value - start) * eased)
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [value, duration])

  return decimals > 0 ? display.toFixed(decimals) : Math.round(display)
}

export default function AdminPanel() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('dashboard')
  const [user, setUser] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('user')
    if (!saved) { navigate('/login'); return }
    const u = JSON.parse(saved)
    setUser(u)
    if (u.role !== 'admin') { navigate('/'); return }
  }, [navigate])

  if (!user) return null

  return (
    <div className="container">
      <h2 style={{ marginBottom: 24 }}>管理后台</h2>
      <div className="tabs">
        <button className={`tab ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')}>数据概览</button>
        <button className={`tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>用户管理</button>
        <button className={`tab ${tab === 'products' ? 'active' : ''}`} onClick={() => setTab('products')}>商品审核</button>
        <button className={`tab ${tab === 'categories' ? 'active' : ''}`} onClick={() => setTab('categories')}>分类管理</button>
      </div>

      {tab === 'dashboard' && <Dashboard />}
      {tab === 'users' && <UserManagement />}
      {tab === 'products' && <ProductReview />}
      {tab === 'categories' && <CategoryManagement />}
    </div>
  )
}

function Dashboard() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.get('/api/admin/stats').then(res => setStats(res.data))
  }, [])

  if (!stats) return <div>加载中...</div>

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-value"><AnimatedNumber value={stats.total_users} /></div>
        <div className="stat-label">总用户数</div>
      </div>
      <div className="stat-card">
        <div className="stat-value"><AnimatedNumber value={stats.total_products} /></div>
        <div className="stat-label">总商品数</div>
      </div>
      <div className="stat-card">
        <div className="stat-value"><AnimatedNumber value={stats.total_orders} /></div>
        <div className="stat-label">总订单数</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">¥<AnimatedNumber value={stats.total_revenue} decimals={2} /></div>
        <div className="stat-label">总交易额</div>
      </div>
      <div className="stat-card">
        <div className="stat-value"><AnimatedNumber value={stats.pending_products} /></div>
        <div className="stat-label">待审核商品</div>
      </div>
    </div>
  )
}

function UserManagement() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')

  const loadUsers = (q = '') => {
    const params = q ? { search: q } : {}
    api.get('/api/admin/users', { params }).then(res => setUsers(res.data))
  }

  useEffect(() => { loadUsers() }, [])

  const handleSearch = () => loadUsers(search)
  const handleClear = () => { setSearch(''); loadUsers() }

  const updateRole = async (userId, role) => {
    await api.put(`/api/admin/users/${userId}`, { role })
    loadUsers(search)
  }

  const toggleActive = async (userId, isActive) => {
    await api.put(`/api/admin/users/${userId}`, { is_active: isActive ? 0 : 1 })
    loadUsers(search)
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索用户名或邮箱..." onKeyDown={e => e.key === 'Enter' && handleSearch()} />
        <button className="btn btn-primary btn-sm" onClick={handleSearch}>搜索</button>
        {search && <button className="btn btn-outline btn-sm" onClick={handleClear}>清除</button>}
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr><th>ID</th><th>用户名</th><th>邮箱</th><th>角色</th><th>状态</th><th>注册时间</th><th>操作</th></tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.username}</td>
              <td>{u.email}</td>
              <td><span className={`tag tag-${u.role}`}>{u.role === 'admin' ? '管理员' : u.role === 'merchant' ? '商家' : '用户'}</span></td>
              <td>{u.is_active ? '正常' : '禁用'}</td>
              <td>{new Date(u.created_at).toLocaleDateString()}</td>
              <td>
                <select value={u.role} onChange={e => updateRole(u.id, e.target.value)} style={{ padding: 4, borderRadius: 4 }}>
                  <option value="user">用户</option>
                  <option value="merchant">商家</option>
                  <option value="admin">管理员</option>
                </select>{' '}
                <button className={`btn btn-${u.is_active ? 'danger' : 'success'} btn-sm`} onClick={() => toggleActive(u.id, u.is_active)}>
                  {u.is_active ? '禁用' : '启用'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
  )
}

function ProductReview() {
  const [products, setProducts] = useState([])

  useEffect(() => {
    api.get('/api/admin/products/pending').then(res => setProducts(res.data))
  }, [])

  const approve = async (id, status) => {
    await api.put(`/api/admin/products/${id}/approve`, { status })
    api.get('/api/admin/products/pending').then(res => setProducts(res.data))
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr><th>ID</th><th>商品名</th><th>价格</th><th>卖家</th><th>操作</th></tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.title}</td>
              <td>¥{p.price.toFixed(2)}</td>
              <td>{p.seller_name}</td>
              <td>
                <button className="btn btn-success btn-sm" onClick={() => approve(p.id, 'approved')}>通过</button>{' '}
                <button className="btn btn-danger btn-sm" onClick={() => approve(p.id, 'rejected')}>拒绝</button>
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--gray-500)' }}>没有待审核商品</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function CategoryManagement() {
  const [categories, setCategories] = useState([])
  const [name, setName] = useState('')

  useEffect(() => {
    api.get('/api/admin/categories').then(res => setCategories(res.data))
  }, [])

  const addCategory = async () => {
    if (!name.trim()) return
    await api.post('/api/admin/categories', { name })
    setName('')
    api.get('/api/admin/categories').then(res => setCategories(res.data))
  }

  const deleteCategory = async (id) => {
    if (!window.confirm('确定要删除此分类吗？相关商品将变为未分类。')) return
    await api.delete(`/api/admin/categories/${id}`)
    api.get('/api/admin/categories').then(res => setCategories(res.data))
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="分类名称" onKeyDown={e => e.key === 'Enter' && addCategory()} />
        <button className="btn btn-primary" onClick={addCategory}>添加分类</button>
      </div>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>ID</th><th>分类名</th><th>排序</th><th>操作</th></tr></thead>
          <tbody>
            {categories.map(c => (
              <tr key={c.id}>
                <td>{c.id}</td><td>{c.name}</td><td>{c.sort_order}</td>
                <td><button className="btn btn-danger btn-sm" onClick={() => deleteCategory(c.id)}>删除</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
