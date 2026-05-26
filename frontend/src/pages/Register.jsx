import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'user' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api.post('/api/auth/register', form)
      navigate('/login')
    } catch (err) {
      const detail = err.response?.data?.detail
      if (typeof detail === 'object') {
        setError(Object.values(detail).map(v => v.msg || v).join('; '))
      } else {
        setError(detail || '注册失败')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>注册</h2>
        {error && <div className="error-msg">{error}</div>}
        <div className="form-group">
          <label>用户名</label>
          <input minLength={2} maxLength={50} value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>邮箱</label>
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>密码</label>
          <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
        </div>
        <div className="form-group">
          <label>注册身份</label>
          <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
            <option value="user">普通用户（买家）</option>
            <option value="merchant">商家（卖家）</option>
          </select>
        </div>
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? '注册中...' : '注册'}
        </button>
        <p>已有账号？<Link to="/login">去登录</Link></p>
      </form>
    </div>
  )
}
