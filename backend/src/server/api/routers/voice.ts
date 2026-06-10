import { z } from "zod";
import { eq, and, desc, count } from "drizzle-orm";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { voices } from "~/server/db/schema";
import { db } from "~/server/db";

/**
 * 语音资源模块 Router
 * 处理用户录制的语音资源管理，包括语音转文字
 */
export const voiceRouter = createTRPCRouter({
  /**
   * 创建语音记录
   */
  create: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        messageId: z.string().uuid().optional(),
        url: z.string().min(1),
        remark: z.string().optional(),
        content: z.string().optional(),
        duration: z.number().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const [voice] = await db
        .insert(voices)
        .values({
          userId: input.userId,
          messageId: input.messageId ?? null,
          url: input.url,
          remark: input.remark ?? null,
          content: input.content ?? null,
          duration: input.duration,
        })
        .returning();
      return voice;
    }),

  /**
   * 获取用户语音列表
   */
  list: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        page: z.number().default(1),
        pageSize: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      const { userId, page, pageSize } = input;
      const offset = (page - 1) * pageSize;

      const [items, totalResult] = await Promise.all([
        db
          .select()
          .from(voices)
          .where(and(eq(voices.userId, userId), eq(voices.isDeleted, false)))
          .limit(pageSize)
          .offset(offset)
          .orderBy(desc(voices.createdAt)),
        db
          .select({ count: count() })
          .from(voices)
          .where(and(eq(voices.userId, userId), eq(voices.isDeleted, false))),
      ]);

      return {
        items,
        total: totalResult[0]?.count ?? 0,
        page,
        pageSize,
      };
    }),

  /**
   * 获取单条语音详情
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const voice = await db.query.voices.findFirst({
        where: eq(voices.id, input.id),
      });
      return voice ?? null;
    }),

  /**
   * 更新语音转文字结果
   */
  updateTranscription: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        content: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const [voice] = await db
        .update(voices)
        .set({ content: input.content })
        .where(eq(voices.id, input.id))
        .returning();
      return voice;
    }),

  /**
   * 更新语音信息
   */
  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        remark: z.string().optional(),
        content: z.string().optional(),
        duration: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const [voice] = await db
        .update(voices)
        .set(data)
        .where(eq(voices.id, id))
        .returning();
      return voice;
    }),

  /**
   * 软删除语音
   */
  softDelete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const [voice] = await db
        .update(voices)
        .set({ isDeleted: true })
        .where(eq(voices.id, input.id))
        .returning();
      return voice;
    }),

  /**
   * 永久删除语音
   */
  hardDelete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      await db.delete(voices).where(eq(voices.id, input.id));
      return { success: true };
    }),
});
