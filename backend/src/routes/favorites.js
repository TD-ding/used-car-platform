const express = require('express');
const { pool } = require('../config/database');
const auth = require('../middleware/auth');
const { validateId } = require('../utils/validation');
const { handleDbError } = require('../utils/errors');
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
    handleDbError(err, res, '获取收藏列表');
  }
});

// --- 添加收藏 ---
router.post('/', auth, async (req, res) => {
  try {
    const { vehicleId } = req.body;
    const idCheck = validateId(vehicleId, '车辆ID');
    if (!idCheck.valid) return res.status(400).json({ message: '请指定有效的车辆ID' });

    const [existing] = await pool.query(
      'SELECT id FROM favorites WHERE user_id = ? AND vehicle_id = ?',
      [req.user.id, idCheck.value]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: '已收藏过该车辆' });
    }

    await pool.query('INSERT INTO favorites (user_id, vehicle_id) VALUES (?, ?)', [req.user.id, idCheck.value]);
    res.status(201).json({ message: '收藏成功' });
  } catch (err) {
    handleDbError(err, res, '添加收藏');
  }
});

// --- 取消收藏 ---
router.delete('/:vehicleId', auth, async (req, res) => {
  try {
    const idCheck = validateId(req.params.vehicleId, '车辆ID');
    if (!idCheck.valid) return res.status(400).json({ message: idCheck.error });

    await pool.query('DELETE FROM favorites WHERE user_id = ? AND vehicle_id = ?',
      [req.user.id, idCheck.value]);
    res.json({ message: '取消收藏成功' });
  } catch (err) {
    handleDbError(err, res, '取消收藏');
  }
});

module.exports = router;
