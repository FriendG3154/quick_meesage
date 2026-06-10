# quick_message

快灵感项目，包含微信小程序和基于 Next.js/tRPC 的管理端后端。

## 项目结构

- `qmesga/`：微信小程序源码，主要页面在 `qmesga/miniprogram/pages/`。
- `qmesga/miniprogram/utils/api.ts`：小程序 tRPC 请求封装。
- `qmesga/miniprogram/utils/storage.ts`：小程序本地笔记缓存与未登录兜底存储。
- `backend/`：Next.js 15 + tRPC + Drizzle 后端/管理端项目。
- `backend/src/server/api/routers/`：tRPC 业务路由。
- `backend/src/server/db/schema.ts`：Drizzle 数据库表结构。

## 小程序接口环境

小程序请求地址由 `wx.getAccountInfoSync().miniProgram.envVersion` 自动选择：

- 开发版：`http://localhost:3000/api/trpc`
- 体验版：`http://101.133.137.118/api/trpc`
- 正式版：`http://101.133.137.118/api/trpc`

后端不可用时，文本、录音、手绘保存会回退到本地存储，并向用户提示“网络异常，已保存到本地”。

## 后端常用命令

在 `backend/` 目录下执行：

```bash
npm run dev
npm run typecheck
npm run check
npm run build
npm run db:generate
npm run db:migrate
npm run db:push
```

## 联调建议

1. 启动后端：`cd backend && npm run dev`。
2. 使用微信开发者工具打开 `qmesga/`。
3. 开发版小程序会请求本地 `http://localhost:3000/api/trpc`。
4. 验证登录、首页最近笔记、文本笔记保存、录音保存、手绘保存。
