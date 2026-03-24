import { db } from "./index"
import { tags, recipes, admins } from "./schema"
import { hashPassword } from "@/lib/auth"

async function seed() {
  await db.insert(admins).values({
    username: "admin",
    passwordHash: await hashPassword("admin123"),
  }).onConflictDoNothing()

  await db.insert(tags).values([
    { name: "川菜", color: "#ef4444" },
    { name: "汤类", color: "#3b82f6" },
    { name: "素菜", color: "#22c55e" },
    { name: "主食", color: "#f97316" },
  ]).onConflictDoNothing()

  await db.insert(recipes).values({
    title: "红烧肉",
    description: "经典红烧肉，肥而不腻",
    servings: 4,
    difficulty: "medium",
    cookTime: 60,
    ingredients: [
      { name: "五花肉", amount: "500", unit: "g" },
      { name: "生抽", amount: "3", unit: "勺" },
      { name: "冰糖", amount: "30", unit: "g" },
    ],
    steps: [
      { order: 1, content: "五花肉切块，冷水下锅焯水 5 分钟，捞出洗净" },
      { order: 2, content: "锅中加少许油，放入冰糖小火炒糖色至棕红色" },
      { order: 3, content: "放入五花肉翻炒上色，加生抽、老抽、料酒" },
      { order: 4, content: "加水没过肉，大火烧开转小火炖 45 分钟" },
      { order: 5, content: "大火收汁至浓稠即可" },
    ],
  }).onConflictDoNothing()

  console.log("✅ Seed 完成")
  process.exit(0)
}

seed().catch(console.error)
