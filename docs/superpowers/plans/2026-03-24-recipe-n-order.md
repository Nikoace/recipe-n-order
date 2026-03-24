# Recipe & Order 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个菜谱记录与聚餐点菜的 Web + PWA 应用，管理员管理菜谱，朋友通过分享链接以访客身份点菜，实时汇总并生成备菜清单。

**Architecture:** Next.js 15 App Router 全栈，Turso (libSQL) 作为数据库，Cloudflare R2 存储图片。实时汇总采用客户端轮询（每 3 秒）而非 SSE——Vercel serverless 函数每次请求是独立实例，无共享内存，SSE 的 pub/sub 模式在 Vercel 上无法正确工作。三种角色：管理员（JWT cookie）、访客（昵称+guestId cookie）、公开（无需认证）。

**Tech Stack:** Bun, Next.js 15, React 19, Tailwind CSS 4, shadcn/ui, Drizzle ORM, Turso/libSQL, Cloudflare R2, Client Polling, @ducanh2912/next-pwa

---

## UI/UX 设计原则

**访客端（点菜）优先移动端体验：**
- 大触控目标（按钮最小 44px）
- 菜单卡片展示菜品图片，视觉直观
- 点菜 +/- 按钮在卡片上直接操作，不跳页
- 已点菜品在底部浮层汇总，一键提交
- 颜色主题：橙色（食欲感）+ 白色底色

**管理员端注重效率：**
- 列表视图快速扫描
- 表单字段分组清晰
- 图片上传即时预览
- 步骤编辑器支持拖拽排序（可延后实现）

**通用原则：**
- 加载状态有明确的 loading 反馈
- 错误信息用中文提示，清晰具体
- 空状态有引导性提示（"还没有菜谱，去创建一个吧"）
- 所有操作有成功/失败反馈（toast 通知）

---

## 文件结构总览

```
recipe-n-order/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   └── page.tsx                    # 首页菜谱展示
│   │   ├── (guest)/
│   │   │   └── e/[shareCode]/
│   │   │       ├── page.tsx                # 访客入口（输入昵称）
│   │   │       ├── menu/page.tsx           # 菜单浏览
│   │   │       ├── recipe/[id]/page.tsx    # 菜谱详情
│   │   │       └── order/page.tsx          # 点菜确认
│   │   ├── admin/
│   │   │   ├── layout.tsx                  # 管理员布局
│   │   │   ├── recipes/
│   │   │   │   ├── page.tsx               # 菜谱列表
│   │   │   │   ├── new/page.tsx           # 新建菜谱
│   │   │   │   └── [id]/edit/page.tsx     # 编辑菜谱
│   │   │   └── events/
│   │   │       ├── page.tsx               # 活动列表
│   │   │       ├── new/page.tsx           # 新建活动
│   │   │       └── [id]/page.tsx          # 活动详情+实时汇总
│   │   ├── login/page.tsx                  # 管理员登录
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts         # POST 登录
│   │   │   │   └── logout/route.ts        # POST 登出
│   │   │   ├── upload/route.ts            # POST 图片上传到 R2
│   │   │   ├── tags/
│   │   │   │   ├── route.ts              # GET 列表, POST 创建
│   │   │   │   └── [id]/route.ts         # PATCH, DELETE
│   │   │   ├── recipes/
│   │   │   │   ├── route.ts              # GET 列表, POST 创建
│   │   │   │   └── [id]/route.ts         # GET, PATCH, DELETE
│   │   │   ├── events/
│   │   │   │   ├── route.ts              # GET 列表, POST 创建
│   │   │   │   ├── [id]/route.ts         # GET, PATCH (状态)
│   │   │   │   ├── [id]/summary/route.ts  # GET 点菜汇总+备菜清单
│   │   │   │   └── by-share/[shareCode]/recipes/route.ts  # GET 访客端菜单
│   │   │   ├── guest/
│   │   │   │   └── join/route.ts         # POST 访客加入活动
│   │   │   └── orders/
│   │   │       └── route.ts              # POST 提交/更新点菜
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                           # shadcn/ui 组件
│   │   ├── recipe/
│   │   │   ├── RecipeForm.tsx            # 新建/编辑表单
│   │   │   ├── StepEditor.tsx            # 图文步骤编辑器
│   │   │   └── IngredientsEditor.tsx     # 食材编辑器
│   │   ├── event/
│   │   │   ├── SummaryPanel.tsx          # 轮询汇总面板（客户端）
│   │   │   ├── EventStatusButton.tsx     # 状态切换按钮（客户端组件）
│   │   │   └── ShoppingList.tsx          # 备菜清单
│   │   └── order/
│   │       └── MenuGrid.tsx              # 访客菜单网格
│   ├── db/
│   │   ├── schema.ts                     # Drizzle 完整 schema
│   │   ├── index.ts                      # DB 连接（Turso/SQLite）
│   │   └── queries/
│   │       ├── recipes.ts
│   │       ├── events.ts
│   │       └── orders.ts
│   ├── lib/
│   │   ├── auth.ts                       # JWT 签发/验证
│   │   ├── storage.ts                    # R2 上传
│   │   ├── share-code.ts                 # 分享码生成
│   │   └── utils.ts
│   └── middleware.ts                     # 路由保护
├── tests/
│   ├── unit/
│   │   ├── auth.test.ts
│   │   ├── share-code.test.ts
│   │   └── summary.test.ts              # 备菜汇总计算
│   └── e2e/
│       └── order-flow.test.ts           # Playwright E2E
├── public/
│   ├── manifest.json
│   └── icons/
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
├── playwright.config.ts
├── package.json
├── bun.lock
└── tsconfig.json
```

---

## Task 1: 项目脚手架

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `drizzle.config.ts`
- Create: `src/app/layout.tsx`, `src/app/globals.css`
- Create: `public/manifest.json`

- [ ] **Step 1: 初始化 Next.js 项目**

在 `/home/niko/hobby/recipe-n-order` 目录中运行：

```bash
cd /home/niko/hobby/recipe-n-order
bunx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --no-eslint
```

选项：TypeScript ✓, Tailwind ✓, App Router ✓, src/ ✓

- [ ] **Step 2: 安装核心依赖**

```bash
bun add drizzle-orm @libsql/client
bun add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
bun add jose nanoid
bun add @ducanh2912/next-pwa   # 使用维护中的 next-pwa fork，官方 next-pwa 不支持 Next.js 15
bun add -d drizzle-kit @types/node
bun add -d playwright @playwright/test
```

- [ ] **Step 3: 安装 shadcn/ui**

```bash
bunx shadcn@latest init
```

选择：Default style, Neutral 颜色, CSS variables ✓

然后安装常用组件：

```bash
bunx shadcn@latest add button input label card badge sheet dialog form toast skeleton tabs separator
```

- [ ] **Step 4: 配置 next.config.ts**

```typescript
// next.config.ts
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: process.env.R2_PUBLIC_DOMAIN ?? "",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
}

export default nextConfig
```

- [ ] **Step 5: 配置 drizzle.config.ts**

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL ?? "file:./local.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
})
```

- [ ] **Step 6: 创建 .env.local 模板**

```bash
cat > .env.local.example << 'EOF'
# Turso Database
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token-here

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=recipe-images
R2_PUBLIC_DOMAIN=your-domain.r2.dev

# Auth
JWT_SECRET=your-32-char-secret-here-change-me

