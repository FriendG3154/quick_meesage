import { z } from "zod";
import { eq, and, desc, count } from "drizzle-orm";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { pics } from "~/server/db/schema";
import { db } from "~/server/db";

/**
 * 图片资源模块 Router
 * 处理用户上传的图片资源管理
 */
export const picRouter = createTRPCRouter({
  /**
   * 创建图片记录
   */
  create: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        messageId: z.string().uuid().optional(),
        picUrl: z.string().min(1),
        pid: z.string().uuid().optional(),
        remark: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const [pic] = await db
        .insert(pics)
        .values({
          userId: input.userId,
          messageId: input.messageId ?? null,
          picUrl: input.picUrl,
          pid: input.pid ?? null,
          remark: input.remark ?? null,
        })
        .returning();
      return pic;
    }),

  /**
   * 获取用户图片列表
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
          .from(pics)
          .where(and(eq(pics.userId, userId), eq(pics.isDeleted, false)))
          .limit(pageSize)
          .offset(offset)
          .orderBy(desc(pics.createdAt)),
        db
          .select({ count: count() })
          .from(pics)
          .where(and(eq(pics.userId, userId), eq(pics.isDeleted, false))),
      ]);

      return {
        items,
        total: totalResult[0]?.count ?? 0,
        page,
        pageSize,
      };
    }),

  /**
   * 获取单条图片详情
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const pic = await db.query.pics.findFirst({
        where: eq(pics.id, input.id),
      });
      return pic ?? null;
    }),

  /**
   * 更新图片信息
   */
  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        remark: z.string().optional(),
        picUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const [pic] = await db
        .update(pics)
        .set(data)
        .where(eq(pics.id, id))
        .returning();
      return pic;
    }),

  /**
   * 软删除图片
   */
  softDelete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const [pic] = await db
        .update(pics)
        .set({ isDeleted: true })
        .where(eq(pics.id, input.id))
        .returning();
      return pic;
    }),

  /**
   * 永久删除图片
   */
  hardDelete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      await db.delete(pics).where(eq(pics.id, input.id));
      return { success: true };
    }),
});
