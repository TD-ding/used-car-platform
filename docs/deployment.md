# 二手车交易平台 - 部署文档

## 前置条件

- Docker 20+
- Docker Compose 2+
- Node.js 18+（本地开发）

## 快速部署（Docker）

### 1. 克隆项目

```bash
git clone https://github.com/TD-ding/used-car-platform.git
cd used-car-platform
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，修改以下变量：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| PORT | 对外端口 | 80 |
| DB_PASSWORD | MySQL root 密码 | 123456 |
| DB_NAME | 数据库名 | used_car_platform |
| JWT_SECRET | JWT 签名密钥 | 需更换 |
| ADMIN_PASSWORD | 管理员初始密码 | admin123 |

### 3. 启动服务

```bash
docker compose up -d
```

### 4. 访问

- 前端：http://localhost
- 后端 API：http://localhost:5000/api/health
- 默认管理员：admin / (ADMIN_PASSWORD)

## 本地开发

### 后端

```bash
cd backend
cp .env.example .env
# 编辑 .env 配置本地 MySQL
npm install
npm run dev
```

### 前端

```bash
cd frontend
npm install
npm start
```

前端开发服务器自动代理 `/api` 到 `http://localhost:5000`。

## 测试

```bash
cd backend
npm test          # 运行单元测试
node node_modules/eslint/bin/eslint.js src/  # ESLint 检查
```

## CI/CD

- **CI**（每个 PR）：lint → test → build
- **CD**（push to master）：build → Docker build → compose up → health check → teardown

## 数据持久化

Docker Compose 使用命名卷：
- `mysql_data`：MySQL 数据
- `uploads_data`：上传的图片文件

## 注意事项

- 生产环境务必更换 `JWT_SECRET` 和 `ADMIN_PASSWORD`
- `CORS_ORIGIN` 应设置为实际前端域名
- 定期备份 MySQL 数据卷