# Admin credentials (hashed at runtime, set plain text here for init)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-password-here
EOF
cp .env.local.example .env.local
```

- [ ] **Step 7: 配置 PWA manifest**

```json
// public/manifest.json
{
  "name": "菜谱点菜",
  "short_name": "点菜",
  "description": "记录菜谱，朋友聚餐点菜神器",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#f97316",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

- [ ] **Step 8: 验证项目启动**

```bash
bun run dev
```

预期：服务在 `http://localhost:3000` 启动，无错误。

- [ ] **Step 9: 提交**

```bash
git init
git add package.json next.config.ts tailwind.config.ts tsconfig.json drizzle.config.ts src/ public/ .env.local.example
git commit -m "feat: initialize Next.js 15 project with Bun, shadcn/ui, Drizzle"
```

---

## Task 2: 数据库 Schema

**Files:**
- Create: `src/db/schema.ts`
- Create: `src/db/index.ts`
- Create: `src/db/migrations/` (自动生成)

- [ ] **Step 1: 编写完整 Drizzle schema**

```typescript
// src/db/schema.ts
import { sql } from "drizzle-orm"
import {
  integer,
  sqliteTable,
  text,
  real,
} from "drizzle-orm/sqlite-core"

// 管理员
export const admins = sqliteTable("admins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
})

// 标签
export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  color: text("color").notNull().default("#f97316"),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
})

// 菜谱
export const recipes = sqliteTable("recipes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  coverImage: text("cover_image"),
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] }).notNull().default("medium"),
  cookTime: integer("cook_time"), // 分钟
  servings: integer("servings").notNull().default(2),
  // JSON: [{ name: string, amount: string, unit: string }]
  ingredients: text("ingredients", { mode: "json" }).$type<
    Array<{ name: string; amount: string; unit: string }>
  >().notNull().default([]),
  // JSON: [{ order: number, content: string, imageUrl?: string }]
  steps: text("steps", { mode: "json" }).$type<
    Array<{ order: number; content: string; imageUrl?: string }>
  >().notNull().default([]),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
})

// 菜谱-标签 多对多
export const recipeTags = sqliteTable("recipe_tags", {
  recipeId: integer("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
})

// 聚餐活动
export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  date: text("date").notNull(), // ISO date string
  shareCode: text("share_code").notNull().unique(),
  status: text("status", { enum: ["draft", "active", "closed"] }).notNull().default("draft"),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
})

// 活动-菜谱 多对多（哪些菜谱出现在这次活动菜单上）
export const eventRecipes = sqliteTable("event_recipes", {
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  recipeId: integer("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
})

// 访客
export const guests = sqliteTable("guests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  avatar: text("avatar"), // 可选头像 URL 或 emoji
  note: text("note"),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
})

// 点菜记录（每位访客在某活动的一次点菜）
export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  guestId: integer("guest_id").notNull().references(() => guests.id, { onDelete: "cascade" }),
  // JSON: [{ recipeId: number, quantity: number, note?: string }]
  items: text("items", { mode: "json" }).$type<
    Array<{ recipeId: number; quantity: number; note?: string }>
  >().notNull().default([]),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
})

// 类型导出
export type Recipe = typeof recipes.$inferSelect
export type NewRecipe = typeof recipes.$inferInsert
export type Tag = typeof tags.$inferSelect
export type Event = typeof events.$inferSelect
export type Guest = typeof guests.$inferSelect
export type Order = typeof orders.$inferSelect
```

- [ ] **Step 2: 编写 DB 连接**

```typescript
// src/db/index.ts
import { drizzle } from "drizzle-orm/libsql"
import { createClient } from "@libsql/client"
import * as schema from "./schema"

const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:./local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
})

export const db = drizzle(client, { schema })
export type DB = typeof db
```

- [ ] **Step 3: 生成 migration**

```bash
bun run drizzle-kit generate
```

预期：在 `src/db/migrations/` 生成 SQL 文件。

- [ ] **Step 4: 运行 migration（创建本地 SQLite 用于开发）**

在 `package.json` scripts 中添加：

```json
{
  "scripts": {
    "db:push": "drizzle-kit push",
    "db:generate": "drizzle-kit generate",
    "db:studio": "drizzle-kit studio"
  }
}
```

```bash
bun run db:push
```

预期：本地 `local.db` 创建完毕，所有表存在。

- [ ] **Step 5: 编写 seed 脚本（可选，用于测试）**

```typescript
// src/db/seed.ts
import { db } from "./index"
import { tags, recipes, admins } from "./schema"
import { hashPassword } from "@/lib/auth"  // 必须与 auth.ts 使用相同的哈希函数（Bun.password）

async function seed() {
  // 管理员
  await db.insert(admins).values({
    username: "admin",
    passwordHash: await hashPassword("admin123"),
  }).onConflictDoNothing()

  // 标签
  const [tag1, tag2] = await db.insert(tags).values([
    { name: "川菜", color: "#ef4444" },
    { name: "汤类", color: "#3b82f6" },
  ]).returning()

  // 菜谱
  await db.insert(recipes).values({
    title: "红烧肉",
    description: "经典红烧肉，肥而不腻",
    servings: 4,
    difficulty: "medium",
    cookTime: 60,
    ingredients: [
      { name: "五花肉", amount: "500", unit: "g" },
      { name: "生抽", amount: "3", unit: "勺" },
    ],
    steps: [
      { order: 1, content: "五花肉切块，冷水下锅焯水" },
      { order: 2, content: "锅中加油，放入冰糖炒糖色" },
    ],
  })

  console.log("✅ Seed complete")
  process.exit(0)
}

seed()
```

```bash
bun src/db/seed.ts
```

- [ ] **Step 6: 提交**

```bash
git add src/db/ drizzle.config.ts
git commit -m "feat: add Drizzle schema and database connection"
```

---

## Task 3: 工具函数

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/lib/storage.ts`
- Create: `src/lib/share-code.ts`
- Create: `src/lib/utils.ts`
- Create: `tests/unit/auth.test.ts`
- Create: `tests/unit/share-code.test.ts`

- [ ] **Step 1: 编写 share-code 单元测试**

```typescript
// tests/unit/share-code.test.ts
import { expect, test } from "bun:test"
import { generateShareCode, isValidShareCode } from "@/lib/share-code"

test("generateShareCode returns 8-char alphanumeric string", () => {
  const code = generateShareCode()
  expect(code).toHaveLength(8)
  expect(code).toMatch(/^[a-z0-9]+$/)
})

test("generateShareCode generates unique codes", () => {
  const codes = new Set(Array.from({ length: 100 }, generateShareCode))
  expect(codes.size).toBe(100)
})

test("isValidShareCode validates format", () => {
  expect(isValidShareCode("abc12345")).toBe(true)
  expect(isValidShareCode("ABC123")).toBe(false) // uppercase
  expect(isValidShareCode("ab!@#$%^")).toBe(false) // special chars
  expect(isValidShareCode("short")).toBe(false) // too short
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
bun test tests/unit/share-code.test.ts
```

预期：FAIL - "cannot find module"

- [ ] **Step 3: 实现 share-code**

```typescript
// src/lib/share-code.ts
import { customAlphabet } from "nanoid"

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8)

export function generateShareCode(): string {
  return nanoid()
}

export function isValidShareCode(code: string): boolean {
  return /^[a-z0-9]{8}$/.test(code)
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
bun test tests/unit/share-code.test.ts
```

预期：PASS

- [ ] **Step 5: 编写 auth 测试**

```typescript
// tests/unit/auth.test.ts
import { expect, test } from "bun:test"
import { signToken, verifyToken, hashPassword, verifyPassword } from "@/lib/auth"

test("signToken and verifyToken roundtrip", async () => {
  const payload = { adminId: 1, username: "admin" }
  const token = await signToken(payload)
  const decoded = await verifyToken(token)
  expect(decoded?.adminId).toBe(1)
  expect(decoded?.username).toBe("admin")
})

test("verifyToken returns null for invalid token", async () => {
  const result = await verifyToken("invalid-token")
  expect(result).toBeNull()
})

test("hashPassword and verifyPassword roundtrip", async () => {
  const hash = await hashPassword("mypassword")
  expect(await verifyPassword("mypassword", hash)).toBe(true)
  expect(await verifyPassword("wrongpassword", hash)).toBe(false)
})
```

- [ ] **Step 6: 运行测试确认失败**

```bash
bun test tests/unit/auth.test.ts
```

预期：FAIL

- [ ] **Step 7: 实现 auth 工具**

```typescript
// src/lib/auth.ts
import { SignJWT, jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-change-in-production"
)

export interface AdminPayload {
  adminId: number
  username: string
}

export async function signToken(payload: AdminPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as AdminPayload
  } catch {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return Bun.password.verify(password, hash)
}
```

- [ ] **Step 8: 运行测试确认通过**

```bash
bun test tests/unit/auth.test.ts
```

预期：PASS

- [ ] **Step 9: 实现 storage.ts**

```typescript
// src/lib/storage.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { nanoid } from "nanoid"

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
})

const BUCKET = process.env.R2_BUCKET_NAME ?? "recipe-images"
const PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN ?? ""

export async function uploadImage(
  buffer: Buffer,
  mimeType: string,
  folder: string = "recipes"
): Promise<string> {
  const ext = mimeType.split("/")[1] ?? "jpg"
  const key = `${folder}/${nanoid()}.${ext}`

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      CacheControl: "public, max-age=31536000",
    })
  )

  return `https://${PUBLIC_DOMAIN}/${key}`
}
```

- [ ] **Step 10: 实现 utils.ts**

```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function difficultyLabel(d: "easy" | "medium" | "hard"): string {
  return { easy: "简单", medium: "中等", hard: "困难" }[d]
}
```

- [ ] **Step 11: 提交**

```bash
git add src/lib/ tests/unit/
git commit -m "feat: add auth, storage, share-code utilities with tests"
```

---

## Task 4: 中间件与认证 API

**Files:**
- Create: `src/middleware.ts`
- Create: `src/app/api/auth/login/route.ts`
- Create: `src/app/api/auth/logout/route.ts`
- Create: `src/app/login/page.tsx`

- [ ] **Step 1: 编写 Next.js middleware**

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  // 保护 /admin/* 路由
  if (path.startsWith("/admin")) {
    const token = req.cookies.get("admin-token")?.value
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url))
    }
    const payload = await verifyToken(token)
    if (!payload) {
      const res = NextResponse.redirect(new URL("/login", req.url))
      res.cookies.delete("admin-token")
      return res
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
```

- [ ] **Step 2: 编写登录 API**

