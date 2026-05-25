const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { validateId, validatePagination, sanitizeString } = require('../utils/validation');
const { handleDbError } = require('../utils/errors');
const router = express.Router();

// --- 获取用户列表（管理员） ---
router.get('/', auth, role('admin'), async (req, res) => {
  try {
    const { page, limit, offset } = validatePagination(req.query.page, req.query.limit);
    const search = sanitizeString(req.query.search || '');

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
      pagination: { page, limit, total: countResult[0].total, pages: Math.ceil(countResult[0].total / limit) }
    });
  } catch (err) {
    handleDbError(err, res, '获取用户列表');
  }
});

// --- 更新用户信息 ---
router.put('/profile', auth, async (req, res) => {
  try {
    const { email, phone } = req.body;
    await pool.query('UPDATE users SET email = ?, phone = ? WHERE id = ?', [email, phone, req.user.id]);
    res.json({ message: '更新成功' });
  } catch (err) {
    handleDbError(err, res, '更新用户信息');
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
    if (users.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const isMatch = await bcrypt.compare(oldPassword, users[0].password);
    if (!isMatch) {
      return res.status(400).json({ message: '旧密码错误' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
    res.json({ message: '密码修改成功' });
  } catch (err) {
    handleDbError(err, res, '修改密码');
  }
});

// --- 管理员更新用户角色/状态 ---
router.put('/:id', auth, role('admin'), async (req, res) => {
  try {
    const idCheck = validateId(req.params.id, '用户ID');
    if (!idCheck.valid) return res.status(400).json({ message: idCheck.error });

    const { role: newRole, status, vehicle_limit } = req.body;

    const [users] = await pool.query('SELECT id, role FROM users WHERE id = ?', [idCheck.value]);
    if (users.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }
    // 不能修改自己的角色
    if (idCheck.value === req.user.id && newRole && newRole !== req.user.role) {
      return res.status(400).json({ message: '不能修改自己的角色' });
    }

    const updates = [];
    const params = [];
    if (newRole && ['admin', 'super', 'user'].includes(newRole)) { updates.push('role = ?'); params.push(newRole); }
    if (status && ['active', 'banned'].includes(status)) { updates.push('status = ?'); params.push(status); }
    if (vehicle_limit !== undefined) { updates.push('vehicle_limit = ?'); params.push(parseInt(vehicle_limit) || 3); }

    if (updates.length === 0) {
      return res.status(400).json({ message: '没有需要更新的字段' });
    }

    params.push(idCheck.value);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ message: '更新成功' });
  } catch (err) {
    handleDbError(err, res, '管理员更新用户');
  }
});

// --- 删除用户（管理员） ---
router.delete('/:id', auth, role('admin'), async (req, res) => {
  try {
    const idCheck = validateId(req.params.id, '用户ID');
    if (!idCheck.valid) return res.status(400).json({ message: idCheck.error });

    if (idCheck.value === req.user.id) {
      return res.status(400).json({ message: '不能删除自己' });
    }

    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [idCheck.value]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }
    res.json({ message: '删除成功' });
  } catch (err) {
    handleDbError(err, res, '删除用户');
  }
});

module.exports = router;
