# 前端文档

## 技术栈

- React 18 + Vite 5
- React Router 6 (客户端路由)
- Axios (HTTP 客户端)
- CSS 变量 + BEM 风格类名

## 页面结构

| 页面 | 路径 | 文件 | 说明 |
|------|------|------|------|
| 首页 | `/` | `pages/Home.jsx` | 商品列表、搜索筛选、分类标签、无限滚动 |
| 登录 | `/login` | `pages/Login.jsx` | JWT 登录 |
| 注册 | `/register` | `pages/Register.jsx` | 注册选择角色（买家/商家） |
| 商品详情 | `/product/:id` | `pages/ProductDetail.jsx` | 商品信息、购买、收藏、评论 |
| 我的收藏 | `/favorites` | `pages/Favorites.jsx` | 收藏列表，已下架商品显示遮罩 |
| 卖家中心 | `/seller` | `pages/SellerCenter.jsx` | 商品管理、卖出订单、数据统计 |
| 我的订单 | `/orders` | `pages/Orders.jsx` | 买家订单列表和状态操作 |
| 管理后台 | `/admin` | `pages/AdminPanel.jsx` | 数据概览、用户管理、商品审核、分类管理 |

## 组件

- `App.jsx` — 路由配置 + 导航栏（含收藏计数徽章）
- `services/api.js` — Axios 实例，JWT 自动注入，401 自动跳转

## 数据流

1. **认证**: 登录成功后 JWT 存入 localStorage，用户信息存为 JSON
2. **API 调用**: axios 拦截器自动附加 `Authorization: Bearer <token>`
3. **角色判断**: 导航栏和页面根据 `user.role` 显示不同功能入口
4. **状态管理**: 各页面独立 useState，无全局状态管理库

## 关键交互

- 首页无限滚动：IntersectionObserver + loadingRef 防重复请求
- 收藏切换：toggle API 返回 `{favorited: true/false}`
- 商品排序：支持最新/价格升序/价格降序
- 自拥商品：详情页检测 seller === currentUser，显示编辑按钮隐藏购买