```typescript
// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { admins } from "@/db/schema"
import { eq } from "drizzle-orm"
import { verifyPassword, signToken } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  if (!username || !password) {
    return NextResponse.json({ error: "缺少用户名或密码" }, { status: 400 })
  }

  const admin = await db.query.admins.findFirst({
    where: eq(admins.username, username),
  })

  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 })
  }

  const token = await signToken({ adminId: admin.id, username: admin.username })

  const res = NextResponse.json({ ok: true })
  res.cookies.set("admin-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7天
    path: "/",
  })
  return res
}
```

- [ ] **Step 3: 编写登出 API**

```typescript
// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server"

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete("admin-token")
  return res
}
```

- [ ] **Step 4: 编写登录页面**

```typescript
// src/app/login/page.tsx
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.get("username"),
        password: form.get("password"),
      }),
    })
    setLoading(false)
    if (res.ok) {
      router.push("/admin/recipes")
    } else {
      const { error } = await res.json()
      setError(error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>管理员登录</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">用户名</Label>
              <Input id="username" name="username" required />
            </div>
            <div>
              <Label htmlFor="password">密码</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "登录中..." : "登录"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 5: 初始化管理员账号**

在 `package.json` 中添加：

```json
{
  "scripts": {
    "db:init-admin": "bun src/db/init-admin.ts"
  }
}
```

```typescript
// src/db/init-admin.ts
import { db } from "./index"
import { admins } from "./schema"
import { hashPassword } from "@/lib/auth"

const username = process.env.ADMIN_USERNAME ?? "admin"
const password = process.env.ADMIN_PASSWORD ?? "changeme"

const hash = await hashPassword(password)
await db.insert(admins).values({ username, passwordHash: hash }).onConflictDoNothing()
console.log(`✅ Admin created: ${username}`)
process.exit(0)
```

```bash
bun db:init-admin
```

- [ ] **Step 6: 手动验证登录流程**

```bash
bun run dev
```

访问 `http://localhost:3000/admin/recipes`，应被重定向到 `/login`。
用正确账号登录，应跳转到 `/admin/recipes`（页面可能是空的，这是正常的）。

- [ ] **Step 7: 提交**

```bash
git add src/middleware.ts src/app/api/auth/ src/app/login/ src/db/init-admin.ts
git commit -m "feat: add JWT auth, middleware, and login page"
```

---

## Task 5: 菜谱 API

**Files:**
- Create: `src/db/queries/recipes.ts`
- Create: `src/app/api/recipes/route.ts`
- Create: `src/app/api/recipes/[id]/route.ts`
- Create: `src/app/api/tags/route.ts`
- Create: `src/app/api/upload/route.ts`

- [ ] **Step 1: 编写菜谱 query 函数**

```typescript
// src/db/queries/recipes.ts
import { db } from "@/db"
import { recipes, tags, recipeTags } from "@/db/schema"
import { eq, like, inArray } from "drizzle-orm"

export async function getRecipes(search?: string, tagIds?: number[]) {
  const all = await db.query.recipes.findMany({
    orderBy: (r, { desc }) => [desc(r.createdAt)],
  })

  let filtered = all
  if (search) {
    filtered = filtered.filter((r) =>
      r.title.includes(search) || r.description?.includes(search)
    )
  }

  if (tagIds?.length) {
    const tagged = await db
      .select({ recipeId: recipeTags.recipeId })
      .from(recipeTags)
      .where(inArray(recipeTags.tagId, tagIds))
    const ids = new Set(tagged.map((t) => t.recipeId))
    filtered = filtered.filter((r) => ids.has(r.id))
  }

  return filtered
}

export async function getRecipeById(id: number) {
  return db.query.recipes.findFirst({ where: eq(recipes.id, id) })
}

export async function getRecipeTags(recipeId: number) {
  return db
    .select({ tag: tags })
    .from(recipeTags)
    .innerJoin(tags, eq(recipeTags.tagId, tags.id))
    .where(eq(recipeTags.recipeId, recipeId))
}

export async function createRecipe(data: typeof recipes.$inferInsert) {
  const [recipe] = await db.insert(recipes).values(data).returning()
  return recipe
}

export async function updateRecipe(id: number, data: Partial<typeof recipes.$inferInsert>) {
  const [recipe] = await db
    .update(recipes)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(recipes.id, id))
    .returning()
  return recipe
}

export async function deleteRecipe(id: number) {
  await db.delete(recipes).where(eq(recipes.id, id))
}

export async function setRecipeTags(recipeId: number, tagIds: number[]) {
  await db.delete(recipeTags).where(eq(recipeTags.recipeId, recipeId))
  if (tagIds.length) {
    await db.insert(recipeTags).values(tagIds.map((tagId) => ({ recipeId, tagId })))
  }
}
```

- [ ] **Step 2: 编写菜谱 CRUD API**

```typescript
// src/app/api/recipes/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getRecipes, createRecipe, setRecipeTags } from "@/db/queries/recipes"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const search = searchParams.get("search") ?? undefined
  const tagIds = searchParams.get("tags")?.split(",").map(Number).filter(Boolean)
  const data = await getRecipes(search, tagIds)
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const token = (await cookies()).get("admin-token")?.value
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

  const body = await req.json()
  const { tagIds, ...recipeData } = body
  const recipe = await createRecipe(recipeData)
  if (tagIds?.length) {
    await setRecipeTags(recipe.id, tagIds)
  }
  return NextResponse.json(recipe, { status: 201 })
}
```

```typescript
// src/app/api/recipes/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getRecipeById, updateRecipe, deleteRecipe, setRecipeTags } from "@/db/queries/recipes"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const recipe = await getRecipeById(Number(id))
  if (!recipe) return NextResponse.json({ error: "未找到" }, { status: 404 })
  return NextResponse.json(recipe)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get("admin-token")?.value
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

  const { id } = await params
  const { tagIds, ...data } = await req.json()
  const recipe = await updateRecipe(Number(id), data)
  if (tagIds !== undefined) {
    await setRecipeTags(Number(id), tagIds)
  }
  return NextResponse.json(recipe)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get("admin-token")?.value
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

  const { id } = await params
  await deleteRecipe(Number(id))
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: 编写标签 API**

```typescript
// src/app/api/tags/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { tags } from "@/db/schema"
import { eq } from "drizzle-orm"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function GET() {
  const all = await db.select().from(tags).orderBy(tags.name)
  return NextResponse.json(all)
}

export async function POST(req: NextRequest) {
  const token = (await cookies()).get("admin-token")?.value
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

  const { name, color } = await req.json()
  const [tag] = await db.insert(tags).values({ name, color }).returning()
  return NextResponse.json(tag, { status: 201 })
}
```

- [ ] **Step 4: 编写图片上传 API**

```typescript
// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server"
import { uploadImage } from "@/lib/storage"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  const token = (await cookies()).get("admin-token")?.value
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File
  const folder = (formData.get("folder") as string) ?? "recipes"

  if (!file) {
    return NextResponse.json({ error: "未提供文件" }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const url = await uploadImage(buffer, file.type, folder)
  return NextResponse.json({ url })
}
```

- [ ] **Step 5: 手动验证 API（使用 curl）**

```bash
# 获取菜谱列表
curl http://localhost:3000/api/recipes

# 创建菜谱（先登录获取 cookie）
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"changeme"}'

curl -b cookies.txt -X POST http://localhost:3000/api/recipes \
  -H "Content-Type: application/json" \
  -d '{"title":"测试菜","servings":2,"ingredients":[],"steps":[]}'
```

预期：创建成功返回 201 和菜谱对象。

- [ ] **Step 6: 提交**

```bash
git add src/db/queries/ src/app/api/
git commit -m "feat: add recipes and tags CRUD API with image upload"
```

---

## Task 6: 管理员菜谱 UI

**Files:**
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/recipes/page.tsx`
- Create: `src/app/admin/recipes/new/page.tsx`
- Create: `src/app/admin/recipes/[id]/edit/page.tsx`
- Create: `src/components/recipe/RecipeCard.tsx`
- Create: `src/components/recipe/RecipeForm.tsx`
- Create: `src/components/recipe/StepEditor.tsx`
- Create: `src/components/recipe/IngredientsEditor.tsx`

- [ ] **Step 1: 编写管理员布局**

```typescript
// src/app/admin/layout.tsx
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <nav className="border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin/recipes" className="font-semibold text-orange-500">
            菜谱管理
          </Link>
          <Link href="/admin/events">聚餐活动</Link>
        </div>
        <form action="/api/auth/logout" method="POST">
          <Button variant="ghost" size="sm" type="submit">退出</Button>
        </form>
      </nav>
      <main className="container mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
```

- [ ] **Step 2: 编写食材编辑器组件**

