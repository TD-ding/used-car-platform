import { useState, useEffect } from 'react'
import api from '../services/api'

const statusLabel = {
  pending: '待付款', paid: '已付款', shipped: '已发货', completed: '已完成', cancelled: '已取消',
}

export default function Orders() {
  const [orders, setOrders] = useState([])

  useEffect(() => {
    api.get('/api/orders/my').then(res => setOrders(res.data)).catch(() => {})
  }, [])

  const handleAction = async (orderId, status) => {
    await api.put(`/api/orders/${orderId}/status?status=${status}`)
    api.get('/api/orders/my').then(res => setOrders(res.data))
  }

  return (
    <div className="container">
      <h2 style={{ marginBottom: 24 }}>我的订单</h2>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>订单号</th>
              <th>商品</th>
              <th>金额</th>
              <th>状态</th>
              <th>时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id}>
                <td>{o.order_no}</td>
                <td>
                  {o.items.map(i => (
                    <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{i.product_title}</span>
                    </div>
                  ))}
                </td>
                <td>¥{o.total_price.toFixed(2)}</td>
                <td><span className={`tag tag-${o.status === 'completed' ? 'approved' : o.status}`}>{statusLabel[o.status] || o.status}</span></td>
                <td>{new Date(o.created_at).toLocaleDateString()}</td>
                <td>
                  {o.status === 'pending' && (
                    <>
                      <button className="btn btn-success btn-sm" onClick={() => handleAction(o.id, 'paid')}>付款</button>{' '}
                      <button className="btn btn-danger btn-sm" onClick={() => handleAction(o.id, 'cancelled')}>取消</button>
                    </>
                  )}
                  {o.status === 'shipped' && (
                    <button className="btn btn-success btn-sm" onClick={() => handleAction(o.id, 'completed')}>确认收货</button>
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray-500)' }}>暂无订单</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
