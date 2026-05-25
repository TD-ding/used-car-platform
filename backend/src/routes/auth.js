const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const auth = require('../middleware/auth');
const { sanitizeString } = require('../utils/validation');
const { handleDbError } = require('../utils/errors');
const router = express.Router();

// --- 用户注册 ---
router.post('/register', async (req, res) => {
  try {
    const { username, password, email, phone } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' });
    }

    const cleanUsername = sanitizeString(username, 50);
    if (cleanUsername.length < 3) {
      return res.status(400).json({ message: '用户名长度需在3-50之间' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: '密码至少6位' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [cleanUsername]);
    if (existing.length > 0) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (username, password, email, phone) VALUES (?, ?, ?, ?)',
      [cleanUsername, hashedPassword, email || null, phone || null]
    );

    const token = jwt.sign(
      { id: result.insertId, username: cleanUsername, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: '注册成功',
      token,
      user: { id: result.insertId, username: cleanUsername, role: 'user', email, phone }
    });
  } catch (err) {
    handleDbError(err, res, '注册');
  }
});

// --- 用户登录 ---
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' });
    }

    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [sanitizeString(username, 50)]);
    if (users.length === 0) {
      return res.status(400).json({ message: '用户名或密码错误' });
    }

    const user = users[0];
    if (user.status === 'banned') {
      return res.status(403).json({ message: '账号已被封禁，请联系管理员' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: '用户名或密码错误' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        vehicle_limit: user.vehicle_limit
      }
    });
  } catch (err) {
    handleDbError(err, res, '登录');
  }
});

// --- 获取当前用户信息 ---
router.get('/me', auth, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, role, email, phone, avatar, vehicle_limit, status, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (users.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }
    res.json(users[0]);
  } catch (err) {
    handleDbError(err, res, '获取用户信息');
  }
});

module.exports = router;
