import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, lt } from "drizzle-orm";
import { createHash, randomBytes } from "crypto";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { qrLoginSessions, users } from "~/server/db/schema";
import { db } from "~/server/db";

/**
 * 生成安全的随机token
 * @returns 32字节十六进制字符串
 */
function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * 二维码登录模块 Router
 * 处理管理后台扫码登录的完整流程
 */
export const qrLoginRouter = createTRPCRouter({
  /**
   * 创建二维码登录会话
   * 管理后台访问 /login 时调用，生成二维码对应的token
   * @returns { token: string, expiresAt: Date }
   */
  createSession: publicProcedure
    .mutation(async () => {
      const token = generateToken();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5分钟过期

      const [session] = await db
        .insert(qrLoginSessions)
        .values({
          token,
          status: "pending",
          expiresAt,
        })
        .returning();

      return {
        token: session!.token,
        expiresAt: session!.expiresAt,
      };
    }),

  /**
   * 轮询查询登录状态
   * 前端每隔2秒调用，检查二维码是否被扫描并确认
   * @param token - 二维码token
   * @returns { status: string, user?: object }
   */
  checkStatus: publicProcedure
    .input(
      z.object({
        token: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      const session = await db.query.qrLoginSessions.findFirst({
        where: eq(qrLoginSessions.token, input.token),
      });

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "会话不存在",
        });
      }

      // 检查是否过期
      if (new Date() > new Date(session.expiresAt)) {
        // 更新为过期状态
        await db
          .update(qrLoginSessions)
          .set({ status: "expired" })
          .where(eq(qrLoginSessions.id, session.id));

        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "二维码已过期",
        });
      }

      // 如果已确认，返回用户信息
      if (session.status === "confirmed" && session.userId) {
        const user = await db.query.users.findFirst({
          where: eq(users.id, session.userId),
        });

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "用户不存在",
          });
        }

        // 确认后清理会话
        await db
          .delete(qrLoginSessions)
          .where(eq(qrLoginSessions.id, session.id));

        return {
          status: "confirmed",
          user: {
            id: user.id,
            wxName: user.wxName,
            phone: user.phone,
            avatarUrl: user.avatarUrl,
            role: user.role,
          },
        };
      }

      return {
        status: session.status,
      };
    }),

  /**
   * 小程序扫码确认登录
   * 小程序扫描二维码后调用，标记会话为已扫描
   * @param token - 二维码token
   * @param userId - 扫描者用户ID
   */
  scan: publicProcedure
    .input(
      z.object({
        token: z.string().min(1),
        userId: z.string().uuid(),
      })
    )
    .mutation(async ({ input }) => {
      const session = await db.query.qrLoginSessions.findFirst({
        where: eq(qrLoginSessions.token, input.token),
      });

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "二维码无效",
        });
      }

      if (new Date() > new Date(session.expiresAt)) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "二维码已过期",
        });
      }

      if (session.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "二维码已被使用",
        });
      }

      // 验证用户是否存在且为管理员
      const user = await db.query.users.findFirst({
        where: eq(users.id, input.userId),
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "用户不存在",
        });
      }

      if (user.role !== 2) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "只有管理员可以登录管理后台",
        });
      }

      // 更新为已扫描状态，记录用户ID
      await db
        .update(qrLoginSessions)
        .set({
          status: "scanned",
          userId: input.userId,
        })
        .where(eq(qrLoginSessions.id, session.id));

      return { success: true };
    }),

  /**
   * 小程序确认登录（最终确认）
   * 用户在小程序中点击"确认登录"后调用
   * @param token - 二维码token
   */
  confirm: publicProcedure
    .input(
      z.object({
        token: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const session = await db.query.qrLoginSessions.findFirst({
        where: eq(qrLoginSessions.token, input.token),
      });

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "会话不存在",
        });
      }

      if (session.status !== "scanned") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "请先扫描二维码",
        });
      }

      await db
        .update(qrLoginSessions)
        .set({
          status: "confirmed",
          confirmedAt: new Date(),
        })
        .where(eq(qrLoginSessions.id, session.id));

      return { success: true };
    }),

  /**
   * 清理过期会话
   * 可定时调用清理过期数据
   */
  cleanupExpired: publicProcedure
    .mutation(async () => {
      const now = new Date();
      await db
        .delete(qrLoginSessions)
        .where(
          and(
            lt(qrLoginSessions.expiresAt, now),
            eq(qrLoginSessions.status, "pending")
          )
        );

      return { success: true };
    }),
});
