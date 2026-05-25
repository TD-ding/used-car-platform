const express = require('express');
const { pool } = require('../config/database');
const auth = require('../middleware/auth');
const router = express.Router();

// --- 获取会话列表 ---
router.get('/conversations', auth, async (req, res) => {
  try {
    const [conversations] = await pool.query(
      `SELECT
        CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as other_user_id,
        CASE WHEN sender_id = ? THEN u2.username ELSE u1.username END as other_username,
        m.content as last_message,
        m.created_at as last_time,
        (SELECT COUNT(*) FROM messages WHERE receiver_id = ? AND is_read = FALSE) as unread_count
       FROM messages m
       JOIN users u1 ON m.sender_id = u1.id
       JOIN users u2 ON m.receiver_id = u2.id
       WHERE m.id IN (
         SELECT MAX(id) FROM messages
         WHERE sender_id = ? OR receiver_id = ?
         GROUP BY CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END
       )
       ORDER BY m.created_at DESC`,
      [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]
    );
    res.json(conversations);
  } catch (err) {
    console.error('获取会话列表错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// --- 获取与某用户的消息记录 ---
router.get('/:userId', auth, async (req, res) => {
  try {
    const otherUserId = parseInt(req.params.userId);

    // 标记为已读
    await pool.query(
      'UPDATE messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE',
      [otherUserId, req.user.id]
    );

    const [messages] = await pool.query(
      `SELECT m.*, u.username as sender_name
       FROM messages m JOIN users u ON m.sender_id = u.id
       WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
       ORDER BY m.created_at ASC LIMIT 100`,
      [req.user.id, otherUserId, otherUserId, req.user.id]
    );
    res.json(messages);
  } catch (err) {
    console.error('获取消息记录错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// --- 发送消息 ---
router.post('/', auth, async (req, res) => {
  try {
    const { receiverId, vehicleId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ message: '接收者和消息内容不能为空' });
    }
    if (receiverId === req.user.id) {
      return res.status(400).json({ message: '不能给自己发消息' });
    }

    const [result] = await pool.query(
      'INSERT INTO messages (sender_id, receiver_id, vehicle_id, content) VALUES (?, ?, ?, ?)',
      [req.user.id, receiverId, vehicleId || null, content]
    );

    res.status(201).json({ message: '发送成功', id: result.insertId });
  } catch (err) {
    console.error('发送消息错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// --- 获取未读消息数 ---
router.get('/unread/count', auth, async (req, res) => {
  try {
    const [result] = await pool.query(
      'SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = FALSE',
      [req.user.id]
    );
    res.json({ count: result[0].count });
  } catch (err) {
    console.error('获取未读消息数错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
