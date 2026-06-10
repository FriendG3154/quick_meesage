import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { readFileSync } from "fs";

import * as schema from "./schema";

// 从 .env 文件读取 DATABASE_URL
function loadEnv() {
  try {
    const envContent = readFileSync(".env", "utf-8");
    const match = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/);
    if (match) {
      return match[1].trim();
    }
  } catch {
    // ignore
  }
  return process.env.DATABASE_URL;
}

const connectionString = loadEnv();

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function seed() {
  console.log("开始初始化数据库...\n");

  // 1. 创建会员权限等级
  console.log("1. 创建会员权限等级...");
  const [freeAuth] = await db
    .insert(schema.auths)
    .values({
      name: "免费用户",
      voiceMessage: false,
      trashDays: 7,
      maxStorage: 100,
      isDefault: true,
    })
    .returning();

  const [premiumAuth] = await db
    .insert(schema.auths)
    .values({
      name: "会员",
      voiceMessage: true,
      trashDays: 30,
      maxStorage: 1024,
      isDefault: false,
    })
    .returning();

  const [proAuth] = await db
    .insert(schema.auths)
    .values({
      name: "高级会员",
      voiceMessage: true,
      trashDays: 90,
      maxStorage: 5120,
      isDefault: false,
    })
    .returning();

  console.log("  ✓ 免费用户权限创建成功");
  console.log("  ✓ 会员权限创建成功");
  console.log("  ✓ 高级会员权限创建成功\n");

  // 2. 创建测试用户
  console.log("2. 创建测试用户...");
  const [user1] = await db
    .insert(schema.users)
    .values({
      wxOpenid: "wx_test_openid_001",
      phone: "13800138000",
      wxName: "测试用户一号",
      avatarUrl: null,
      role: 0,
      isActive: true,
    })
    .returning();

  const [user2] = await db
    .insert(schema.users)
    .values({
      wxOpenid: "wx_test_openid_002",
      phone: "13900139000",
      wxName: "会员用户二号",
      avatarUrl: null,
      role: 1,
      isActive: true,
    })
    .returning();

  const [user3] = await db
    .insert(schema.users)
    .values({
      wxOpenid: "wx_test_openid_003",
      phone: "13700137000",
      wxName: "管理员三号",
      avatarUrl: null,
      role: 2,
      isActive: true,
    })
    .returning();

  console.log("  ✓ 测试用户一号 (普通用户)");
  console.log("  ✓ 会员用户二号 (会员)");
  console.log("  ✓ 管理员三号 (管理员)\n");

  // 3. 为用户分配会员权限
  console.log("3. 分配会员权限...");
  await db.insert(schema.userAuths).values({
    userId: user2.id,
    authId: premiumAuth.id,
    isActive: true,
  });

  await db.insert(schema.userAuths).values({
    userId: user3.id,
    authId: proAuth.id,
    isActive: true,
  });

  console.log("  ✓ 会员用户二号 -> 会员权限");
  console.log("  ✓ 管理员三号 -> 高级会员权限\n");

  // 4. 创建测试笔记
  console.log("4. 创建测试笔记...");
  const [message1] = await db
    .insert(schema.messages)
    .values({
      userId: user1.id,
      type: "text",
      title: "第一次会议纪要",
      content: "<h2>会议纪要</h2><p><strong>日期：</strong>2024-01-15</p><p><strong>参与者：</strong>张三、李四、王五</p><h3>议题</h3><ol><li>产品功能规划讨论</li><li>技术架构选型</li></ol><h3>行动项</h3><ul><li>张三负责需求文档整理</li><li>李四负责技术方案设计</li></ul>",
      template: "会议纪要",
      charCount: 120,
      duration: 0,
    })
    .returning();

  const [message2] = await db
    .insert(schema.messages)
    .values({
      userId: user1.id,
      type: "text",
      title: "读书笔记 - 设计心理学",
      content: "<h2>读书笔记</h2><p><strong>书名：</strong>设计心理学</p><p><strong>作者：</strong>唐纳德·诺曼</p><h3>核心观点</h3><p>好的设计应该让用户不需要思考就能正确使用。</p><h3>金句摘录</h3><blockquote><p>如果你必须选择，那么选择简洁而不是复杂。</p></blockquote>",
      template: "读书笔记",
      charCount: 85,
      duration: 0,
    })
    .returning();

  const [message3] = await db
    .insert(schema.messages)
    .values({
      userId: user2.id,
      type: "voice",
      title: "语音记录 - 灵感闪现",
      content: "今天突然想到一个很好的产品点子，关于如何优化用户的笔记体验...",
      template: "",
      charCount: 45,
      duration: 120,
    })
    .returning();

  const [message4] = await db
    .insert(schema.messages)
    .values({
      userId: user2.id,
      type: "drawing",
      title: "手绘 - 产品原型草图",
      content: "/uploads/drawings/sketch_001.png",
      template: "",
      charCount: 0,
      duration: 0,
    })
    .returning();

  const [message5] = await db
    .insert(schema.messages)
    .values({
      userId: user3.id,
      type: "text",
      title: "旅行日记 - 云南之行",
      content: "<h2>旅行日记</h2><p><strong>目的地：</strong>云南大理</p><p><strong>日期：</strong>2024-02-01</p><h3>今日行程</h3><p>早上抵达大理古城，漫步在青石板路上...</p><h3>特别记忆</h3><p>在洱海边看到了最美的日落。</p>",
      template: "旅行日记",
      charCount: 95,
      duration: 0,
    })
    .returning();

  console.log("  ✓ 会议纪要 (文本笔记)");
  console.log("  ✓ 读书笔记 (文本笔记)");
  console.log("  ✓ 语音记录 (语音笔记)");
  console.log("  ✓ 手绘草图 (手绘笔记)");
  console.log("  ✓ 旅行日记 (文本笔记)\n");

  // 5. 创建语音资源
  console.log("5. 创建语音资源...");
  await db.insert(schema.voices).values({
    userId: user2.id,
    messageId: message3.id,
    url: "/uploads/voices/voice_001.mp3",
    remark: "灵感记录",
    content: "今天突然想到一个很好的产品点子...",
    duration: 120,
  });

  console.log("  ✓ 语音资源创建成功\n");

  // 6. 创建图片资源
  console.log("6. 创建图片资源...");
  await db.insert(schema.pics).values({
    userId: user2.id,
    messageId: message4.id,
    picUrl: "/uploads/drawings/sketch_001.png",
    remark: "产品原型草图",
  });

  console.log("  ✓ 图片资源创建成功\n");

  // 7. 创建回收站记录
  console.log("7. 创建回收站记录...");
  const [deletedMessage] = await db
    .insert(schema.messages)
    .values({
      userId: user1.id,
      type: "text",
      title: "已删除的笔记",
      content: "这是一条被删除的笔记内容...",
      isDeleted: true,
      isInTrash: true,
      deletedAt: new Date(),
    })
    .returning();

  await db.insert(schema.trash).values({
    sourceId: deletedMessage.id,
    sourceType: "message",
    userId: user1.id,
    originalData: JSON.stringify({ title: "已删除的笔记", type: "text" }),
    expiredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  console.log("  ✓ 回收站记录创建成功\n");

  console.log("=".repeat(50));
  console.log("数据库初始化完成!");
  console.log("=".repeat(50));
  console.log("\n初始数据:");
  console.log(`  - 会员权限: 3 个等级`);
  console.log(`  - 用户: 3 个`);
  console.log(`  - 笔记: 6 条`);
  console.log(`  - 语音: 1 条`);
  console.log(`  - 图片: 1 张`);
  console.log(`  - 回收站: 1 条\n`);

  await client.end();
}

seed().catch((err) => {
  console.error("初始化失败:", err);
  process.exit(1);
});
