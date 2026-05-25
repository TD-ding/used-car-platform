const express = require('express');
const { pool } = require('../config/database');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const upload = require('../middleware/upload');
const router = express.Router();

// --- 获取车辆列表（公开） ---
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;
    const { brand, model, minPrice, maxPrice, year, fuelType, transmission, condition, keyword, featured } = req.query;

    let whereClause = 'WHERE v.status = "approved"';
    const params = [];

    if (keyword) {
      whereClause += ' AND (v.brand LIKE ? OR v.model LIKE ? OR v.description LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (brand) { whereClause += ' AND v.brand = ?'; params.push(brand); }
    if (model) { whereClause += ' AND v.model LIKE ?'; params.push(`%${model}%`); }
    if (minPrice) { whereClause += ' AND v.price >= ?'; params.push(parseFloat(minPrice)); }
    if (maxPrice) { whereClause += ' AND v.price <= ?'; params.push(parseFloat(maxPrice)); }
    if (year) { whereClause += ' AND v.year = ?'; params.push(parseInt(year)); }
    if (fuelType) { whereClause += ' AND v.fuel_type = ?'; params.push(fuelType); }
    if (transmission) { whereClause += ' AND v.transmission = ?'; params.push(transmission); }
    if (condition) { whereClause += ' AND v.condition_type = ?'; params.push(condition); }
    if (featured === 'true') { whereClause += ' AND v.is_featured = TRUE'; }

    const [countResult] = await pool.query(`SELECT COUNT(*) as total FROM vehicles v ${whereClause}`, params);

    const [vehicles] = await pool.query(
      `SELECT v.*, u.username as seller_name, u.phone as seller_phone
       FROM vehicles v JOIN users u ON v.user_id = u.id
       ${whereClause} ORDER BY v.is_featured DESC, v.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // 解析 images JSON
    vehicles.forEach(v => {
      try { v.images = JSON.parse(v.images || '[]'); } catch { v.images = []; }
    });

    res.json({
      vehicles,
      pagination: { page, limit, total: countResult[0].total, pages: Math.ceil(countResult[0].total / limit) }
    });
  } catch (err) {
    console.error('获取车辆列表错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// --- 获取车辆详情 ---
router.get('/:id', async (req, res) => {
  try {
    const [vehicles] = await pool.query(
      `SELECT v.*, u.username as seller_name, u.phone as seller_phone, u.email as seller_email
       FROM vehicles v JOIN users u ON v.user_id = u.id WHERE v.id = ?`,
      [req.params.id]
    );

    if (vehicles.length === 0) {
      return res.status(404).json({ message: '车辆不存在' });
    }

    const vehicle = vehicles[0];
    try { vehicle.images = JSON.parse(vehicle.images || '[]'); } catch { vehicle.images = []; }

    // 增加浏览量
    await pool.query('UPDATE vehicles SET views = views + 1 WHERE id = ?', [req.params.id]);

    res.json(vehicle);
  } catch (err) {
    console.error('获取车辆详情错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// --- 发布车辆 ---
router.post('/', auth, upload.array('images', 8), async (req, res) => {
  try {
    const { brand, model, year, mileage, price, description, condition_type, fuel_type, transmission, location } = req.body;

    if (!brand || !model || !year || !price) {
      return res.status(400).json({ message: '品牌、型号、年份和价格为必填项' });
    }

    // 检查发布限额
    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM vehicles WHERE user_id = ? AND status != "sold"', [req.user.id]);
    const [userResult] = await pool.query('SELECT vehicle_limit FROM users WHERE id = ?', [req.user.id]);
    if (countResult[0].total >= userResult[0].vehicle_limit) {
      return res.status(400).json({ message: `已达到发布上限（${userResult[0].vehicle_limit}辆），请删除旧车辆或升级账号` });
    }

    const images = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

    // 管理员和超级用户发布的车辆自动审核通过
    const status = ['admin', 'super'].includes(req.user.role) ? 'approved' : 'pending';

    const [result] = await pool.query(
      'INSERT INTO vehicles (user_id, brand, model, year, mileage, price, description, condition_type, fuel_type, transmission, location, images, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, brand, model, parseInt(year), mileage ? parseInt(mileage) : null, parseFloat(price), description || null, condition_type || 'good', fuel_type || 'gasoline', transmission || 'automatic', location || null, JSON.stringify(images), status]
    );

    res.status(201).json({ message: status === 'approved' ? '发布成功' : '发布成功，等待管理员审核', id: result.insertId });
  } catch (err) {
    console.error('发布车辆错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// --- 更新车辆信息 ---
router.put('/:id', auth, async (req, res) => {
  try {
    const vehicleId = parseInt(req.params.id);
    const { brand, model, year, mileage, price, description, condition_type, fuel_type, transmission, location } = req.body;

    const [vehicles] = await pool.query('SELECT user_id FROM vehicles WHERE id = ?', [vehicleId]);
    if (vehicles.length === 0) {
      return res.status(404).json({ message: '车辆不存在' });
    }
    if (vehicles[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '只能修改自己的车辆' });
    }

    await pool.query(
      'UPDATE vehicles SET brand=IFNULL(?,brand), model=IFNULL(?,model), year=IFNULL(?,year), mileage=IFNULL(?,mileage), price=IFNULL(?,price), description=IFNULL(?,description), condition_type=IFNULL(?,condition_type), fuel_type=IFNULL(?,fuel_type), transmission=IFNULL(?,transmission), location=IFNULL(?,location) WHERE id = ?',
      [brand, model, year ? parseInt(year) : null, mileage ? parseInt(mileage) : null, price ? parseFloat(price) : null, description, condition_type, fuel_type, transmission, location, vehicleId]
    );

    res.json({ message: '更新成功' });
  } catch (err) {
    console.error('更新车辆错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// --- 删除车辆 ---
router.delete('/:id', auth, async (req, res) => {
  try {
    const vehicleId = parseInt(req.params.id);
    const [vehicles] = await pool.query('SELECT user_id FROM vehicles WHERE id = ?', [vehicleId]);
    if (vehicles.length === 0) {
      return res.status(404).json({ message: '车辆不存在' });
    }
    if (vehicles[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: '只能删除自己的车辆' });
    }

    await pool.query('DELETE FROM vehicles WHERE id = ?', [vehicleId]);
    res.json({ message: '删除成功' });
  } catch (err) {
    console.error('删除车辆错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// --- 获取我的车辆 ---
router.get('/my/list', auth, async (req, res) => {
  try {
    const [vehicles] = await pool.query(
      'SELECT * FROM vehicles WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    vehicles.forEach(v => {
      try { v.images = JSON.parse(v.images || '[]'); } catch { v.images = []; }
    });
    res.json(vehicles);
  } catch (err) {
    console.error('获取我的车辆错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// --- 超级用户置顶车辆 ---
router.put('/:id/feature', auth, role('super', 'admin'), async (req, res) => {
  try {
    const vehicleId = parseInt(req.params.id);
    const { featured } = req.body;

    await pool.query('UPDATE vehicles SET is_featured = ? WHERE id = ?', [featured ? 1 : 0, vehicleId]);
    res.json({ message: featured ? '已置顶' : '已取消置顶' });
  } catch (err) {
    console.error('置顶操作错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
