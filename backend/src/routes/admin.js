const express = require('express');
const { pool } = require('../config/database');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const router = express.Router();

// --- 数据统计概览 ---
router.get('/stats', auth, role('admin', 'super'), async (req, res) => {
  try {
    const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [vehicleCount] = await pool.query('SELECT COUNT(*) as count FROM vehicles WHERE status = "approved"');
    const [pendingCount] = await pool.query('SELECT COUNT(*) as count FROM vehicles WHERE status = "pending"');
    const [messageCount] = await pool.query('SELECT COUNT(*) as count FROM messages');

    // 最近7天每天的注册量
    const [dailyUsers] = await pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count FROM users
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY DATE(created_at) ORDER BY date`
    );

    // 最近7天每天的发布量
    const [dailyVehicles] = await pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count FROM vehicles
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY DATE(created_at) ORDER BY date`
    );

    // 品牌分布
    const [brandStats] = await pool.query(
      'SELECT brand, COUNT(*) as count FROM vehicles WHERE status = "approved" GROUP BY brand ORDER BY count DESC LIMIT 10'
    );

    res.json({
      users: userCount[0].count,
      vehicles: vehicleCount[0].count,
      pending: pendingCount[0].count,
      messages: messageCount[0].count,
      dailyUsers,
      dailyVehicles,
      brandStats
    });
  } catch (err) {
    console.error('获取统计数据错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// --- 审核车辆列表 ---
router.get('/vehicles/pending', auth, role('admin'), async (req, res) => {
  try {
    const [vehicles] = await pool.query(
      `SELECT v.*, u.username as seller_name FROM vehicles v JOIN users u ON v.user_id = u.id
       WHERE v.status = 'pending' ORDER BY v.created_at ASC`
    );
    vehicles.forEach(v => {
      try { v.images = JSON.parse(v.images || '[]'); } catch { v.images = []; }
    });
    res.json(vehicles);
  } catch (err) {
    console.error('获取待审核车辆错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// --- 审核车辆（通过/拒绝） ---
router.put('/vehicles/:id/review', auth, role('admin'), async (req, res) => {
  try {
    const vehicleId = parseInt(req.params.id);
    const { status, reason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: '状态只能为 approved 或 rejected' });
    }

    const [result] = await pool.query('UPDATE vehicles SET status = ? WHERE id = ?', [status, vehicleId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '车辆不存在' });
    }

    res.json({ message: status === 'approved' ? '审核通过' : '已拒绝' });
  } catch (err) {
    console.error('审核车辆错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// --- 管理员获取所有车辆 ---
router.get('/vehicles', auth, role('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM vehicles');
    const [vehicles] = await pool.query(
      `SELECT v.*, u.username as seller_name FROM vehicles v JOIN users u ON v.user_id = u.id
       ORDER BY v.created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    vehicles.forEach(v => {
      try { v.images = JSON.parse(v.images || '[]'); } catch { v.images = []; }
    });

    res.json({
      vehicles,
      pagination: { page, limit, total: countResult[0].total, pages: Math.ceil(countResult[0].total / limit) }
    });
  } catch (err) {
    console.error('管理员获取车辆列表错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
