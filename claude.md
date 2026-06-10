# 项目全局指令
## 1.项目简介
这是一个餐饮企业的后台管理系统，核心目标是管理从供应商、食材、餐厅，到需求、采购的全链路流程。系统采用现代化的技术栈，前端使用 Next.js 和 Tailwind CSS，后端使用 tRPC 和 drizzle，数据库使用 PostgreSQL。系统设计注重安全性、可维护性和性能，遵循严格的编码规范和最佳实践。
## 2. 项目路径
- 前端代码：`/backend/src/app`
- 后端代码：`/backend/src/server`
- 微信小程序代码 ：`/qmesage`
## 3. 项目结构
### 1.管理端项目
#### 1. 技术栈与编码规范
- 编程语言：TS，
- 框架：Next.js，tRPC
- 样式：Tailwind CSS，遵循原子化原则，禁止使用全局样式
- 组件库：ant-design，禁止引入其他 UI 库
- ui中间层: refine
- 权限：refine
- ORM: drizzle
- 后台通过Trpc暴露API，前端通过App Router调用Trpc接口
- 代码风格：遵循 Airbnb JavaScript Style Guide，使用 Prettier 格式化代码
- 目录结构：前端代码放在 `/manage/src/app`，后端代码放在 `/manage/src/server`
- 数据库：PostgreSQL，使用 Prisma 进行 ORM 映射
- 错误处理：后端必须使用 try-catch 捕获异常并返回统一格式的错误响应，前端必须对 API 错误进行友好提示
- 数据库字段命名：使用小写字母和下划线分隔（snake_case），例如 `user_id`、`created_at`,`created_by`，避免使用驼峰命名或其他风格
- id字段：所有数据库表的主键字段必须命名为 `id`，改为uuid.v7，并且设置为自动生成，禁止手动赋值。
- 命名规则：函数用小驼峰，类用大驼峰，常量全大写加下划线，Agent 相关类名必须以「Agent」结尾
- 注释要求：核心函数必须写中文文档字符串（docstring），包含入参、出参、功能描述
#### 2. 项目目录
- `/manage/src/app`：前端代码，包含页面组件、UI 组件、样式等
- `/manage/src/server`：后端代码，包含 API 路由、业务逻辑、数据库访问等
- `/manage/generated/prisma`：Prisma 生成的客户端代码
- `/manage/public`：静态资源，如图片、字体等
- `/manage/src/env.js`：环境变量校验入口，使用 zod 定义和验证环境变量

### 2.小程序项目
#### 1. 技术栈与编码规范
- 接口地址：后端通过Trpc暴露API，前端通过App Router调用Trpc接口
- 编程语言：TS
- UI组件为TDesign，禁止引入其他 UI 库
- 后台通过Trpc暴露API，前端通过App Router调用Trpc接口
- 本地测试环境调用后端接口地址为 `http://localhost:3000/api/trpc`，生产环境调用 `http://101.133.137.118/api/trpc`
- 代码风格：遵循 Airbnb JavaScript Style Guide，使用 Prettier 格式化代码
- 错误处理：后端必须使用 try-catch 捕获异常并返回统一格式的错误响应，前端必须对 API 错误进行友好提示
- 字段命名：使用小写字母和下划线分隔（snake_case），例如 `user_id`、`created_at`,`created_by`，避免使用驼峰命名或其他风格
- id字段：所有数据库表的主键字段必须命名为 `id`，改为uuid.v7，并且设置为自动生成，禁止手动赋值。
- 命名规则：函数用小驼峰，类用大驼峰，常量全大写加下划线，Agent 相关类名必须以「Agent」结尾
- 注释要求：核心函数必须写中文文档字符串（docstring），包含入参、出参、功能描述
#### 2. 项目目录
- `/wechat/components`：前端组件代码
- `/wechat/pages`：前端页面代码
- `/wechat/utils`：工具函数和辅助代码
- `/wechat/img`：图片资源
- `/wechat/router`：路由配置