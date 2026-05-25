const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const router = express.Router();

// --- 获取用户列表（管理员） ---
router.get('/', auth, role('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let whereClause = '';
    const params = [];
    if (search) {
      whereClause = 'WHERE username LIKE ? OR email LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [countResult] = await pool.query(`SELECT COUNT(*) as total FROM users ${whereClause}`, params);
    const [users] = await pool.query(
      `SELECT id, username, role, email, phone, status, vehicle_limit, created_at FROM users ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      users,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (err) {
    console.error('获取用户列表错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// --- 更新用户信息 ---
router.put('/profile', auth, async (req, res) => {
  try {
    const { email, phone } = req.body;
    await pool.query('UPDATE users SET email = ?, phone = ? WHERE id = ?', [email, phone, req.user.id]);
    res.json({ message: '更新成功' });
  } catch (err) {
    console.error('更新用户信息错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// --- 修改密码 ---
router.put('/password', auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: '请输入旧密码和新密码' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: '新密码至少6位' });
    }

    const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const isMatch = await bcrypt.compare(oldPassword, users[0].password);
    if (!isMatch) {
      return res.status(400).json({ message: '旧密码错误' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
    res.json({ message: '密码修改成功' });
  } catch (err) {
    console.error('修改密码错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// --- 管理员更新用户角色/状态 ---
router.put('/:id', auth, role('admin'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { role: newRole, status, vehicle_limit } = req.body;

    const [users] = await pool.query('SELECT id, role FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }
    // 不能修改自己的角色
    if (userId === req.user.id && newRole && newRole !== req.user.role) {
      return res.status(400).json({ message: '不能修改自己的角色' });
    }

    const updates = [];
    const params = [];
    if (newRole) { updates.push('role = ?'); params.push(newRole); }
    if (status) { updates.push('status = ?'); params.push(status); }
    if (vehicle_limit !== undefined) { updates.push('vehicle_limit = ?'); params.push(vehicle_limit); }

    if (updates.length === 0) {
      return res.status(400).json({ message: '没有需要更新的字段' });
    }

    params.push(userId);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ message: '更新成功' });
  } catch (err) {
    console.error('管理员更新用户错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// --- 删除用户（管理员） ---
router.delete('/:id', auth, role('admin'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (userId === req.user.id) {
      return res.status(400).json({ message: '不能删除自己' });
    }

    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }
    res.json({ message: '删除成功' });
  } catch (err) {
    console.error('删除用户错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
