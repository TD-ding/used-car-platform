import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function Messages() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [otherUserName, setOtherUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const msgEndRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    api.get('/messages/conversations')
      .then(res => setConversations(res.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (userId) {
      api.get(`/messages/${userId}`).then(res => {
        setMessages(res.data);
        // 从消息中提取对方用户名
        const otherMsg = res.data.find(m => m.sender_id !== user.id);
        if (otherMsg) {
          setOtherUserName(otherMsg.sender_name);
        }
        // 滚动到底部
        setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
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
      setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      alert(err.response?.data?.message || '发送失败');
    }
  };

  const selectConversation = (otherId) => {
    navigate(`/messages/${otherId}`);
  };

  return (
    <div className="message-page">
      {/* 会话列表 */}
      <div className="message-sidebar">
        <h3 style={{ marginBottom: '12px' }}>消息列表</h3>
        {loading ? (
          <div className="loading" style={{ padding: '20px' }}><div className="spinner"></div></div>
        ) : conversations.length === 0 ? (
          <p style={{ color: 'var(--gray-500)', fontSize: '14px' }}>暂无消息</p>
        ) : (
          conversations.map((c, i) => (
            <div key={i} onClick={() => selectConversation(c.other_user_id)}
              className={`conversation-item ${parseInt(userId) === c.other_user_id ? 'active' : ''}`}>
              <div style={{ fontWeight: '600', fontSize: '14px' }}>{c.other_username}</div>
              <div style={{ fontSize: '12px', color: 'var(--gray-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.last_message}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '2px' }}>
                {new Date(c.last_time).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 聊天窗口 */}
      <div className="message-chat">
        {userId ? (
          <>
            <div className="chat-header">
              <h3>{otherUserName || '对话'}</h3>
            </div>
            <div className="message-list chat-messages">
              {messages.map(m => (
                <div key={m.id} className={`message-item ${m.sender_id === user.id ? 'sent' : 'received'}`}>
                  <div>{m.content}</div>
                  <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '4px' }}>
                    {new Date(m.created_at).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              <div ref={msgEndRef} />
            </div>
            <form onSubmit={handleSend} className="chat-input">
              <input className="form-control" placeholder="输入消息..." value={newMsg}
                onChange={e => setNewMsg(e.target.value)} />
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