```typescript
// src/components/recipe/IngredientsEditor.tsx
"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Ingredient {
  name: string
  amount: string
  unit: string
}

interface Props {
  value: Ingredient[]
  onChange: (v: Ingredient[]) => void
}

export function IngredientsEditor({ value, onChange }: Props) {
  function add() {
    onChange([...value, { name: "", amount: "", unit: "g" }])
  }

  function update(i: number, field: keyof Ingredient, val: string) {
    const next = [...value]
    next[i] = { ...next[i], [field]: val }
    onChange(next)
  }

  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i))
  }

  return (
    <div className="space-y-2">
      {value.map((ing, i) => (
        <div key={i} className="flex gap-2">
          <Input
            placeholder="食材名"
            value={ing.name}
            onChange={(e) => update(i, "name", e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="用量"
            value={ing.amount}
            onChange={(e) => update(i, "amount", e.target.value)}
            className="w-20"
          />
          <Input
            placeholder="单位"
            value={ing.unit}
            onChange={(e) => update(i, "unit", e.target.value)}
            className="w-20"
          />
          <Button variant="ghost" size="sm" onClick={() => remove(i)}>删除</Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add} type="button">
        + 添加食材
      </Button>
    </div>
  )
}
```

- [ ] **Step 3: 编写步骤编辑器组件**

```typescript
// src/components/recipe/StepEditor.tsx
"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface Step {
  order: number
  content: string
  imageUrl?: string
}

interface Props {
  value: Step[]
  onChange: (v: Step[]) => void
  onImageUpload: (file: File) => Promise<string>
}

export function StepEditor({ value, onChange, onImageUpload }: Props) {
  const [uploading, setUploading] = useState<number | null>(null)

  function add() {
    onChange([...value, { order: value.length + 1, content: "" }])
  }

  function update(i: number, field: keyof Step, val: string) {
    const next = [...value]
    next[i] = { ...next[i], [field]: val }
    onChange(next)
  }

  function remove(i: number) {
    const next = value.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, order: idx + 1 }))
    onChange(next)
  }

  async function handleImageChange(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(i)
    try {
      const url = await onImageUpload(file)
      update(i, "imageUrl", url)
    } finally {
      setUploading(null)
    }
  }

  return (
    <div className="space-y-4">
      {value.map((step, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">步骤 {step.order}</span>
            <Button variant="ghost" size="sm" onClick={() => remove(i)}>删除</Button>
          </div>
          <Textarea
            placeholder="步骤描述..."
            value={step.content}
            onChange={(e) => update(i, "content", e.target.value)}
            rows={3}
          />
          {step.imageUrl && (
            <img src={step.imageUrl} alt="" className="max-h-40 rounded object-cover" />
          )}
          <div>
            <label className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
              {uploading === i ? "上传中..." : "上传步骤图片"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageChange(i, e)}
                disabled={uploading !== null}
              />
            </label>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add} type="button">
        + 添加步骤
      </Button>
    </div>
  )
}
```

- [ ] **Step 4: 编写菜谱表单组件**

```typescript
// src/components/recipe/RecipeForm.tsx
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IngredientsEditor } from "./IngredientsEditor"
import { StepEditor } from "./StepEditor"
import type { Recipe, Tag } from "@/db/schema"

interface Props {
  recipe?: Recipe
  tags: Tag[]
  selectedTagIds?: number[]
  mode: "create" | "edit"
}

export function RecipeForm({ recipe, tags, selectedTagIds = [], mode }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [coverPreview, setCoverPreview] = useState(recipe?.coverImage ?? "")
  const [ingredients, setIngredients] = useState(recipe?.ingredients ?? [])
  const [steps, setSteps] = useState(recipe?.steps ?? [])
  const [selectedTags, setSelectedTags] = useState<number[]>(selectedTagIds)

  async function uploadFile(file: File, folder: string): Promise<string> {
    const fd = new FormData()
    fd.append("file", file)
    fd.append("folder", folder)
    const res = await fetch("/api/upload", { method: "POST", body: fd })
    const { url } = await res.json()
    return url
  }

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await uploadFile(file, "covers")
    setCoverPreview(url)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)

    const body = {
      title: form.get("title") as string,
      description: form.get("description") as string,
      difficulty: form.get("difficulty") as string,
      cookTime: Number(form.get("cookTime")),
      servings: Number(form.get("servings")),
      coverImage: coverPreview,
      ingredients,
      steps,
      tagIds: selectedTags,
    }

    const url = mode === "create" ? "/api/recipes" : `/api/recipes/${recipe!.id}`
    const method = mode === "create" ? "POST" : "PATCH"
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    setLoading(false)
    if (res.ok) {
      router.push("/admin/recipes")
      router.refresh()
    }
  }

  function toggleTag(id: number) {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div>
        <Label>菜名 *</Label>
        <Input name="title" defaultValue={recipe?.title} required />
      </div>

      <div>
        <Label>简介</Label>
        <Textarea name="description" defaultValue={recipe?.description ?? ""} rows={3} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>难度</Label>
          <Select name="difficulty" defaultValue={recipe?.difficulty ?? "medium"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">简单</SelectItem>
              <SelectItem value="medium">中等</SelectItem>
              <SelectItem value="hard">困难</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>烹饪时间（分钟）</Label>
          <Input name="cookTime" type="number" defaultValue={recipe?.cookTime ?? 30} />
        </div>
        <div>
          <Label>几人份 *</Label>
          <Input name="servings" type="number" defaultValue={recipe?.servings ?? 2} required />
        </div>
      </div>

      <div>
        <Label>封面图片</Label>
        {coverPreview && (
          <img src={coverPreview} alt="封面" className="mb-2 max-h-48 rounded object-cover" />
        )}
        <Input type="file" accept="image/*" onChange={handleCoverChange} />
      </div>

      <div>
        <Label>标签</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                selectedTags.includes(tag.id)
                  ? "bg-orange-500 text-white border-orange-500"
                  : "border-gray-300"
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>食材</Label>
        <IngredientsEditor value={ingredients} onChange={setIngredients} />
      </div>

      <div>
        <Label>制作步骤</Label>
        <StepEditor
          value={steps}
          onChange={setSteps}
          onImageUpload={(file) => uploadFile(file, "steps")}
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "保存中..." : mode === "create" ? "创建菜谱" : "保存修改"}
      </Button>
    </form>
  )
}
```

- [ ] **Step 5: 编写菜谱列表页**

```typescript
// src/app/admin/recipes/page.tsx
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getRecipes } from "@/db/queries/recipes"
import { db } from "@/db"
import { tags } from "@/db/schema"
import { formatDate, difficultyLabel } from "@/lib/utils"

export default async function RecipesPage() {
  const [allRecipes, allTags] = await Promise.all([
    getRecipes(),
    db.select().from(tags),
  ])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">菜谱管理</h1>
        <Link href="/admin/recipes/new">
          <Button>新建菜谱</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allRecipes.map((recipe) => (
          <div key={recipe.id} className="border rounded-lg overflow-hidden">
            {recipe.coverImage && (
              <img src={recipe.coverImage} alt={recipe.title} className="w-full h-40 object-cover" />
            )}
            <div className="p-4">
              <h2 className="font-semibold">{recipe.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {difficultyLabel(recipe.difficulty)} · {recipe.cookTime}分钟 · {recipe.servings}人份
              </p>
              <div className="flex gap-2 mt-3">
                <Link href={`/admin/recipes/${recipe.id}/edit`}>
                  <Button variant="outline" size="sm">编辑</Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {allRecipes.length === 0 && (
        <p className="text-muted-foreground text-center py-12">还没有菜谱，快去创建一个吧！</p>
      )}
    </div>
  )
}
```

- [ ] **Step 6: 编写新建菜谱页**

```typescript
// src/app/admin/recipes/new/page.tsx
import { db } from "@/db"
import { tags } from "@/db/schema"
import { RecipeForm } from "@/components/recipe/RecipeForm"

export default async function NewRecipePage() {
  const allTags = await db.select().from(tags)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">新建菜谱</h1>
      <RecipeForm tags={allTags} mode="create" />
    </div>
  )
}
```

- [ ] **Step 7: 编写编辑菜谱页**

```typescript
// src/app/admin/recipes/[id]/edit/page.tsx
import { notFound } from "next/navigation"
import { db } from "@/db"
import { tags, recipeTags } from "@/db/schema"
import { getRecipeById } from "@/db/queries/recipes"
import { RecipeForm } from "@/components/recipe/RecipeForm"
import { eq } from "drizzle-orm"

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [recipe, allTags, rt] = await Promise.all([
    getRecipeById(Number(id)),
    db.select().from(tags),
    db.select().from(recipeTags).where(eq(recipeTags.recipeId, Number(id))),
  ])

  if (!recipe) notFound()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">编辑菜谱：{recipe.title}</h1>
      <RecipeForm
        recipe={recipe}
        tags={allTags}
        selectedTagIds={rt.map((r) => r.tagId)}
        mode="edit"
      />
    </div>
  )
}
```

- [ ] **Step 8: 手动验证菜谱管理流程**

```
1. 访问 /admin/recipes
2. 点击"新建菜谱"
3. 填写菜名、难度、食材、步骤，上传封面图片
4. 提交，返回列表看到新菜谱
5. 点击编辑，修改后保存
```

- [ ] **Step 9: 提交**

```bash
git add src/app/admin/ src/components/recipe/
git commit -m "feat: add recipe management UI for admin"
```

---

## Task 7: 聚餐活动 API + UI

