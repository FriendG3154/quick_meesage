import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc, sql, count, gte, lt } from "drizzle-orm";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { users, messages, auths, userAuths } from "~/server/db/schema";
import { db } from "~/server/db";
import { env } from "~/env";

/**
 * 调用微信接口获取 openid
 * @param code - 小程序登录 code
 * @returns { openid: string, session_key: string }
 */
async function wxCode2Session(code: string): Promise<{ openid: string; session_key: string }> {
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${env.WX_APPID}&secret=${env.WX_APPSECRET}&js_code=${code}&grant_type=authorization_code`;

  const response = await fetch(url);
  const data = await response.json() as {
    openid?: string;
    session_key?: string;
    errcode?: number;
    errmsg?: string;
  };

  if (data.errcode) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `微信接口错误: ${data.errmsg ?? data.errcode}`,
    });
  }

  if (!data.openid) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "无法获取微信用户信息",
    });
  }

  return {
    openid: data.openid,
    session_key: data.session_key ?? "",
  };
}

/**
 * 获取默认会员权限
 */
async function getDefaultAuth() {
  const defaultAuth = await db.query.auths.findFirst({
    where: eq(auths.isDefault, true),
  });

  if (!defaultAuth) {
    // 如果没有默认权限，创建免费用户权限
    const [newAuth] = await db
      .insert(auths)
      .values({
        name: "免费用户",
        voiceMessage: false,
        trashDays: 7,
        maxStorage: 100,
        isDefault: true,
      })
      .returning();
    return newAuth;
  }

  return defaultAuth;
}

/**
 * 用户模块 Router
 * 处理用户注册、登录、信息查询等
 */
export const userRouter = createTRPCRouter({
  /**
   * 微信小程序快捷登录
   * 使用 wx.login 获取的 code 换取 openid，自动注册新用户
   * 登录即注册，默认普通会员(role=0)
   */
  wxLogin: publicProcedure
    .input(
      z.object({
        code: z.string().min(1),
        wxName: z.string().optional(),
        avatarUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // 1. 调用微信接口换取 openid
      const { openid } = await wxCode2Session(input.code);

      // 2. 查找用户
      let user = await db.query.users.findFirst({
        where: eq(users.wxOpenid, openid),
      });

      let isNewUser = false;

      if (!user) {
        // 3. 新用户 - 自动注册
        isNewUser = true;
        const [newUser] = await db
          .insert(users)
          .values({
            wxOpenid: openid,
            wxName: input.wxName ?? null,
            avatarUrl: input.avatarUrl ?? null,
            role: 0, // 默认普通会员
            isActive: true,
          })
          .returning();
        user = newUser!;

        // 4. 分配默认会员权限
        const defaultAuth = await getDefaultAuth();
        if (defaultAuth) {
          await db.insert(userAuths).values({
            userId: user.id,
            authId: defaultAuth.id,
            isActive: true,
          });
        }
      }

      return {
        user: {
          id: user.id,
          wxOpenid: user.wxOpenid,
          wxName: user.wxName,
          avatarUrl: user.avatarUrl,
          role: user.role,
          isActive: user.isActive,
        },
        isNewUser,
      };
    }),

  /**
   * 微信小程序登录/注册（旧接口，保留兼容）
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
      let user = await db.query.users.findFirst({
        where: eq(users.wxOpenid, input.wxOpenid),
      });

      if (!user) {
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
