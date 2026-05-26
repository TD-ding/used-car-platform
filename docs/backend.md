# 后端文档

## 技术栈

- Python 3.11 + FastAPI
- SQLAlchemy ORM + PostgreSQL
- JWT 认证 (python-jose + passlib/bcrypt)
- Pydantic v2 数据校验

## API 端点

### 认证 `/api/auth`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/auth/register` | 注册 | 无 |
| POST | `/api/auth/login` | 登录，返回 JWT | 无 |
| GET | `/api/auth/me` | 当前用户信息 | 需要 |

### 商品 `/api/products`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/products` | 商品列表（支持搜索/筛选/排序/分页） | 无 |
| GET | `/api/products/count` | 商品总数 | 无 |
| GET | `/api/products/my` | 我的商品 | 商家/管理员 |
| GET | `/api/products/favorites` | 我的收藏 | 用户 |
| GET | `/api/products/favorites/count` | 收藏数量 | 用户 |
| GET | `/api/products/stats` | 卖家统计 | 用户 |
| GET | `/api/products/{id}` | 商品详情（自增浏览量） | 无 |
| POST | `/api/products` | 创建商品 | 商家/管理员 |
| PUT | `/api/products/{id}` | 更新商品 | 商家（自己的） |
| DELETE | `/api/products/{id}` | 下架商品 | 商家（自己的） |
| POST | `/api/products/upload` | 上传图片 | 商家/管理员 |
| POST | `/api/products/{id}/favorite` | 切换收藏 | 用户 |

### 订单 `/api/orders`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/orders/{product_id}` | 下单 | 用户 |
| GET | `/api/orders/my` | 我的订单 | 用户 |
| GET | `/api/orders/sold` | 卖出订单 | 用户 |
| PUT | `/api/orders/{id}/status` | 更新订单状态 | 买卖双方 |

### 评论 `/api/comments`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/comments/product/{id}` | 商品评论 | 无 |
| POST | `/api/comments/product/{id}` | 发表评论 | 用户 |
| DELETE | `/api/comments/{id}` | 删除评论 | 评论者/管理员 |

### 管理 `/api/admin`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/admin/users` | 用户列表（支持搜索） | 管理员 |
| PUT | `/api/admin/users/{id}` | 修改用户角色/状态 | 管理员 |
| GET | `/api/admin/products/pending` | 待审核商品 | 管理员 |
| PUT | `/api/admin/products/{id}/approve` | 审核商品 | 管理员 |
| GET | `/api/admin/stats` | 平台统计 | 管理员 |
| GET | `/api/admin/categories` | 分类列表 | 管理员 |
| POST | `/api/admin/categories` | 添加分类 | 管理员 |
| DELETE | `/api/admin/categories/{id}` | 删除分类 | 管理员 |

### 公共

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/categories` | 分类列表 |

## 数据模型

- **User**: id, username, email, hashed_password, role(admin/merchant/user), is_active
- **Category**: id, name, sort_order
- **Product**: id, title, description, price, original_price, condition_level, image, category_id, seller_id, status, views
- **Order**: id, order_no, buyer_id, total_price, status, address, phone, remark
- **OrderItem**: id, order_id, product_id, price
- **Comment**: id, product_id, user_id, content, rating(1-5)
- **Favorite**: id, user_id, product_id

## 错误响应格式

HTTP 异常返回 `{"detail": "错误描述"}`，状态码包括：
- 400: 请求参数错误
- 401: 未认证
- 403: 权限不足
- 404: 资源不存在
- 422: Pydantic 校验失败
