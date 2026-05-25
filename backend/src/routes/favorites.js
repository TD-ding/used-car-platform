const express = require('express');
const { pool } = require('../config/database');
const auth = require('../middleware/auth');
const router = express.Router();

// --- 获取收藏列表 ---
router.get('/', auth, async (req, res) => {
  try {
    const [favorites] = await pool.query(
      `SELECT f.id as favorite_id, f.created_at as favorited_at, v.*
       FROM favorites f JOIN vehicles v ON f.vehicle_id = v.id
       WHERE f.user_id = ? ORDER BY f.created_at DESC`,
      [req.user.id]
    );
    favorites.forEach(f => {
      try { f.images = JSON.parse(f.images || '[]'); } catch { f.images = []; }
    });
    res.json(favorites);
  } catch (err) {
    console.error('获取收藏列表错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// --- 添加收藏 ---
router.post('/', auth, async (req, res) => {
  try {
    const { vehicleId } = req.body;
    if (!vehicleId) {
      return res.status(400).json({ message: '请指定车辆ID' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM favorites WHERE user_id = ? AND vehicle_id = ?',
      [req.user.id, vehicleId]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: '已收藏过该车辆' });
    }

    await pool.query('INSERT INTO favorites (user_id, vehicle_id) VALUES (?, ?)', [req.user.id, vehicleId]);
    res.status(201).json({ message: '收藏成功' });
  } catch (err) {
    console.error('添加收藏错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// --- 取消收藏 ---
router.delete('/:vehicleId', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM favorites WHERE user_id = ? AND vehicle_id = ?',
      [req.user.id, req.params.vehicleId]);
    res.json({ message: '取消收藏成功' });
  } catch (err) {
    console.error('取消收藏错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
