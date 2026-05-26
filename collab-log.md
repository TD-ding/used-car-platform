# 协作开发日志 - 二手商品交易平台

## 项目信息

- **项目名**: 二手商品交易平台 (used-car-platform)
- **技术栈**: React + Python FastAPI + PostgreSQL
- **仓库**: https://github.com/TD-ding/used-car-platform

## 迭代记录

### 第1轮: feat - 初始版本

**PR**: [#9 (已合并到 master 的第一轮基础)](https://github.com/TD-ding/used-car-platform/pull/9)

**内容**:
- 后端: FastAPI + SQLAlchemy + JWT认证
  - 用户系统: 注册/登录, 三种角色(admin/merchant/user)
  - 商品管理: CRUD, 图片上传, 搜索筛选, 分类
  - 订单系统: 下单, 状态流转, 买家/卖家视图
  - 评论系统: 商品评论, 评分
  - 管理后台: 用户管理, 商品审核, 数据统计, 分类管理
- 前端: React + Vite + React Router
  - 7个页面: 首页/登录/注册/商品详情/卖家中心/订单/管理后台
  - JWT自动注入, 401自动跳转
  - 响应式商品卡片网格, 弹窗表单

### 第2轮: refactor - 代码质量优化

**PR**: [refactor/round2-code-quality](https://github.com/TD-ding/used-car-platform/pull/9)

**模糊化输入**:
> 图片上传限制类型大小、评论XSS防护、订单并发保护、N+1查询优化、搜索loading状态、文件上传组件

**改动**:
- 后端图片上传校验（类型白名单+5MB大小限制+magic bytes检测）
- 评论内容HTML转义防XSS
- 商品/订单列表N+1查询批量优化
- 订单创建行锁(`with_for_update()`)防止并发超卖
- 管理分类接口加权限守卫 + 新增公开分类API
- Pydantic Schema字段校验增强（密码/标题/评论/地址长度限制）
- 前端搜索/表单提交loading状态
- 图片上传改为文件选择组件+预览
- 评论500字限制+字数计数器

### 第3轮: feat - 用户体验优化

**PR**: [feat/round3-ux](https://github.com/TD-ding/used-car-platform/pull/10)

**模糊化输入**:
> 加载更多功能、分类标签快速筛选、回车提交、商品状态按钮、自定义确认弹窗、数字动画

**改动**:
- 首页: IntersectionObserver无限滚动加载 + 分类标签快速筛选
- 登录/注册: 回车提交 + loading状态
- 商品详情: 彩色状态徽章 + 不可购状态按钮
- 卖家中心: 自定义确认弹窗替代原生confirm
- 管理后台: AnimatedNumber数字动画效果（requestAnimationFrame缓动）

### 第4轮: feat - 功能增强

**PR**: [feat/round4-features](https://github.com/TD-ding/used-car-platform/pull/11)

**模糊化输入**:
> 价格排序、商品评分星级、收藏功能、卖家数据统计、用户搜索

**改动**:
- 后端: Favorite模型 + 收藏切换/列表/计数API + 卖家统计API + 管理员用户搜索
- 后端: 商品列表价格排序 + 批量评分/收藏数据填充
- 前端: 首页价格排序+评分星级 + 收藏页面+导航徽章
- 前端: 卖家中心数据统计面板 + 管理后台用户搜索

### 第5轮: fix - Bug修复

**PR**: [fix/round5-bugs](https://github.com/TD-ding/used-car-platform/pull/12)

**模糊化输入**:
> 无限滚动防抖、收藏已下架商品状态、卖家统计缓存、自拥商品编辑按钮、分类删除

**改动**:
- 首页无限滚动防抖（loadingRef同步保护）
- 收藏页已下架商品状态遮罩+不可点击
- 商品详情自拥商品显示编辑按钮而非购买
- 管理后台分类删除功能（先清理FK引用）
- 自拥商品隐藏评论输入

### 基础设施: lint + 测试 + Docker/CI

**PR**: [feat/lint-test-docker-ci](https://github.com/TD-ding/used-car-platform/pull/13)

**改动**:
- Backend: flake8 lint + 10个 pytest 单元测试
- Backend/Frontend Dockerfile
- docker-compose.yml (postgres + backend + frontend + nginx)
- GitHub Actions CI/CD
- .env.example, .gitignore, .dockerignore, nginx/default.conf

### 文档

**改动**:
- docs/frontend.md - 前端架构文档
- docs/backend.md - 后端API文档
- docs/deployment.md - 部署说明
