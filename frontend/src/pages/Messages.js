import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function Messages() {
  const { userId } = useParams();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [otherUser, setOtherUser] = useState(null);

  useEffect(() => {
    api.get('/messages/conversations').then(res => setConversations(res.data));
  }, []);

  useEffect(() => {
    if (userId) {
      api.get(`/messages/${userId}`).then(res => {
        setMessages(res.data);
        if (res.data.length > 0) {
          const other = res.data.find(m => m.sender_id !== user.id);
          setOtherUser(other ? (other.sender_id === user.id ? null : other.sender_name) : null);
        }
      });
    }
  }, [userId, user]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !userId) return;
    try {
      await api.post('/messages', { receiverId: parseInt(userId), content: newMsg });
      setNewMsg('');
      const res = await api.get(`/messages/${userId}`);
      setMessages(res.data);
    } catch (err) {
      alert(err.response?.data?.message || '发送失败');
    }
  };

  return (
    <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 120px)' }}>
      {/* 会话列表 */}
      <div style={{ width: '280px', flexShrink: 0, overflow: 'auto' }}>
        <h3 style={{ marginBottom: '12px' }}>消息列表</h3>
        {conversations.length === 0 ? (
          <p style={{ color: 'var(--gray-500)', fontSize: '14px' }}>暂无消息</p>
        ) : (
          conversations.map((c, i) => (
            <div key={i} onClick={() => window.location.href = `/messages/${c.other_user_id}`}
              style={{
                padding: '12px', cursor: 'pointer', borderRadius: 'var(--radius)',
                background: parseInt(userId) === c.other_user_id ? 'var(--primary-light)' : 'white',
                marginBottom: '4px'
              }}>
              <div style={{ fontWeight: '600', fontSize: '14px' }}>{c.other_username}</div>
              <div style={{ fontSize: '12px', color: 'var(--gray-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.last_message}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 聊天窗口 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
        {userId ? (
          <>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--gray-200)' }}>
              <h3>{otherUser || '对话'}</h3>
            </div>
            <div className="message-list" style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
              {messages.map(m => (
                <div key={m.id} className={`message-item ${m.sender_id === user.id ? 'sent' : 'received'}`}>
                  <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '4px' }}>{m.sender_name}</div>
                  <div>{m.content}</div>
                  <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '4px' }}>
                    {new Date(m.created_at).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px', padding: '16px', borderTop: '1px solid var(--gray-200)' }}>
              <input className="form-control" placeholder="输入消息..." value={newMsg} onChange={e => setNewMsg(e.target.value)} />
              <button type="submit" className="btn btn-primary">发送</button>
            </form>
          </>
        ) : (
          <div className="empty">
            <h3>选择一个对话开始聊天</h3>
          </div>
        )}
      </div>
    </div>
  );
}
