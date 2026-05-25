const express = require('express');
const { pool } = require('../config/database');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { validateId, validatePagination } = require('../utils/validation');
const { handleDbError } = require('../utils/errors');
const router = express.Router();

// --- 数据统计概览 ---
router.get('/stats', auth, role('admin', 'super'), async (req, res) => {
  try {
    const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [vehicleCount] = await pool.query('SELECT COUNT(*) as count FROM vehicles WHERE status = "approved"');
    const [pendingCount] = await pool.query('SELECT COUNT(*) as count FROM vehicles WHERE status = "pending"');
    const [messageCount] = await pool.query('SELECT COUNT(*) as count FROM messages');

    const [dailyUsers] = await pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count FROM users
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY DATE(created_at) ORDER BY date`
    );

    const [dailyVehicles] = await pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count FROM vehicles
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY DATE(created_at) ORDER BY date`
    );

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
    handleDbError(err, res, '获取统计数据');
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
    handleDbError(err, res, '获取待审核车辆');
  }
});

// --- 管理员获取所有车辆 ---
router.get('/vehicles', auth, role('admin'), async (req, res) => {
  try {
    const { page, limit, offset } = validatePagination(req.query.page, req.query.limit);

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
    handleDbError(err, res, '管理员获取车辆列表');
  }
});

// --- 审核车辆（通过/拒绝） ---
router.put('/vehicles/:id/review', auth, role('admin'), async (req, res) => {
  try {
    const idCheck = validateId(req.params.id, '车辆ID');
    if (!idCheck.valid) return res.status(400).json({ message: idCheck.error });

    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: '状态只能为 approved 或 rejected' });
    }

    const [result] = await pool.query('UPDATE vehicles SET status = ? WHERE id = ?', [status, idCheck.value]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '车辆不存在' });
    }

    res.json({ message: status === 'approved' ? '审核通过' : '已拒绝' });
  } catch (err) {
    handleDbError(err, res, '审核车辆');
  }
});

module.exports = router;
