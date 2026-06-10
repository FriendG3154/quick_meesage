import { z } from "zod";
import { eq, and, desc, count } from "drizzle-orm";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { auths, userAuths } from "~/server/db/schema";
import { db } from "~/server/db";

/**
 * 会员权限模块 Router
 * 处理会员等级、权限配置和用户会员关系
 */
export const authRouter = createTRPCRouter({
  /**
   * 创建会员等级
   */
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        voiceMessage: z.boolean().default(false),
        trashDays: z.number().default(7),
        maxStorage: z.number().default(100),
        isDefault: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      // 如果设置为默认，先取消其他默认
      if (input.isDefault) {
        await db.update(auths).set({ isDefault: false }).where(eq(auths.isDefault, true));
      }

      const [auth] = await db
        .insert(auths)
        .values({
          name: input.name,
          voiceMessage: input.voiceMessage,
          trashDays: input.trashDays,
          maxStorage: input.maxStorage,
          isDefault: input.isDefault,
        })
        .returning();

      return auth;
    }),

  /**
   * 获取所有会员等级
   */
  list: publicProcedure.query(async () => {
    return db.select().from(auths).orderBy(desc(auths.createdAt));
  }),

  /**
   * 获取单条会员等级详情
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const auth = await db.query.auths.findFirst({
        where: eq(auths.id, input.id),
      });
      return auth ?? null;
    }),

  /**
   * 更新会员等级
   */
  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().optional(),
        voiceMessage: z.boolean().optional(),
        trashDays: z.number().optional(),
        maxStorage: z.number().optional(),
        isDefault: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;

      // 如果设置为默认，先取消其他默认
      if (data.isDefault) {
        await db.update(auths).set({ isDefault: false }).where(eq(auths.isDefault, true));
      }

      const [auth] = await db
        .update(auths)
        .set(data)
        .where(eq(auths.id, id))
        .returning();

      return auth;
    }),

  /**
   * 删除会员等级
   */
  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      await db.delete(auths).where(eq(auths.id, input.id));
      return { success: true };
    }),

  /**
   * 为用户分配会员权限
   */
  assignToUser: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        authId: z.string().uuid(),
        expiresAt: z.string().or(z.date()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const [userAuth] = await db
        .insert(userAuths)
        .values({
          userId: input.userId,
          authId: input.authId,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        })
        .returning();

      return userAuth;
    }),

  /**
   * 获取用户的会员权限
   */
  getUserAuth: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ input }) => {
      const userAuth = await db.query.userAuths.findFirst({
        where: and(
          eq(userAuths.userId, input.userId),
          eq(userAuths.isActive, true)
        ),
        with: {
          auth: true,
        },
      });

      return userAuth ?? null;
    }),

  /**
   * 取消用户会员权限
   */
  revokeFromUser: publicProcedure
    .input(z.object({ userAuthId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const [userAuth] = await db
        .update(userAuths)
        .set({ isActive: false })
        .where(eq(userAuths.id, input.userAuthId))
        .returning();

      return userAuth;
    }),
});
