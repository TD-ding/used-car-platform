import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await api.post('/api/auth/login', form)
      localStorage.setItem('token', res.data.access_token)
      localStorage.setItem('user', JSON.stringify({
        username: res.data.username,
        role: res.data.role,
      }))
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || '登录失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>登录</h2>
        {error && <div className="error-msg">{error}</div>}
        <div className="form-group">
          <label>用户名</label>
          <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>密码</label>
          <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
        </div>
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? '登录中...' : '登录'}
        </button>
        <p>还没有账号？<Link to="/register">去注册</Link></p>
      </form>
    </div>
  )
}
