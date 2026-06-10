import { z } from "zod";
import { eq, and, desc, count, sql } from "drizzle-orm";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { messages } from "~/server/db/schema";
import { db } from "~/server/db";

/**
 * 笔记/消息模块 Router
 * 处理文本笔记、语音记录、手绘作品等CRUD操作
 */
export const messageRouter = createTRPCRouter({
  /**
   * 创建笔记
   */
  create: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        type: z.enum(["text", "voice", "drawing"]),
        title: z.string().optional(),
        content: z.string().optional(),
        template: z.string().optional(),
        charCount: z.number().default(0),
        duration: z.number().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const [message] = await db
        .insert(messages)
        .values({
          userId: input.userId,
          type: input.type,
          title: input.title ?? null,
          content: input.content ?? null,
          template: input.template ?? null,
          charCount: input.charCount,
          duration: input.duration,
        })
        .returning();

      return message;
    }),

  /**
   * 获取用户笔记列表
   */
  list: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        type: z.enum(["text", "voice", "drawing"]).optional(),
        page: z.number().default(1),
        pageSize: z.number().default(20),
        includeDeleted: z.boolean().default(false),
      })
    )
    .query(async ({ input }) => {
      const { userId, type, page, pageSize, includeDeleted } = input;
      const offset = (page - 1) * pageSize;

      let whereClause = eq(messages.userId, userId);
      if (type) {
        whereClause = and(whereClause, eq(messages.type, type))!;
      }
      if (!includeDeleted) {
        whereClause = and(whereClause, eq(messages.isDeleted, false))!;
      }

      const [items, totalResult] = await Promise.all([
        db
          .select()
          .from(messages)
          .where(whereClause)
          .limit(pageSize)
          .offset(offset)
          .orderBy(desc(messages.createdAt)),
        db.select({ count: count() }).from(messages).where(whereClause),
      ]);

      return {
        items,
        total: totalResult[0]?.count ?? 0,
        page,
        pageSize,
      };
    }),

  /**
   * 获取单条笔记详情
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const message = await db.query.messages.findFirst({
        where: eq(messages.id, input.id),
      });
      return message ?? null;
    }),

  /**
   * 更新笔记
   */
  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().optional(),
        content: z.string().optional(),
        template: z.string().optional(),
        charCount: z.number().optional(),
        duration: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const [message] = await db
        .update(messages)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(messages.id, id))
        .returning();
      return message;
    }),

  /**
   * 软删除笔记（移入回收站）
   */
  softDelete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const [message] = await db
        .update(messages)
        .set({
          isDeleted: true,
          isInTrash: true,
          deletedAt: new Date(),
        })
        .where(eq(messages.id, input.id))
        .returning();
      return message;
    }),

  /**
   * 恢复笔记（从回收站恢复）
   */
  restore: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const [message] = await db
        .update(messages)
        .set({
          isDeleted: false,
          isInTrash: false,
          deletedAt: null,
        })
        .where(eq(messages.id, input.id))
        .returning();
      return message;
    }),

  /**
   * 永久删除笔记
   */
  hardDelete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      await db.delete(messages).where(eq(messages.id, input.id));
      return { success: true };
    }),

  /**
   * 获取用户笔记统计（管理端）
   */
  getUserStats: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ input }) => {
      const [total, textCount, voiceCount, drawingCount] = await Promise.all([
        db.select({ count: count() }).from(messages).where(eq(messages.userId, input.userId)),
        db.select({ count: count() }).from(messages).where(and(eq(messages.userId, input.userId), eq(messages.type, "text"))),
        db.select({ count: count() }).from(messages).where(and(eq(messages.userId, input.userId), eq(messages.type, "voice"))),
        db.select({ count: count() }).from(messages).where(and(eq(messages.userId, input.userId), eq(messages.type, "drawing"))),
      ]);

      return {
        total: total[0]?.count ?? 0,
        text: textCount[0]?.count ?? 0,
        voice: voiceCount[0]?.count ?? 0,
        drawing: drawingCount[0]?.count ?? 0,
      };
    }),

  /**
   * 全局统计（管理端）
   */
  getGlobalStats: publicProcedure.query(async () => {
    const [total, todayResult, weekResult] = await Promise.all([
      db.select({ count: count() }).from(messages),
      db.select({ count: count() }).from(messages).where(sql`${messages.createdAt} >= CURRENT_DATE`),
      db.select({ count: count() }).from(messages).where(sql`${messages.createdAt} >= CURRENT_DATE - INTERVAL '7 days'`),
    ]);

    return {
      total: total[0]?.count ?? 0,
      today: todayResult[0]?.count ?? 0,
      thisWeek: weekResult[0]?.count ?? 0,
    };
  }),
});
