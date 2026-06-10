# 快灵感 (Quick Message) 项目架构文档

## 1. 项目概述

快灵感是一个灵感记录小程序，支持文本笔记、语音记录、手绘创作三种记录方式。本项目包含小程序前端、管理后台和tRPC后端API三个部分。

### 技术栈
- **前端框架**: Next.js 15 + React 19 + TypeScript
- **样式**: Tailwind CSS 4
- **后端API**: tRPC 11 + Drizzle ORM
- **数据库**: PostgreSQL
- **小程序**: 微信小程序原生开发 + TypeScript

---

## 2. 项目结构

```
quick_message/
├── backend/                    # 管理后台 & API 服务
│   ├── src/
│   │   ├── app/               # Next.js App Router 页面
│   │   │   ├── _components/   # 共享组件
│   │   │   ├── api/trpc/      # tRPC API路由
│   │   │   ├── page.tsx       # 概览页
│   │   │   ├── users/         # 用户管理
│   │   │   ├── messages/      # 笔记管理
│   │   │   ├── trash/         # 回收站
│   │   │   └── auth/          # 会员权限
│   │   ├── server/
│   │   │   ├── api/
│   │   │   │   ├── root.ts    # 路由聚合
│   │   │   │   ├── trpc.ts    # tRPC配置
│   │   │   │   └── routers/   # 业务路由
│   │   │   │       ├── user.ts     # 用户模块
│   │   │   │       ├── message.ts  # 笔记模块
│   │   │   │       ├── pic.ts      # 图片模块
│   │   │   │       ├── voice.ts    # 语音模块
│   │   │   │       ├── trash.ts    # 回收站模块
│   │   │   │       └── auth.ts     # 权限模块
│   │   │   └── db/
│   │   │       ├── index.ts   # 数据库连接
│   │   │       └── schema.ts  # 数据库Schema
│   │   ├── trpc/              # tRPC客户端配置
│   │   │   ├── react.tsx      # React客户端Provider
│   │   │   ├── server.ts      # RSC服务端调用
│   │   │   └── query-client.ts # QueryClient配置
│   │   ├── styles/            # 全局样式
│   │   └── env.js             # 环境变量
│   ├── drizzle.config.ts      # Drizzle配置
│   ├── next.config.js         # Next.js配置
│   └── package.json
│
├── qmesga/                    # 微信小程序
│   └── miniprogram/
│       ├── pages/
│       │   ├── index/         # 首页（记录选择）
│       │   ├── login/         # 微信登录
│       │   ├── mobile-login/  # 手机号登录
│       │   ├── text-note/     # 文本笔记
│       │   ├── voice-record/  # 语音记录
│       │   ├── drawing/       # 手绘创作
│       │   ├── statistics/    # 统计页
│       │   └── settings/      # 设置页
│       ├── components/
│       │   └── navigation-bar/ # 导航栏组件
│       ├── custom-tab-bar/      # 自定义TabBar
│       └── utils/
│           ├── storage.ts       # 本地存储管理
│           ├── theme.ts         # 主题管理
│           └── util.ts          # 工具函数
│
├── example.sql                  # 基础数据库结构参考
└── claude.md                    # 项目指令文档
```

---

## 3. 数据库设计

### 3.1 核心表结构

#### users (用户表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键，自动生成 |
| wx_openid | VARCHAR(255) | 微信OpenID，唯一 |
| phone | VARCHAR(20) | 手机号 |
| wx_name | VARCHAR(255) | 微信昵称 |
| avatar_url | TEXT | 头像URL |
| role | INTEGER | 角色: 0普通, 1会员, 2管理员 |
| is_active | BOOLEAN | 是否活跃 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

#### messages (笔记表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 关联用户 |
| type | VARCHAR(20) | 类型: text/voice/drawing |
| title | VARCHAR(500) | 标题 |
| content | TEXT | 内容(HTML或文件路径) |
| template | VARCHAR(100) | 模板名称 |
| char_count | INTEGER | 字数 |
| duration | INTEGER | 时长(秒) |
| is_deleted | BOOLEAN | 是否删除 |
| is_in_trash | BOOLEAN | 是否在回收站 |
| created_at | TIMESTAMP | 创建时间 |

#### pics (图片表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 关联用户 |
| message_id | UUID | 关联笔记 |
| pic_url | TEXT | 图片URL |
| pid | UUID | 父节点ID |
| remark | TEXT | 备注 |

#### voices (语音表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 关联用户 |
| message_id | UUID | 关联笔记 |
| url | TEXT | 音频URL |
| remark | VARCHAR(500) | 备注 |
| content | TEXT | 语音转文字结果 |
| duration | INTEGER | 时长(秒) |

#### trash (回收站表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| source_id | UUID | 源资源ID |
| source_type | VARCHAR(20) | 资源类型 |
| user_id | UUID | 关联用户 |
| expired_at | TIMESTAMP | 过期时间 |

#### auths (权限表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | VARCHAR(100) | 会员名称 |
| voice_message | BOOLEAN | 语音转文字权限 |
| trash_days | INTEGER | 回收站保留天数 |
| max_storage | INTEGER | 最大存储(MB) |

---

## 4. API 接口设计

### 4.1 用户模块 (user)

| 接口 | 方法 | 说明 |
|------|------|------|
| user.loginByWx | mutation | 微信小程序登录 |
| user.loginByPhone | mutation | 手机号登录 |
| user.getById | query | 获取用户信息 |
| user.update | mutation | 更新用户信息 |
| user.list | query | 获取用户列表(分页) |
| user.getStats | query | 获取用户统计数据 |

### 4.2 笔记模块 (message)

