import { z } from "zod";
import { eq, and, desc, count, lt } from "drizzle-orm";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { trash, messages, pics, voices } from "~/server/db/schema";
import { db } from "~/server/db";

/**
 * 回收站模块 Router
 * 处理被删除资源的恢复和清理
 */
export const trashRouter = createTRPCRouter({
  /**
   * 将资源移入回收站
   */
  moveToTrash: publicProcedure
    .input(
      z.object({
        sourceId: z.string().uuid(),
        sourceType: z.enum(["message", "pic", "voice"]),
        userId: z.string().uuid(),
        expiredAt: z.string().or(z.date()),
      })
    )
    .mutation(async ({ input }) => {
      // 根据类型标记原资源为已删除
      if (input.sourceType === "message") {
        await db
          .update(messages)
          .set({ isDeleted: true, isInTrash: true, deletedAt: new Date() })
          .where(eq(messages.id, input.sourceId));
      } else if (input.sourceType === "pic") {
        await db
          .update(pics)
          .set({ isDeleted: true })
          .where(eq(pics.id, input.sourceId));
      } else if (input.sourceType === "voice") {
        await db
          .update(voices)
          .set({ isDeleted: true })
          .where(eq(voices.id, input.sourceId));
      }

      // 创建回收站记录
      const [trashItem] = await db
        .insert(trash)
        .values({
          sourceId: input.sourceId,
          sourceType: input.sourceType,
          userId: input.userId,
          expiredAt: new Date(input.expiredAt),
        })
        .returning();

      return trashItem;
    }),

  /**
   * 获取用户回收站列表
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
          .from(trash)
          .where(eq(trash.userId, userId))
          .limit(pageSize)
          .offset(offset)
          .orderBy(desc(trash.createdAt)),
        db.select({ count: count() }).from(trash).where(eq(trash.userId, userId)),
      ]);

      return {
        items,
        total: totalResult[0]?.count ?? 0,
        page,
        pageSize,
      };
    }),

  /**
   * 从回收站恢复资源
   */
  restore: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const trashItem = await db.query.trash.findFirst({
        where: eq(trash.id, input.id),
      });

      if (!trashItem) {
        return { success: false, message: "回收站记录不存在" };
      }

      // 恢复原始资源
      if (trashItem.sourceType === "message") {
        await db
          .update(messages)
          .set({ isDeleted: false, isInTrash: false, deletedAt: null })
          .where(eq(messages.id, trashItem.sourceId));
      } else if (trashItem.sourceType === "pic") {
        await db
          .update(pics)
          .set({ isDeleted: false })
          .where(eq(pics.id, trashItem.sourceId));
      } else if (trashItem.sourceType === "voice") {
        await db
          .update(voices)
          .set({ isDeleted: false })
          .where(eq(voices.id, trashItem.sourceId));
      }

      // 删除回收站记录
      await db.delete(trash).where(eq(trash.id, input.id));

      return { success: true };
    }),

  /**
   * 永久删除回收站中的资源
   */
  permanentDelete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const trashItem = await db.query.trash.findFirst({
        where: eq(trash.id, input.id),
      });

      if (!trashItem) {
        return { success: false, message: "回收站记录不存在" };
      }

      // 永久删除原始资源
      if (trashItem.sourceType === "message") {
        await db.delete(messages).where(eq(messages.id, trashItem.sourceId));
      } else if (trashItem.sourceType === "pic") {
        await db.delete(pics).where(eq(pics.id, trashItem.sourceId));
      } else if (trashItem.sourceType === "voice") {
        await db.delete(voices).where(eq(voices.id, trashItem.sourceId));
      }

      // 删除回收站记录
      await db.delete(trash).where(eq(trash.id, input.id));

      return { success: true };
    }),

  /**
   * 清空回收站（永久删除所有过期项目）
   */
  cleanExpired: publicProcedure
    .input(z.object({ userId: z.string().uuid() }).optional())
    .mutation(async ({ input }) => {
      const now = new Date();
      let whereClause = lt(trash.expiredAt, now);
      if (input?.userId) {
        whereClause = and(whereClause, eq(trash.userId, input.userId))!;
      }

      const expiredItems = await db.select().from(trash).where(whereClause);

      // 永久删除所有过期资源
      for (const item of expiredItems) {
        if (item.sourceType === "message") {
          await db.delete(messages).where(eq(messages.id, item.sourceId));
        } else if (item.sourceType === "pic") {
          await db.delete(pics).where(eq(pics.id, item.sourceId));
        } else if (item.sourceType === "voice") {
          await db.delete(voices).where(eq(voices.id, item.sourceId));
        }
      }

      // 删除回收站记录
      await db.delete(trash).where(whereClause);

      return { deletedCount: expiredItems.length };
    }),
});
