const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDatabase } = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const vehicleRoutes = require('./routes/vehicles');
const favoriteRoutes = require('./routes/favorites');
const messageRoutes = require('./routes/messages');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(cors());
app.use(express.json());
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