**Files:**
- Create: `src/db/queries/events.ts`
- Create: `src/app/api/events/route.ts`
- Create: `src/app/api/events/[id]/route.ts`
- Create: `src/app/admin/events/page.tsx`
- Create: `src/app/admin/events/new/page.tsx`

- [ ] **Step 1: 编写活动 query 函数**

```typescript
// src/db/queries/events.ts
import { db } from "@/db"
import { events, eventRecipes, recipes } from "@/db/schema"
import { eq } from "drizzle-orm"
import { generateShareCode } from "@/lib/share-code"

export async function getEvents() {
  return db.select().from(events).orderBy(events.date)
}

export async function getEventByShareCode(shareCode: string) {
  return db.query.events.findFirst({ where: eq(events.shareCode, shareCode) })
}

export async function getEventById(id: number) {
  return db.query.events.findFirst({ where: eq(events.id, id) })
}

export async function getEventRecipes(eventId: number) {
  return db
    .select({ recipe: recipes })
    .from(eventRecipes)
    .innerJoin(recipes, eq(eventRecipes.recipeId, recipes.id))
    .where(eq(eventRecipes.eventId, eventId))
}

export async function createEvent(data: {
  title: string
  date: string
  recipeIds: number[]
}) {
  const shareCode = generateShareCode()
  const [event] = await db
    .insert(events)
    .values({ title: data.title, date: data.date, shareCode, status: "draft" })
    .returning()

  if (data.recipeIds.length) {
    await db
      .insert(eventRecipes)
      .values(data.recipeIds.map((recipeId) => ({ eventId: event.id, recipeId })))
  }

  return event
}

export async function updateEventStatus(id: number, status: "draft" | "active" | "closed") {
  const [event] = await db
    .update(events)
    .set({ status })
    .where(eq(events.id, id))
    .returning()
  return event
}
```

- [ ] **Step 2: 编写活动 CRUD API**

```typescript
// src/app/api/events/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getEvents, createEvent } from "@/db/queries/events"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function GET() {
  const data = await getEvents()
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const token = (await cookies()).get("admin-token")?.value
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

  const { title, date, recipeIds } = await req.json()
  const event = await createEvent({ title, date, recipeIds })
  return NextResponse.json(event, { status: 201 })
}
```

```typescript
// src/app/api/events/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getEventById, updateEventStatus } from "@/db/queries/events"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const event = await getEventById(Number(id))
  if (!event) return NextResponse.json({ error: "未找到" }, { status: 404 })
  return NextResponse.json(event)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get("admin-token")?.value
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

  const { id } = await params
  const { status } = await req.json()
  const event = await updateEventStatus(Number(id), status)
  return NextResponse.json(event)
}
```

- [ ] **Step 3: 编写活动列表页**

```typescript
// src/app/admin/events/page.tsx
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getEvents } from "@/db/queries/events"
import { formatDate } from "@/lib/utils"

const statusLabels = { draft: "草稿", active: "进行中", closed: "已结束" }
const statusVariants = {
  draft: "secondary",
  active: "default",
  closed: "outline",
} as const

export default async function EventsPage() {
  const allEvents = await getEvents()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">聚餐活动</h1>
        <Link href="/admin/events/new">
          <Button>新建活动</Button>
        </Link>
      </div>

      <div className="space-y-3">
        {allEvents.map((event) => (
          <div key={event.id} className="border rounded-lg p-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">{event.title}</h2>
              <p className="text-sm text-muted-foreground">{formatDate(event.date)}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={statusVariants[event.status]}>
                {statusLabels[event.status]}
              </Badge>
              <Link href={`/admin/events/${event.id}`}>
                <Button variant="outline" size="sm">查看</Button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {allEvents.length === 0 && (
        <p className="text-muted-foreground text-center py-12">还没有活动</p>
      )}
    </div>
  )
}
```

- [ ] **Step 4: 编写新建活动页**

```typescript
// src/app/admin/events/new/page.tsx
"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Recipe } from "@/db/schema"

export default function NewEventPage() {
  const router = useRouter()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [selectedRecipes, setSelectedRecipes] = useState<number[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch("/api/recipes").then((r) => r.json()).then(setRecipes)
  }, [])

  function toggle(id: number) {
    setSelectedRecipes((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        date: form.get("date"),
        recipeIds: selectedRecipes,
      }),
    })
    setLoading(false)
    if (res.ok) {
      router.push("/admin/events")
      router.refresh()
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">新建聚餐活动</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label>活动名称 *</Label>
          <Input name="title" required placeholder="例：周末家庭聚餐" />
        </div>
        <div>
          <Label>日期 *</Label>
          <Input name="date" type="date" required />
        </div>
        <div>
          <Label>选择菜单（可多选）</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {recipes.map((recipe) => (
              <button
                key={recipe.id}
                type="button"
                onClick={() => toggle(recipe.id)}
                className={`p-3 border rounded-lg text-left transition-colors ${
                  selectedRecipes.includes(recipe.id)
                    ? "border-orange-500 bg-orange-50"
                    : "hover:border-gray-400"
                }`}
              >
                <p className="font-medium">{recipe.title}</p>
                <p className="text-sm text-muted-foreground">{recipe.servings}人份</p>
              </button>
            ))}
          </div>
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "创建中..." : "创建活动"}
        </Button>
      </form>
    </div>
  )
}
```

- [ ] **Step 5: 提交**

```bash
git add src/db/queries/events.ts src/app/api/events/ src/app/admin/events/
git commit -m "feat: add event management API and UI"
```

---

## Task 8: 点菜系统 API

**Files:**
- Create: `src/db/queries/orders.ts`
- Create: `src/app/api/guest/join/route.ts`
- Create: `src/app/api/orders/route.ts`
- Create: `src/app/api/events/[id]/summary/route.ts`
- Create: `tests/unit/summary.test.ts`

- [ ] **Step 1: 编写备菜汇总计算单元测试**

```typescript
// tests/unit/summary.test.ts
import { expect, test } from "bun:test"
import { calculateShoppingList } from "@/db/queries/orders"

test("calculateShoppingList aggregates ingredients correctly", () => {
  const recipes = [
    {
      id: 1,
      servings: 2,
      ingredients: [
        { name: "五花肉", amount: "500", unit: "g" },
        { name: "生抽", amount: "3", unit: "勺" },
      ],
    },
    {
      id: 2,
      servings: 4,
      ingredients: [
        { name: "鸡蛋", amount: "4", unit: "个" },
      ],
    },
  ]

  const orders = [
    { items: [{ recipeId: 1, quantity: 2 }] }, // 点了2份红烧肉（1份=2人）
    { items: [{ recipeId: 2, quantity: 1 }] }, // 点了1份蛋羹（1份=4人）
  ]

  const result = calculateShoppingList(recipes as any, orders as any)

  // 红烧肉点了2份，每份需要500g五花肉/3勺生抽，总计1000g五花肉/6勺生抽
  const pork = result.find((r) => r.name === "五花肉")
  expect(pork?.totalAmount).toBe("1000")
  expect(pork?.unit).toBe("g")

  // 蛋羹点了1份，需要4个鸡蛋
  const egg = result.find((r) => r.name === "鸡蛋")
  expect(egg?.totalAmount).toBe("4")
})

test("calculateShoppingList handles empty orders", () => {
  const result = calculateShoppingList([], [])
  expect(result).toEqual([])
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
bun test tests/unit/summary.test.ts
```

- [ ] **Step 3: 编写 orders query 函数（含汇总）**

```typescript
// src/db/queries/orders.ts
import { db } from "@/db"
import { orders, guests, recipes } from "@/db/schema"
import { eq } from "drizzle-orm"
import type { Recipe, Order } from "@/db/schema"

export async function getOrdersByEvent(eventId: number) {
  return db.query.orders.findMany({
    where: eq(orders.eventId, eventId),
  })
}

export async function getGuestOrder(eventId: number, guestId: number) {
  return db.query.orders.findFirst({
    where: (o, { and }) => and(eq(o.eventId, eventId), eq(o.guestId, guestId)),
  })
}

export async function upsertOrder(
  eventId: number,
  guestId: number,
  items: Array<{ recipeId: number; quantity: number; note?: string }>
) {
  const existing = await getGuestOrder(eventId, guestId)
  if (existing) {
    const [updated] = await db
      .update(orders)
      .set({ items })
      .where(eq(orders.id, existing.id))
      .returning()
    return updated
  } else {
    const [created] = await db
      .insert(orders)
      .values({ eventId, guestId, items })
      .returning()
    return created
  }
}

export interface ShoppingItem {
  name: string
  totalAmount: string
  unit: string
  recipes: string[] // 哪些菜用到了这个食材
}

export function calculateShoppingList(
  recipeList: Pick<Recipe, "id" | "servings" | "ingredients" | "title">[],
  orderList: Pick<Order, "items">[]
): ShoppingItem[] {
  // 统计每道菜的总点数
  const recipeQuantity = new Map<number, number>()
  for (const order of orderList) {
    for (const item of order.items) {
      recipeQuantity.set(item.recipeId, (recipeQuantity.get(item.recipeId) ?? 0) + item.quantity)
    }
  }

  // 汇总食材
  const ingredientMap = new Map<string, ShoppingItem>()
  for (const recipe of recipeList) {
    const qty = recipeQuantity.get(recipe.id) ?? 0
    if (qty === 0) continue

    for (const ing of recipe.ingredients) {
      const amount = parseFloat(ing.amount)
      if (isNaN(amount)) continue

      // 设计决定：1个"点菜单位"= 完整的1份菜（servings人份）
      // qty = 点了几份完整的菜。例如: 红烧肉 500g/份，点2份 = 1000g
      // servings 字段仅用于 UI 显示，不参与食材计算
      const total = amount * qty
      const existing = ingredientMap.get(ing.name)
      const round2 = (n: number) => Math.round(n * 100) / 100  // 避免浮点数精度问题
      if (existing && existing.unit === ing.unit) {
        existing.totalAmount = round2(parseFloat(existing.totalAmount) + total).toString()
        if (!existing.recipes.includes(recipe.title ?? "")) {
          existing.recipes.push(recipe.title ?? "")
        }
      } else {
        ingredientMap.set(ing.name, {
          name: ing.name,
          totalAmount: round2(total).toString(),
          unit: ing.unit,
          recipes: [recipe.title ?? ""],
        })
      }
    }
  }

  return Array.from(ingredientMap.values())
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
bun test tests/unit/summary.test.ts
```

