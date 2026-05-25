# 二手车交易平台 - 前端文档

## 技术栈

- React 18 + React Router 6
- Axios（HTTP 请求）
- 原生 CSS（全局样式）

## 项目结构

```
frontend/src/
├── components/        # 公共组件
│   ├── Navbar.js      # 导航栏（桌面端 + 移动端菜单）
│   ├── Pagination.js  # 分页组件
│   └── VehicleCard.js # 车辆卡片组件
├── contexts/
│   └── AuthContext.js  # 认证上下文（登录/注册/登出）
├── pages/             # 页面组件
│   ├── Home.js        # 首页（推荐车辆 + 最新发布）
│   ├── Login.js       # 登录页
│   ├── Register.js    # 注册页
│   ├── VehicleList.js # 车辆市场（搜索/筛选/排序）
│   ├── VehicleDetail.js # 车辆详情（轮播图/卖家信息/联系）
│   ├── PostVehicle.js # 发布车辆
│   ├── MyVehicles.js  # 我的车辆
│   ├── Favorites.js   # 我的收藏
│   ├── Messages.js    # 消息系统
│   ├── Profile.js     # 个人中心
│   ├── DataAnalysis.js # 数据分析（超级用户+管理员）
│   └── admin/         # 管理后台
│       ├── Dashboard.js  # 仪表盘
│       ├── Users.js      # 用户管理
│       ├── Vehicles.js   # 车辆审核
│       └── Config.js     # 系统配置
├── services/
│   └── api.js         # Axios 实例（请求/响应拦截器）
└── styles/
    └── global.css     # 全局样式
```

## 页面说明

| 页面 | 路由 | 权限 | 功能 |
|------|------|------|------|
| 首页 | `/` | 公开 | 推荐车辆、最新发布 |
| 登录 | `/login` | 公开 | 用户名密码登录 |
| 注册 | `/register` | 公开 | 注册新账号 |
| 车辆市场 | `/vehicles` | 公开 | 搜索、筛选、排序、分页 |
| 车辆详情 | `/vehicles/:id` | 公开 | 图片轮播、参数、联系卖家 |
| 发布车辆 | `/post` | 登录 | 表单填写、图片上传预览 |
| 我的车辆 | `/my-vehicles` | 登录 | 查看状态、删除 |
| 收藏 | `/favorites` | 登录 | 查看/取消收藏 |
| 消息 | `/messages` | 登录 | 会话列表、实时聊天 |
| 个人中心 | `/profile` | 登录 | 修改信息、修改密码 |
| 数据分析 | `/analysis` | 超级用户+管理员 | 数据统计图表 |
| 管理后台 | `/admin/*` | 管理员 | 仪表盘、用户管理、车辆审核 |

## 数据流

- **认证状态**：`AuthContext` 管理，token 存储在 localStorage
- **API 请求**：统一通过 `services/api.js` 的 Axios 实例，自动携带 token
- **响应拦截**：401 时自动清除 token 并跳转登录页
- **搜索历史**：localStorage 存储，最多 8 条

## 关键交互

- 车辆列表支持 4 种排序（最新/价格升降/热门）
- 搜索历史标签可点击快速填充
- 图片轮播支持前后切换、缩略图、圆点指示器
- 发布车辆表单有品牌推荐（datalist）和图片预览
- 消息发送后自动滚动到底部
- 移动端导航栏自动切换为汉堡菜单

## 移动端适配

响应式断点：
- `>768px`：桌面端布局
- `480-768px`：2列网格
- `<480px`：单列布局
