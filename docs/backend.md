# 二手车交易平台 - 后端文档

## 技术栈

- Node.js 18 + Express 4
- MySQL 8.0（mysql2/promise）
- JWT（jsonwebtoken）认证
- bcryptjs 密码加密
- helmet + express-rate-limit 安全防护
- multer 文件上传

## 项目结构

```
backend/src/
├── config/
│   └── database.js    # MySQL 连接池 + 数据库初始化
├── middleware/
│   ├── auth.js        # JWT 认证中间件
│   ├── role.js        # 角色权限中间件
│   └── upload.js      # 文件上传中间件（multer）
├── routes/
│   ├── auth.js        # 认证路由（注册/登录/当前用户）
│   ├── users.js       # 用户路由（列表/更新/删除）
│   ├── vehicles.js    # 车辆路由（CRUD/列表/排序/置顶）
│   ├── favorites.js   # 收藏路由
│   ├── messages.js    # 消息路由（会话/发送/已读）
│   └── admin.js       # 管理路由（统计/审核/车辆管理）
├── utils/
│   ├── validation.js  # 输入验证工具
│   └── errors.js      # 集中式错误处理
└── index.js           # 入口文件（Express 配置）
```

## API 端点

### 认证 `/api/auth`

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| POST | `/register` | 公开 | 注册（用户名+密码必填，最少3/6位） |
| POST | `/login` | 公开 | 登录（返回 JWT token） |
| GET | `/me` | 登录 | 获取当前用户信息 |

### 用户 `/api/users`

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/` | 管理员 | 用户列表（分页+搜索） |
| PUT | `/profile` | 登录 | 更新个人信息 |
| PUT | `/password` | 登录 | 修改密码 |
| PUT | `/:id` | 管理员 | 修改用户角色/状态 |
| DELETE | `/:id` | 管理员 | 删除用户 |

### 车辆 `/api/vehicles`

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/` | 公开 | 车辆列表（筛选/排序/分页） |
| GET | `/my/list` | 登录 | 我的车辆 |
| GET | `/:id` | 公开 | 车辆详情（浏览量+1） |
| POST | `/` | 登录 | 发布车辆（最多8张图） |
| PUT | `/:id` | 登录 | 更新车辆（限本人/管理员） |
| DELETE | `/:id` | 登录 | 删除车辆 |
| PUT | `/:id/feature` | 超级用户+管理员 | 置顶/取消置顶 |

**排序参数**：`sort=latest|price_asc|price_desc|views`

### 收藏 `/api/favorites`

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/` | 登录 | 收藏列表 |
| POST | `/` | 登录 | 添加收藏 |
| DELETE | `/:vehicleId` | 登录 | 取消收藏 |

### 消息 `/api/messages`

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/conversations` | 登录 | 会话列表 |
| GET | `/unread/count` | 登录 | 未读消息数 |
| GET | `/:userId` | 登录 | 与某用户的消息记录 |
| POST | `/` | 登录 | 发送消息 |

### 管理 `/api/admin`

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/stats` | 超级用户+管理员 | 数据统计 |
| GET | `/vehicles/pending` | 管理员 | 待审核车辆 |
| GET | `/vehicles` | 管理员 | 所有车辆（分页） |
| PUT | `/vehicles/:id/review` | 管理员 | 审核车辆（通过/拒绝） |

### 其他

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |

## 数据模型

### users
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT AUTO_INCREMENT | 主键 |
| username | VARCHAR(50) UNIQUE | 用户名 |
| password | VARCHAR(255) | bcrypt 加密密码 |
| role | ENUM('admin','super','user') | 角色 |
| email | VARCHAR(100) | 邮箱 |
| phone | VARCHAR(20) | 手机号 |
| status | ENUM('active','banned') | 状态 |
| vehicle_limit | INT DEFAULT 3 | 发布限额 |

### vehicles
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT AUTO_INCREMENT | 主键 |
| user_id | INT FK | 发布者 |
| brand/model | VARCHAR(50) | 品牌/型号 |
| year | INT | 年份 |
| mileage | INT | 里程（km） |
| price | DECIMAL(10,2) | 价格（元） |
| condition_type | ENUM | 车况 |
| fuel_type | ENUM | 燃料类型 |
| transmission | ENUM | 变速箱 |
| images | JSON | 图片路径数组 |
| status | ENUM('pending','approved','rejected','sold') | 审核状态 |
| is_featured | BOOLEAN | 置顶 |
| views | INT | 浏览量 |

## 安全措施

- helmet 安全头
- express-rate-limit 限流（通用 60/分钟，登录 10/分钟）
- JWT token 认证，7天过期
- bcrypt 密码加密
- CORS 白名单配置
- 输入验证和清洗（validateId/sanitizeString）
- 集中式错误处理（不暴露内部详情）
- 文件上传限制（5MB，仅 JPG/PNG/WebP）