预期：PASS

- [ ] **Step 5: 编写访客加入 API**

```typescript
// src/app/api/guest/join/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { guests } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { getEventByShareCode } from "@/db/queries/events"

export async function POST(req: NextRequest) {
  const { shareCode, name, avatar, note } = await req.json()

  const event = await getEventByShareCode(shareCode)
  if (!event) {
    return NextResponse.json({ error: "活动不存在" }, { status: 404 })
  }
  if (event.status === "closed") {
    return NextResponse.json({ error: "活动已结束" }, { status: 403 })
  }

  // 检查该昵称在该活动中是否已存在
  let guest = await db.query.guests.findFirst({
    where: and(eq(guests.eventId, event.id), eq(guests.name, name)),
  })

  if (!guest) {
    ;[guest] = await db
      .insert(guests)
      .values({ eventId: event.id, name, avatar, note })
      .returning()
  }

  const res = NextResponse.json({ event, guest })
  res.cookies.set(`guest-${event.shareCode}`, guest.id.toString(), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",  // 必须为 "/"，否则 /api/orders 路由收不到该 cookie
                // cookie name 中已含 shareCode，可区分不同活动
  })
  return res
}
```

- [ ] **Step 6: 编写点菜 API**

```typescript
// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server"
import { upsertOrder } from "@/db/queries/orders"
import { getEventByShareCode } from "@/db/queries/events"
// 注意：不再调用 notifyEventUpdate — 已改为客户端轮询，无需服务端推送通知

export async function POST(req: NextRequest) {
  const { shareCode, items } = await req.json()

  const event = await getEventByShareCode(shareCode)
  if (!event) return NextResponse.json({ error: "活动不存在" }, { status: 404 })
  if (event.status === "closed") return NextResponse.json({ error: "活动已结束" }, { status: 403 })

  const guestId = Number(req.cookies.get(`guest-${shareCode}`)?.value)
  if (!guestId) return NextResponse.json({ error: "请先加入活动" }, { status: 401 })

  const order = await upsertOrder(event.id, guestId, items)
  return NextResponse.json(order)
}
```

- [ ] **Step 7: 编写汇总 API**

```typescript
// src/app/api/events/[id]/summary/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getEventById, getEventRecipes } from "@/db/queries/events"
import { getOrdersByEvent, calculateShoppingList } from "@/db/queries/orders"
import { db } from "@/db"
import { guests, orders } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const eventId = Number(id)

  const [event, eventRecipeRows, allOrders, allGuests] = await Promise.all([
    getEventById(eventId),
    getEventRecipes(eventId),
    getOrdersByEvent(eventId),
    db.select().from(guests).where(eq(guests.eventId, eventId)),
  ])

  if (!event) return NextResponse.json({ error: "未找到" }, { status: 404 })

  const recipeList = eventRecipeRows.map((r) => r.recipe)
  const shoppingList = calculateShoppingList(recipeList, allOrders)

  // 每道菜被点了几次
  const recipeOrderCount = new Map<number, number>()
  for (const order of allOrders) {
    for (const item of order.items) {
      recipeOrderCount.set(item.recipeId, (recipeOrderCount.get(item.recipeId) ?? 0) + item.quantity)
    }
  }

  return NextResponse.json({
    event,
    guests: allGuests,
    orders: allOrders,
    recipeSummary: recipeList.map((r) => ({
      ...r,
      totalQuantity: recipeOrderCount.get(r.id) ?? 0,
    })),
    shoppingList,
  })
}
```

- [ ] **Step 8: 提交**

```bash
git add src/db/queries/orders.ts src/app/api/guest/ src/app/api/orders/ src/app/api/events/ tests/unit/summary.test.ts
git commit -m "feat: add order system API and shopping list calculation"
```

---

## Task 9: 实时更新说明（轮询方案）

> **架构决策：** 不使用 SSE/WebSocket。Vercel serverless 函数每次请求是独立冷启动实例，无法共享进程内存，SSE 的 pub/sub 无法工作。改为客户端轮询——管理员详情页每 3 秒自动调用 `/api/events/[id]/summary`，对个人聚餐场景延迟完全可接受。

实时更新逻辑直接在 Task 10 的 `SummaryPanel.tsx` 组件中通过 `setInterval` 实现，无需额外的服务器端文件。

- [ ] **Step 1: 确认 `/api/events/[id]/summary` 已就绪（Task 8 完成后）**

```bash
curl http://localhost:3000/api/events/1/summary
```

预期：返回 JSON，包含 guests、orders、recipeSummary、shoppingList。

- [ ] **Step 2: 提交说明**

```bash
git commit --allow-empty -m "doc: use polling instead of SSE for Vercel compatibility"
```

---

## Task 10: 管理员活动详情页（实时汇总）

**Files:**
- Create: `src/app/admin/events/[id]/page.tsx`
- Create: `src/components/event/SummaryPanel.tsx`
- Create: `src/components/event/EventStatusButton.tsx`
- Create: `src/components/event/ShoppingList.tsx`

- [ ] **Step 1: 编写汇总面板组件（客户端，使用轮询）**

```typescript
// src/components/event/SummaryPanel.tsx
"use client"
import { useEffect, useState, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { ShoppingList } from "./ShoppingList"

interface SummaryData {
  guests: Array<{ id: number; name: string }>
  orders: Array<{ guestId: number; items: Array<{ recipeId: number; quantity: number; note?: string }> }>
  recipeSummary: Array<{ id: number; title: string; totalQuantity: number; servings: number }>
  shoppingList: Array<{ name: string; totalAmount: string; unit: string; recipes: string[] }>
}

export function SummaryPanel({ eventId }: { eventId: number }) {
  const [data, setData] = useState<SummaryData | null>(null)

  const fetchSummary = useCallback(async () => {
    const res = await fetch(`/api/events/${eventId}/summary`)
    if (res.ok) setData(await res.json())
  }, [eventId])

  useEffect(() => {
    fetchSummary()
    // 每 3 秒轮询一次（替代 SSE，兼容 Vercel serverless）
    const timer = setInterval(fetchSummary, 3000)
    return () => clearInterval(timer)
  }, [eventId, fetchSummary])

  if (!data) return <p className="text-muted-foreground">加载中...</p>

  return (
    <div className="space-y-6">
      {/* 参与人数 */}
      <div>
        <h2 className="font-semibold mb-2">参与者 ({data.guests.length}人)</h2>
        <div className="flex flex-wrap gap-2">
          {data.guests.map((g) => (
            <Badge key={g.id} variant="secondary">{g.name}</Badge>
          ))}
        </div>
      </div>

      {/* 菜品汇总 */}
      <div>
        <h2 className="font-semibold mb-2">菜品汇总</h2>
        <div className="space-y-2">
          {data.recipeSummary
            .filter((r) => r.totalQuantity > 0)
            .sort((a, b) => b.totalQuantity - a.totalQuantity)
            .map((r) => (
              <div key={r.id} className="flex items-center justify-between border-b pb-2">
                <span>{r.title}</span>
                <span className="text-muted-foreground text-sm">×{r.totalQuantity}</span>
              </div>
            ))}
        </div>
      </div>

      {/* 备菜清单 */}
      <ShoppingList items={data.shoppingList} />
    </div>
  )
}
```

- [ ] **Step 2: 编写备菜清单组件**

