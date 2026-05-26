# 二手商品交易平台

一个功能完整的二手商品交易平台，支持管理员、商家和普通用户三种角色。

## 技术栈

- **前端**: React 18 + Vite 5 + React Router 6
- **后端**: Python 3.11 + FastAPI + SQLAlchemy
- **数据库**: PostgreSQL 15
- **部署**: Docker + Nginx

## 功能模块

### 用户系统
- 注册/登录（JWT认证）
- 三种角色：管理员、商家、普通用户
- 角色权限控制

### 商品管理
- 商家发布/编辑/下架商品
- 图片上传（类型+大小校验）
- 分类筛选、关键词搜索、价格排序
- 成色评估、原价对比
- 浏览量统计

### 交易流程
- 商品详情浏览
- 下单购买（收货地址/电话/备注）
- 订单状态流转：待付款→已付款→已发货→已完成/已取消
- 并发购买保护（行锁）

### 互动功能
- 商品评论评分（1-5星）
- 商品收藏/取消收藏
- 收藏数量徽章

### 管理后台
- 数据概览（用户/商品/订单/交易额统计）
- 用户管理（搜索/角色变更/禁用）
- 商品审核（通过/拒绝）
- 分类管理（添加/删除）

## 快速开始

```bash
# Docker Compose 一键启动
cp .env.example .env
docker compose up --build -d
docker compose exec backend python seed.py
```

- 前端：http://localhost
- 后端 API 文档：http://localhost:8000/docs
- 默认账号：admin/admin123、merchant/merchant123

详见 [部署文档](docs/deployment.md)

## 项目文档

- [前端文档](docs/frontend.md)
- [后端文档](docs/backend.md)
- [部署文档](docs/deployment.md)
- [协作开发日志](collab-log.md)

## 开发迭代

| 轮次 | 分支 | PR | 内容 |
|------|------|-----|------|
| 1 | feat/round1-init | - | 初始版本 - 前后端完整功能 |
| 2 | refactor/round2-code-quality | #9 | 安全优化 + N+1修复 + 输入校验 |
| 3 | feat/round3-ux | #10 | 无限滚动 + 状态徽章 + 自定义弹窗 + 数字动画 |
| 4 | feat/round4-features | #11 | 收藏/评分/排序/卖家统计/用户搜索 |
| 5 | fix/round5-bugs | #12 | 防抖/已下架遮罩/自拥商品/分类删除 |
| - | feat/lint-test-docker-ci | #13 | Lint + 测试 + Docker + CI/CD |

## License

MIT
