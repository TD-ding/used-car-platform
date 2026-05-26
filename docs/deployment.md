# 部署文档

## 前置条件

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose（可选，推荐）

## 方式一：Docker Compose（推荐）

```bash
# 1. 克隆仓库
git clone https://github.com/TD-ding/used-car-platform.git
cd used-car-platform

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 修改 SECRET_KEY

# 3. 启动所有服务
docker compose up --build -d

# 4. 初始化数据库（首次运行）
docker compose exec backend python seed.py
```

访问：
- 前端：http://localhost
- 后端 API：http://localhost:8000/docs

默认账号：
- 管理员：admin / admin123
- 商家：merchant / merchant123

## 方式二：手动部署

### 后端

```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 配置数据库
# 编辑 .env 设置 DATABASE_URL=postgresql://user:pass@localhost:5432/used_market

# 创建数据库
createdb used_market

# 初始化数据
python seed.py

# 启动服务
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 前端

```bash
cd frontend

# 安装依赖
npm install

# 开发模式（代理到后端）
npm run dev

# 生产构建
npm run build
# dist/ 目录可部署到任何静态文件服务器
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | `postgresql://postgres:postgres@db:5432/used_market` |
| `SECRET_KEY` | JWT 签名密钥（生产环境务必修改） | `change-this-in-production` |
| `UPLOAD_DIR` | 图片上传目录 | `uploads` |
| `HOST_PORT` | 后端宿主机端口映射 | `8000` |
| `HOST_WEB_PORT` | 前端宿主机端口映射 | `80` |