| 接口 | 方法 | 说明 |
|------|------|------|
| message.create | mutation | 创建笔记 |
| message.list | query | 获取笔记列表(分页) |
| message.getById | query | 获取笔记详情 |
| message.update | mutation | 更新笔记 |
| message.softDelete | mutation | 软删除(移入回收站) |
| message.restore | mutation | 从回收站恢复 |
| message.hardDelete | mutation | 永久删除 |
| message.getGlobalStats | query | 全局统计 |

### 4.3 图片模块 (pic)

| 接口 | 方法 | 说明 |
|------|------|------|
| pic.create | mutation | 创建图片记录 |
| pic.list | query | 获取图片列表 |
| pic.getById | query | 获取图片详情 |
| pic.update | mutation | 更新图片信息 |
| pic.softDelete | mutation | 软删除 |
| pic.hardDelete | mutation | 永久删除 |

### 4.4 语音模块 (voice)

| 接口 | 方法 | 说明 |
|------|------|------|
| voice.create | mutation | 创建语音记录 |
| voice.list | query | 获取语音列表 |
| voice.getById | query | 获取语音详情 |
| voice.update | mutation | 更新语音信息 |
| voice.updateTranscription | mutation | 更新语音转文字结果 |
| voice.softDelete | mutation | 软删除 |
| voice.hardDelete | mutation | 永久删除 |

### 4.5 回收站模块 (trash)

| 接口 | 方法 | 说明 |
|------|------|------|
| trash.moveToTrash | mutation | 移入回收站 |
| trash.list | query | 获取回收站列表 |
| trash.restore | mutation | 恢复资源 |
| trash.permanentDelete | mutation | 永久删除 |
| trash.cleanExpired | mutation | 清理过期项目 |

### 4.6 权限模块 (auth)

| 接口 | 方法 | 说明 |
|------|------|------|
| auth.create | mutation | 创建会员等级 |
| auth.list | query | 获取所有等级 |
| auth.getById | query | 获取等级详情 |
| auth.update | mutation | 更新等级 |
| auth.delete | mutation | 删除等级 |
| auth.assignToUser | mutation | 分配权限给用户 |
| auth.getUserAuth | query | 获取用户权限 |
| auth.revokeFromUser | mutation | 取消用户权限 |

---

## 5. 小程序功能模块

### 5.1 页面结构

| 页面 | 路径 | 功能 |
|------|------|------|
| 首页 | pages/index/index | 记录方式选择、最近笔记 |
| 登录页 | pages/login/login | 微信一键登录 |
| 手机号登录 | pages/mobile-login/mobile-login | 手机号+验证码登录 |
| 文本笔记 | pages/text-note/text-note | 富文本编辑器，支持模板 |
| 语音记录 | pages/voice-record/voice-record | 录音、波形可视化 |
| 手绘创作 | pages/drawing/drawing | 画板、画笔工具 |
| 统计页 | pages/statistics/statistics | 数据统计展示 |
| 设置页 | pages/settings/settings | 主题、缓存、账号管理 |

### 5.2 核心功能

- **文本笔记**: 富文本编辑器，支持模板（会议纪要、读书笔记、心情随笔、旅行日记）
- **语音记录**: 录音功能，支持暂停/继续，波形可视化
- **手绘创作**: 画板工具，支持画笔/橡皮擦、颜色选择、撤销/重做
- **数据统计**: 笔记数量、类型分布、周增长趋势
- **主题切换**: 明亮/暗黑/跟随系统三种模式

---

## 6. 管理后台功能

### 6.1 页面结构

| 页面 | 路径 | 功能 |
|------|------|------|
| 概览 | / | 数据统计卡片、最近用户 |
| 用户管理 | /users | 用户列表、搜索、分页 |
| 笔记管理 | /messages | 笔记列表、类型筛选 |
| 回收站 | /trash | 已删除资源管理、恢复/永久删除 |
| 会员权限 | /auth | 会员等级配置、权限对比 |

### 6.2 技术实现

- **路由**: Next.js App Router
- **数据获取**: tRPC React Query
- **组件**: 自定义组件（Sidebar、StatCard、Pagination等）
- **样式**: Tailwind CSS

---

## 7. 部署说明

### 7.1 环境要求
- Node.js >= 20
- PostgreSQL >= 15
- npm >= 10

### 7.2 环境变量
```
DATABASE_URL=postgresql://user:password@localhost:5432/quick_message
NODE_ENV=development
```

### 7.3 数据库迁移
```bash
cd backend
npm run db:push    # 推送Schema到数据库
npm run db:studio  # 打开Drizzle Studio
```

### 7.4 启动服务
```bash
cd backend
npm install
npm run dev        # 开发模式
npm run build      # 生产构建
npm start          # 生产启动
```

---

## 8. 开发规范

### 8.1 代码规范
- TypeScript 严格模式
- 函数小驼峰命名
- 类大驼峰命名
- 常量全大写下划线分隔
- 核心函数中文docstring

### 8.2 数据库规范
- 表名: snake_case
- 字段名: snake_case
- 主键: id (UUID v7)
- 外键: 表名_id
- 时间字段: created_at, updated_at

### 8.3 API规范
- 使用tRPC进行类型安全调用
- 输入参数使用Zod验证
- 错误统一使用TRPCError处理

---

## 9. 后续优化方向

### 9.1 功能增强
- [ ] 微信小程序云存储集成（图片、语音上传）
- [ ] 语音转文字AI集成
- [ ] 笔记搜索功能
- [ ] 笔记分享功能
- [ ] 多设备同步

### 9.2 性能优化
- [ ] 数据库索引优化
- [ ] API缓存策略
- [ ] 图片懒加载
- [ ] 分页加载优化

### 9.3 安全增强
- [ ] JWT认证
- [ ] API速率限制
- [ ] 数据加密存储
- [ ] 敏感信息脱敏
