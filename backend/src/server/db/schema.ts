import { relations, sql } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTableCreator,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * 多项目Schema前缀，避免表名冲突
 */
export const createTable = pgTableCreator((name) => `qm_${name}`);

/**
 * 用户表
 * 存储小程序用户和管理后台用户信息
 */
export const users = createTable("user", (d) => ({
  id: d
    .uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  wxOpenid: d.varchar("wx_openid", { length: 255 }).unique(),
  phone: d.varchar("phone", { length: 20 }),
  wxName: d.varchar("wx_name", { length: 255 }),
  avatarUrl: d.text("avatar_url"),
  role: d.integer("role").default(0).notNull(), // 0:普通用户, 1:会员, 2:管理员
  isActive: d.boolean("is_active").default(true).notNull(),
  createdAt: d
    .timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: d
    .timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}));

/**
 * 笔记/消息表
 * 存储用户创建的文本、语音、手绘等笔记内容
 */
export const messages = createTable("message", (d) => ({
  id: d
    .uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: d
    .uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  type: d.varchar("type", { length: 20 }).notNull(), // text, voice, drawing
  title: d.varchar("title", { length: 500 }),
  content: d.text("content"), // HTML内容或文件路径
  template: d.varchar("template", { length: 100 }), // 模板名称
  charCount: d.integer("char_count").default(0),
  duration: d.integer("duration").default(0), // 语音时长(秒)
  isDeleted: d.boolean("is_deleted").default(false).notNull(),
  isInTrash: d.boolean("is_in_trash").default(false).notNull(),
  deletedAt: d.timestamp("deleted_at", { withTimezone: true }),
  createdAt: d
    .timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: d
    .timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}));

/**
 * 图片表
 * 存储用户上传的图片资源
 */
export const pics = createTable("pic", (d) => ({
  id: d
    .uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: d
    .uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  messageId: d.uuid("message_id").references(() => messages.id, {
    onDelete: "cascade",
  }),
  picUrl: d.text("pic_url").notNull(),
  pid: d.uuid("pid"), // 父节点ID，用于版本控制
  remark: d.text("remark"),
  isDeleted: d.boolean("is_deleted").default(false).notNull(),
  createdAt: d
    .timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}));

/**
 * 语音表
 * 存储用户录制的语音资源
 */
export const voices = createTable("voice", (d) => ({
  id: d
    .uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: d
    .uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  messageId: d.uuid("message_id").references(() => messages.id, {
    onDelete: "cascade",
  }),
  url: d.text("url").notNull(),
  remark: d.varchar("remark", { length: 500 }),
  content: d.text("content"), // 语音转文字结果
  duration: d.integer("duration").default(0),
  isDeleted: d.boolean("is_deleted").default(false).notNull(),
  createdAt: d
    .timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}));

/**
 * 回收站表
 * 记录被删除的资源，支持恢复
 */
export const trash = createTable("trash", (d) => ({
  id: d
    .uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  sourceId: d.uuid("source_id").notNull(),
  sourceType: d.varchar("source_type", { length: 20 }).notNull(), // message, pic, voice
  userId: d
    .uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  originalData: d.text("original_data"), // JSON格式的原始数据
  expiredAt: d.timestamp("expired_at", { withTimezone: true }).notNull(),
  createdAt: d
    .timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}));

/**
 * 会员权限表
 * 定义不同会员等级的权限配置
 */
export const auths = createTable("auth", (d) => ({
  id: d
    .uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: d.varchar("name", { length: 100 }).notNull(),
  voiceMessage: d.boolean("voice_message").default(false).notNull(),
  trashDays: d.integer("trash_days").default(7).notNull(),
  maxStorage: d.integer("max_storage").default(100), // MB
  isDefault: d.boolean("is_default").default(false).notNull(),
  createdAt: d
    .timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}));

/**
 * 用户会员关系表
 * 记录用户与会员等级的关联
 */
export const userAuths = createTable("user_auth", (d) => ({
  id: d
    .uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: d
    .uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  authId: d
    .uuid("auth_id")
    .references(() => auths.id, { onDelete: "cascade" })
    .notNull(),
  expiresAt: d.timestamp("expires_at", { withTimezone: true }),
  isActive: d.boolean("is_active").default(true).notNull(),
  createdAt: d
    .timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}));

/**
 * 关系定义
 */
export const usersRelations = relations(users, ({ many, one }) => ({
  messages: many(messages),
  pics: many(pics),
  voices: many(voices),
  trash: many(trash),
  userAuths: many(userAuths),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
  pics: many(pics),
  voices: many(voices),
}));

export const picsRelations = relations(pics, ({ one }) => ({
  user: one(users, {
    fields: [pics.userId],
    references: [users.id],
  }),
  message: one(messages, {
    fields: [pics.messageId],
    references: [messages.id],
  }),
}));

export const voicesRelations = relations(voices, ({ one }) => ({
  user: one(users, {
    fields: [voices.userId],
    references: [users.id],
  }),
  message: one(messages, {
    fields: [voices.messageId],
    references: [messages.id],
  }),
}));

export const trashRelations = relations(trash, ({ one }) => ({
  user: one(users, {
    fields: [trash.userId],
    references: [users.id],
  }),
}));

export const authsRelations = relations(auths, ({ many }) => ({
  userAuths: many(userAuths),
}));

export const userAuthsRelations = relations(userAuths, ({ one }) => ({
  user: one(users, {
    fields: [userAuths.userId],
    references: [users.id],
  }),
  auth: one(auths, {
    fields: [userAuths.authId],
    references: [auths.id],
  }),
}));
