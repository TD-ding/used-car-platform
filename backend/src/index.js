const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { initDatabase } = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const vehicleRoutes = require('./routes/vehicles');
const favoriteRoutes = require('./routes/favorites');
const messageRoutes = require('./routes/messages');
const adminRoutes = require('./routes/admin');

const app = express();

// 安全中间件
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 限流：通用 API 每分钟 60 次
app.use('/api/', rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { message: '请求过于频繁，请稍后再试' }
}));

// 认证接口限流：每分钟 10 次（防暴力破解）
app.use('/api/auth/login', rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: '登录尝试过多，请稍后再试' }
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// 静态文件（上传的图片）
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 全局错误处理
app.use((err, req, res, _next) => {
  console.error('服务器错误:', err);
  if (err.name === 'MulterError') {
    return res.status(400).json({ message: '文件上传失败: ' + err.message });
  }
  // 生产环境不暴露内部错误详情
  res.status(500).json({ message: '服务器内部错误' });
});

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await initDatabase();
    if (require.main === module) {
      app.listen(PORT, () => {
        console.log(`服务器运行在 http://localhost:${PORT}`);
      });
    }
  } catch (err) {
    console.error('启动失败:', err);
    process.exit(1);
  }
}

start();

module.exports = app;
