import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ProductDetail from './pages/ProductDetail'
import SellerCenter from './pages/SellerCenter'
import Orders from './pages/Orders'
import AdminPanel from './pages/AdminPanel'
import api from './services/api'

function Navbar() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('user')
    if (saved) setUser(JSON.parse(saved))
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
        <Route path="/seller" element={<SellerCenter />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  )
}

export default App
