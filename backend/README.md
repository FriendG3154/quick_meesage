# backend

quick_message 的后端/管理端项目，基于 Next.js 15、tRPC、Drizzle ORM 和 PostgreSQL。

## 技术栈

- Next.js 15 App Router
- tRPC 11
- Drizzle ORM
- PostgreSQL
- Tailwind CSS
- TypeScript

## 关键目录

- `src/app/`：Next.js 页面与路由入口。
- `src/server/api/root.ts`：tRPC 路由聚合。
- `src/server/api/routers/`：业务模块路由，包括用户、笔记、图片、语音、回收站、认证和扫码登录。
- `src/server/db/schema.ts`：数据库表结构。
- `src/env.js`：环境变量校验。

## 常用命令

```bash
npm run dev
npm run typecheck
npm run check
npm run build
npm run db:generate
npm run db:migrate
npm run db:push
npm run db:studio
```

## 主要接口模块

- `user`：微信快捷登录、用户查询、用户列表、用户统计。
- `message`：文本笔记、语音记录、手绘作品的创建、查询、更新、删除、恢复和统计。
- `pic`：图片资源记录。
- `voice`：语音资源记录。
- `trash`：回收站记录。
- `qrLogin`：管理端扫码登录流程。

## 本地开发

1. 配置数据库和微信相关环境变量。
2. 执行数据库迁移或推送：`npm run db:migrate` 或 `npm run db:push`。
3. 启动开发服务：`npm run dev`。
4. 小程序开发版默认访问 `http://localhost:3000/api/trpc`。
