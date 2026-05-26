import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ProductDetail from './pages/ProductDetail'
import SellerCenter from './pages/SellerCenter'
import Orders from './pages/Orders'
import AdminPanel from './pages/AdminPanel'
import Favorites from './pages/Favorites'
import api from './services/api'

function Navbar() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [favCount, setFavCount] = useState(0)

  useEffect(() => {
    const saved = localStorage.getItem('user')
    if (saved) {
      setUser(JSON.parse(saved))
      api.get('/api/products/favorites/count').then(res => setFavCount(res.data.count)).catch(() => {})
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">闲置好物</Link>
        <div className="navbar-links">
          <Link to="/">首页</Link>
          {user ? (
            <>
              <Link to="/favorites">
                收藏{favCount > 0 && <span style={{ background: 'var(--danger)', color: 'white', borderRadius: 10, fontSize: '0.7rem', padding: '1px 6px', marginLeft: 4 }}>{favCount}</span>}
              </Link>
              {(user.role === 'merchant' || user.role === 'admin') && (
                <Link to="/seller">卖家中心</Link>
              )}
              <Link to="/orders">我的订单</Link>
              {user.role === 'admin' && <Link to="/admin">管理后台</Link>}
              <span style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>
                {user.username}
                <span className={`tag tag-${user.role}`} style={{ marginLeft: 6 }}>
                  {user.role === 'admin' ? '管理员' : user.role === 'merchant' ? '商家' : '用户'}
                </span>
              </span>
              <button onClick={handleLogout}>退出</button>
            </>
          ) : (
            <>
              <Link to="/login">登录</Link>
              <Link to="/register">注册</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/seller" element={<SellerCenter />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  )
}

export default App