```typescript
// src/components/event/ShoppingList.tsx
interface Props {
  items: Array<{ name: string; totalAmount: string; unit: string; recipes: string[] }>
}

export function ShoppingList({ items }: Props) {
  if (items.length === 0) return <p className="text-muted-foreground text-sm">暂无点菜</p>

  return (
    <div>
      <h2 className="font-semibold mb-2">备菜清单</h2>
      <div className="border rounded-lg divide-y">
        {items.map((item) => (
          <div key={item.name} className="flex items-center justify-between p-3">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.recipes.join("、")}</p>
            </div>
            <span className="font-semibold">
              {item.totalAmount} {item.unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 编写 EventStatusButton 客户端组件**

```typescript
// src/components/event/EventStatusButton.tsx
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface Props {
  eventId: number
  currentStatus: "draft" | "active" | "closed"
}

export function EventStatusButton({ eventId, currentStatus }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (currentStatus === "closed") return null

  const nextStatus = currentStatus === "active" ? "closed" : "active"
  const label = currentStatus === "active" ? "结束活动" : "开始活动"

  async function handleClick() {
    setLoading(true)
    await fetch(`/api/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={loading}>
      {loading ? "处理中..." : label}
    </Button>
  )
}
```

- [ ] **Step 4: 编写活动详情页（Server Component，不含 onClick）**

```typescript
// src/app/admin/events/[id]/page.tsx
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { getEventById } from "@/db/queries/events"
import { SummaryPanel } from "@/components/event/SummaryPanel"
import { EventStatusButton } from "@/components/event/EventStatusButton"
import { formatDate } from "@/lib/utils"

const statusLabels = { draft: "草稿", active: "进行中", closed: "已结束" }

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const event = await getEventById(Number(id))
  if (!event) notFound()

  const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/e/${event.shareCode}`

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{event.title}</h1>
          <p className="text-muted-foreground">{formatDate(event.date)}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge>{statusLabels[event.status]}</Badge>
          <EventStatusButton eventId={event.id} currentStatus={event.status} />
        </div>
      </div>

      {/* 分享链接 */}
      <div className="bg-muted rounded-lg p-4 mb-6">
        <p className="text-sm font-medium mb-1">分享链接（发给朋友）</p>
        <p className="text-sm font-mono break-all">{shareUrl}</p>
      </div>

      {/* 实时汇总面板（客户端轮询） */}
      <SummaryPanel eventId={event.id} />
    </div>
  )
}
```

- [ ] **Step 5: 提交**

```bash
git add src/app/admin/events/[id]/ src/components/event/
git commit -m "feat: add event detail page with real-time summary panel"
```

---

## Task 11: 访客点菜 UI

**Files:**
- Create: `src/app/(guest)/e/[shareCode]/page.tsx`
- Create: `src/app/(guest)/e/[shareCode]/menu/page.tsx`
- Create: `src/app/(guest)/e/[shareCode]/order/page.tsx`
- Create: `src/app/(guest)/e/[shareCode]/recipe/[id]/page.tsx`
- Create: `src/app/api/events/by-share/[shareCode]/recipes/route.ts`
- Create: `src/components/order/MenuGrid.tsx`

- [ ] **Step 1: 编写访客入口页（输入昵称）**

```typescript
// src/app/(guest)/e/[shareCode]/page.tsx
"use client"
import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function GuestJoinPage() {
  const router = useRouter()
  const { shareCode } = useParams<{ shareCode: string }>()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const res = await fetch("/api/guest/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shareCode,
        name: form.get("name"),
        note: form.get("note"),
      }),
    })
    setLoading(false)
    if (res.ok) {
      router.push(`/e/${shareCode}/menu`)
    } else {
      const { error } = await res.json()
      setError(error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>加入聚餐</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">你的昵称 *</Label>
              <Input id="name" name="name" required placeholder="请输入你的名字" />
            </div>
            <div>
              <Label htmlFor="note">备注（可选）</Label>
              <Input id="note" name="note" placeholder="例：不吃香菜" />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "加入中..." : "开始点菜"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: 编写菜单网格组件**

```typescript
// src/components/order/MenuGrid.tsx
"use client"
import type { Recipe } from "@/db/schema"
import { difficultyLabel } from "@/lib/utils"

interface Props {
  recipes: Recipe[]
  cart: Map<number, number>
  onAdd: (id: number) => void
  onRemove: (id: number) => void
}

export function MenuGrid({ recipes, cart, onAdd, onRemove }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {recipes.map((recipe) => {
        const qty = cart.get(recipe.id) ?? 0
        return (
          <div key={recipe.id} className="border rounded-lg overflow-hidden">
            {recipe.coverImage && (
              <img src={recipe.coverImage} alt={recipe.title} className="w-full h-36 object-cover" />
            )}
            <div className="p-3">
              <p className="font-semibold">{recipe.title}</p>
              <p className="text-xs text-muted-foreground">
                {difficultyLabel(recipe.difficulty)} · {recipe.cookTime}分钟 · {recipe.servings}人份
              </p>
              <div className="flex items-center gap-2 mt-3">
                {qty > 0 ? (
                  <>
                    <button
                      onClick={() => onRemove(recipe.id)}
                      className="w-11 h-11 rounded-full border flex items-center justify-center text-lg"
                      aria-label="减少数量"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-semibold">{qty}</span>
                    <button
                      onClick={() => onAdd(recipe.id)}
                      className="w-11 h-11 rounded-full bg-orange-500 text-white flex items-center justify-center text-lg"
                      aria-label="增加数量"
                    >
                      +
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => onAdd(recipe.id)}
                    className="px-4 py-1 rounded-full bg-orange-500 text-white text-sm"
                  >
                    点这个
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: 编写菜单浏览页**

```typescript
// src/app/(guest)/e/[shareCode]/menu/page.tsx
"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MenuGrid } from "@/components/order/MenuGrid"
import type { Recipe } from "@/db/schema"

export default function MenuPage() {
  const { shareCode } = useParams<{ shareCode: string }>()
  const router = useRouter()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [cart, setCart] = useState<Map<number, number>>(new Map())
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // 获取该活动的菜谱列表
    fetch(`/api/events/by-share/${shareCode}/recipes`)
      .then((r) => r.json())
      .then(setRecipes)
  }, [shareCode])

  function addToCart(id: number) {
    setCart((prev) => new Map(prev).set(id, (prev.get(id) ?? 0) + 1))
  }

  function removeFromCart(id: number) {
    setCart((prev) => {
      const next = new Map(prev)
      const qty = (next.get(id) ?? 0) - 1
      if (qty <= 0) next.delete(id)
      else next.set(id, qty)
      return next
    })
  }

  const totalItems = Array.from(cart.values()).reduce((a, b) => a + b, 0)

  async function handleSubmit() {
    setSubmitting(true)
    const items = Array.from(cart.entries()).map(([recipeId, quantity]) => ({
      recipeId,
      quantity,
    }))
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shareCode, items }),
    })
    setSubmitting(false)
    if (res.ok) {
      router.push(`/e/${shareCode}/order`)
    }
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="sticky top-0 bg-white border-b px-4 py-3">
        <h1 className="font-bold text-lg">选菜</h1>
      </div>

      <div className="p-4">
        <MenuGrid
          recipes={recipes}
          cart={cart}
          onAdd={addToCart}
          onRemove={removeFromCart}
        />
      </div>

      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
          <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "提交中..." : `提交点菜（${totalItems}道）`}
          </Button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: 添加按分享码获取活动菜谱的 API**

```typescript
// src/app/api/events/by-share/[shareCode]/recipes/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getEventByShareCode, getEventRecipes } from "@/db/queries/events"

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ shareCode: string }> }
) {
  const { shareCode } = await params
  const event = await getEventByShareCode(shareCode)
  if (!event) return NextResponse.json({ error: "未找到" }, { status: 404 })

  const rows = await getEventRecipes(event.id)
  return NextResponse.json(rows.map((r) => r.recipe))
}
```

- [ ] **Step 5: 编写点菜确认页**

```typescript
// src/app/(guest)/e/[shareCode]/order/page.tsx
export default function OrderConfirmPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <div className="text-5xl mb-4">🎉</div>
      <h1 className="text-2xl font-bold mb-2">点菜成功！</h1>
      <p className="text-muted-foreground">你的点菜已记录，等待聚餐吧！</p>
    </div>
  )
}
```

- [ ] **Step 6: 手动验证完整点菜流程**

```
1. 管理员创建活动，选择菜谱，状态改为 active
2. 复制分享链接
3. 新开隐私窗口打开分享链接
4. 输入昵称 → 跳转菜单页
5. 点选菜品 → 提交 → 确认页
6. 管理员详情页看到实时更新的汇总和备菜清单
```

- [ ] **Step 7: 提交**

```bash
git add src/app/\(guest\)/ src/components/order/ src/app/api/events/by-share/
git commit -m "feat: add guest ordering UI and order flow"
```

---

## Task 12: 公开首页

**Files:**
- Create: `src/app/(public)/page.tsx`（或 `src/app/page.tsx`）

- [ ] **Step 1: 编写公开首页菜谱展示墙**

