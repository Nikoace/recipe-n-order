import { db } from "./index"
import { admins } from "./schema"
import { hashPassword } from "@/lib/auth"

const username = process.env.ADMIN_USERNAME ?? "admin"
const password = process.env.ADMIN_PASSWORD ?? "changeme"

if (!process.env.ADMIN_PASSWORD) {
  console.warn("⚠️  ADMIN_PASSWORD 未设置，使用默认密码 'changeme'，请尽快修改！")
}

const hash = await hashPassword(password)
await db.insert(admins).values({ username, passwordHash: hash }).onConflictDoNothing()
console.log(`✅ Admin created: ${username}`)
process.exit(0)
