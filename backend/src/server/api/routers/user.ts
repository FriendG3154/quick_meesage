import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc, sql, count, gte, lt } from "drizzle-orm";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { users, messages, pics, voices, trash, auths, userAuths } from "~/server/db/schema";
import { db } from "~/server/db";

/**
 * 用户模块 Router
 * 处理用户注册、登录、信息查询等
 */
export const userRouter = createTRPCRouter({
  /**
   * 微信小程序登录/注册
   * 根据 wx_openid 查找或创建用户
   */
  loginByWx: publicProcedure
    .input(
      z.object({
        wxOpenid: z.string().min(1),
        wxName: z.string().optional(),
        avatarUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // 查找用户
      let user = await db.query.users.findFirst({
        where: eq(users.wxOpenid, input.wxOpenid),
      });

      if (!user) {
        // 创建新用户
        const [newUser] = await db
          .insert(users)
          .values({
            wxOpenid: input.wxOpenid,
            wxName: input.wxName ?? null,
            avatarUrl: input.avatarUrl ?? null,
            role: 0,
          })
          .returning();
        user = newUser;
      }

      return { user };
    }),

  /**
   * 手机号登录/注册
   */
  loginByPhone: publicProcedure
    .input(
      z.object({
        phone: z.string().regex(/^1[3-9]\d{9}$/, "手机号格式不正确"),
        code: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      let user = await db.query.users.findFirst({
        where: eq(users.phone, input.phone),
      });

      if (!user) {
        const [newUser] = await db
          .insert(users)
          .values({
            phone: input.phone,
            wxName: `手机用户_${input.phone.slice(-4)}`,
            role: 0,
          })
          .returning();
        user = newUser;
      }

      return { user };
    }),

  /**
   * 获取用户信息
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, input.id),
      });
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "用户不存在" });
      }
      return user;
    }),

  /**
   * 更新用户信息
   */
  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        wxName: z.string().optional(),
        avatarUrl: z.string().optional(),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const [user] = await db
        .update(users)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      return user;
    }),

  /**
   * 获取用户列表（管理端）
   */
  list: publicProcedure
    .input(
      z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20),
        role: z.number().optional(),
        search: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const { page = 1, pageSize = 20, role, search } = input ?? {};
      const offset = (page - 1) * pageSize;

      let whereClause = undefined;
      if (role !== undefined) {
        whereClause = eq(users.role, role);
      }
      if (search) {
        whereClause = and(
          whereClause,
          sql`${users.wxName} ILIKE ${`%${search}%`} OR ${users.phone} ILIKE ${`%${search}%`}`
        );
      }

      const [items, totalResult] = await Promise.all([
        db
          .select()
          .from(users)
          .where(whereClause)
          .limit(pageSize)
          .offset(offset)
          .orderBy(desc(users.createdAt)),
        db.select({ count: count() }).from(users).where(whereClause),
      ]);

      return {
        items,
        total: totalResult[0]?.count ?? 0,
        page,
        pageSize,
      };
    }),

  /**
   * 获取用户统计数据
   */
  getStats: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ input }) => {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const [
        totalNotes,
        voiceCount,
        drawingCount,
        textCount,
        thisWeekNotes,
        lastWeekNotes,
      ] = await Promise.all([
        db.select({ count: count() }).from(messages).where(eq(messages.userId, input.userId)),
        db.select({ count: count() }).from(messages).where(and(eq(messages.userId, input.userId), eq(messages.type, "voice"))),
        db.select({ count: count() }).from(messages).where(and(eq(messages.userId, input.userId), eq(messages.type, "drawing"))),
        db.select({ count: count() }).from(messages).where(and(eq(messages.userId, input.userId), eq(messages.type, "text"))),
        db.select({ count: count() }).from(messages).where(and(eq(messages.userId, input.userId), gte(messages.createdAt, oneWeekAgo))),
        db.select({ count: count() }).from(messages).where(and(eq(messages.userId, input.userId), gte(messages.createdAt, twoWeeksAgo), lt(messages.createdAt, oneWeekAgo))),
      ]);

      const thisWeekTotal = thisWeekNotes[0]?.count ?? 0;
      const lastWeekTotal = lastWeekNotes[0]?.count ?? 0;
      const weekGrowthRate = lastWeekTotal === 0 ? 0 : Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100 * 10) / 10;

      return {
        totalNotes: totalNotes[0]?.count ?? 0,
        voiceCount: voiceCount[0]?.count ?? 0,
        drawingCount: drawingCount[0]?.count ?? 0,
        textCount: textCount[0]?.count ?? 0,
        thisWeekTotal,
        lastWeekTotal,
        weekGrowthRate,
      };
    }),
});
