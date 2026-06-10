import { userRouter } from "~/server/api/routers/user";
import { messageRouter } from "~/server/api/routers/message";
import { picRouter } from "~/server/api/routers/pic";
import { voiceRouter } from "~/server/api/routers/voice";
import { trashRouter } from "~/server/api/routers/trash";
import { authRouter } from "~/server/api/routers/auth";
import { qrLoginRouter } from "~/server/api/routers/qrLogin";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * 主路由聚合器
 * 所有业务模块路由在此注册
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  message: messageRouter,
  pic: picRouter,
  voice: voiceRouter,
  trash: trashRouter,
  auth: authRouter,
  qrLogin: qrLoginRouter,
});

// 导出API类型定义
export type AppRouter = typeof appRouter;

/**
 * 创建服务端调用器
 */
export const createCaller = createCallerFactory(appRouter);