```typescript
// src/app/page.tsx
import { getRecipes } from "@/db/queries/recipes"
import { db } from "@/db"
import { tags } from "@/db/schema"
import { difficultyLabel } from "@/lib/utils"
import Link from "next/link"

export default async function HomePage() {
  const [allRecipes, allTags] = await Promise.all([getRecipes(), db.select().from(tags)])

  return (
    <div className="min-h-screen">
      <header className="border-b px-6 py-4">
        <h1 className="text-xl font-bold text-orange-500">我的菜谱</h1>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {allRecipes.map((recipe) => (
            <div key={recipe.id} className="border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              {recipe.coverImage ? (
                <img src={recipe.coverImage} alt={recipe.title} className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-orange-50 flex items-center justify-center text-4xl">🍳</div>
              )}
              <div className="p-3">
                <p className="font-semibold text-sm">{recipe.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {difficultyLabel(recipe.difficulty)} · {recipe.servings}人份
                </p>
              </div>
            </div>
          ))}
        </div>

        {allRecipes.length === 0 && (
          <p className="text-center text-muted-foreground py-20">还没有菜谱</p>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: 提交**

```bash
git add src/app/page.tsx
git commit -m "feat: add public recipe showcase homepage"
```

---

## Task 13: PWA 配置

**Files:**
- Modify: `next.config.ts`
- Create: `public/icons/` (需要生成图标)

- [ ] **Step 1: 配置 next-pwa**

```typescript
// next.config.ts
import type { NextConfig } from "next"
import withPWA from "@ducanh2912/next-pwa"  // 官方 next-pwa 不支持 Next.js 15，使用此 fork

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: process.env.R2_PUBLIC_DOMAIN ?? "localhost",
      },
    ],
  },
}

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    disableDevLogs: true,
  },
})(nextConfig)
```

- [ ] **Step 2: 创建占位图标（开发用）**

```bash
# 生成简单的 PNG 图标（实际项目中替换为设计图标）
mkdir -p public/icons
# 在 public/icons/ 中放置 icon-192.png 和 icon-512.png
# 可以用在线工具生成或使用 sharp 库生成
```

- [ ] **Step 3: 验证 PWA**

```bash
bun run build && bun run start
```

在 Chrome DevTools Application 面板检查 Service Worker 是否注册。

- [ ] **Step 4: 提交**

```bash
git add next.config.ts public/
git commit -m "feat: configure PWA with next-pwa"
```

---

## Task 14: E2E 测试

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/order-flow.test.ts`

- [ ] **Step 1: 配置 Playwright**

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  timeout: 30000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "Mobile Chrome", use: { ...devices["Pixel 5"] } },
  ],
  webServer: {
    command: "bun run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
})
```

- [ ] **Step 2: 编写 E2E 测试**

```typescript
// tests/e2e/order-flow.test.ts
import { test, expect } from "@playwright/test"

test.describe("Order Flow", () => {
  test("admin creates event and guest orders successfully", async ({ page, context }) => {
    // 1. 管理员登录
    await page.goto("/login")
    await page.fill("[name=username]", "admin")
    await page.fill("[name=password]", process.env.ADMIN_PASSWORD ?? "changeme")
    await page.click("[type=submit]")
    await expect(page).toHaveURL("/admin/recipes")

    // 2. 创建菜谱（如果没有的话）
    const recipeCount = await page.locator(".border.rounded-lg").count()
    if (recipeCount === 0) {
      await page.goto("/admin/recipes/new")
      await page.fill("[name=title]", "测试菜")
      await page.fill("[name=servings]", "2")
      await page.click("[type=submit]")
      await expect(page).toHaveURL("/admin/recipes")
    }

    // 3. 创建活动
    await page.goto("/admin/events/new")
    await page.fill("[name=title]", "E2E测试聚餐")
    await page.fill("[name=date]", "2026-12-31")
    await page.locator(".border.rounded-lg button").first().click() // 选择第一道菜
    await page.click("[type=submit]")
    await expect(page).toHaveURL("/admin/events")

    // 4. 激活活动并获取分享链接
    await page.locator("text=查看").first().click()
    const shareUrl = await page.locator(".font-mono").textContent()
    expect(shareUrl).toBeTruthy()

    // 激活活动
    await page.click("text=开始活动")

    // 5. 访客通过链接点菜（新上下文模拟不同用户）
    const guestContext = await context.browser()!.newContext()
    const guestPage = await guestContext.newPage()
    await guestPage.goto(shareUrl!)
    await guestPage.fill("[name=name]", "测试访客")
    await guestPage.click("[type=submit]")
    await expect(guestPage).toHaveURL(/\/menu$/)

    // 点菜
    await guestPage.click("text=点这个")
    await guestPage.click("text=提交点菜")
    await expect(guestPage).toHaveURL(/\/order$/)
    await expect(guestPage.locator("text=点菜成功")).toBeVisible()

    // 6. 管理员端查看汇总更新
    await page.reload()
    await expect(page.locator("text=测试访客")).toBeVisible()

    await guestContext.close()
  })
})
```

- [ ] **Step 3: 运行 E2E 测试**

```bash
bun run build
bunx playwright install chromium
bunx playwright test tests/e2e/order-flow.test.ts
```

预期：PASS

- [ ] **Step 4: 提交**

```bash
git add playwright.config.ts tests/e2e/
git commit -m "test: add E2E test for complete order flow"
```

---

## Task 15: 部署配置

**Files:**
- Create: `vercel.json`
- Create: `.env.production.example`
- Modify: `package.json` (添加部署脚本)

- [ ] **Step 1: 创建 vercel.json（指定区域）**

```json
// vercel.json
{
  "regions": ["hkg1"],
  "functions": {
    "src/app/api/**": {
      "maxDuration": 10
    }
  }
}
```

- [ ] **Step 2: 创建生产环境变量说明文档**

```bash
cat > .env.production.example << 'EOF'
# Turso Database（在 turso.tech 创建数据库后获取）
TURSO_DATABASE_URL=libsql://your-db-name.turso.io
TURSO_AUTH_TOKEN=eyJ...

# Cloudflare R2（在 Cloudflare Dashboard > R2 创建 bucket）
R2_ACCOUNT_ID=abc123
R2_ACCESS_KEY_ID=your-key
R2_SECRET_ACCESS_KEY=your-secret
R2_BUCKET_NAME=recipe-images
R2_PUBLIC_DOMAIN=pub.your-domain.com

# JWT Secret（openssl rand -base64 32）
JWT_SECRET=your-secret-here

# 应用域名（不含 trailing slash）
NEXT_PUBLIC_BASE_URL=https://your-domain.com

# 管理员初始化（仅 init-admin 脚本使用，之后可删除）
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
EOF
```

- [ ] **Step 3: 添加 package.json 脚本**

在 `package.json` 的 scripts 中确保包含：

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "test": "bun test",
    "test:e2e": "playwright test",
    "db:push": "drizzle-kit push",
    "db:generate": "drizzle-kit generate",
    "db:studio": "drizzle-kit studio",
    "db:init-admin": "bun src/db/init-admin.ts"
  }
}
```

- [ ] **Step 4: 推送到 Vercel 部署**

```bash
# 安装 Vercel CLI（如果还没有）
bun add -g vercel

# 部署
vercel --prod
```

在 Vercel Dashboard 中配置所有环境变量。

- [ ] **Step 5: 运行生产初始化**

部署后运行（一次性）：

```bash
TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... bun run db:push
TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... ADMIN_USERNAME=admin ADMIN_PASSWORD=xxx bun run db:init-admin
```

- [ ] **Step 6: Cloudflare 域名配置**

```
1. 在 Cloudflare 添加自定义域名，开启代理（橙云朵）
2. 将 CNAME 指向 Vercel 分配的域名
3. 在 Cloudflare 缓存规则中：
   - 对 /_next/static/* 设置 Cache-Control: max-age=31536000
   - 对 /api/* 设置 Cache-Control: no-cache
4. R2 bucket 开启公开访问，配置自定义域名
```

- [ ] **Step 7: 最终验证**

```
1. 访问生产域名，看到首页
2. 登录管理员，创建菜谱+活动
3. 手机浏览器打开分享链接，点菜成功
4. Chrome DevTools 验证 PWA 可安装
5. 管理员端实时看到汇总
```

- [ ] **Step 8: 最终提交**

```bash
git add vercel.json .env.production.example
git commit -m "feat: add Vercel deployment config with HKG region"
```

---

## 快速参考

### 单元测试运行
```bash
bun test                          # 所有单元测试
bun test tests/unit/auth.test.ts  # 单个文件
```

### 数据库操作
```bash
bun run db:push    # 推送 schema 变更到数据库
bun run db:studio  # 打开 Drizzle Studio 可视化界面
```

### 本地开发
```bash
bun run dev  # 启动开发服务器（http://localhost:3000）
```

### 关键环境变量
| 变量 | 说明 |
|------|------|
| `TURSO_DATABASE_URL` | Turso 数据库 URL（开发时留空用本地 SQLite）|
| `TURSO_AUTH_TOKEN` | Turso 认证 Token（开发时可留空）|
| `R2_*` | Cloudflare R2 配置（开发时可用本地文件替代）|
| `JWT_SECRET` | JWT 签名密钥（至少 32 字符）|
| `NEXT_PUBLIC_BASE_URL` | 应用公开 URL，用于生成分享链接 |
