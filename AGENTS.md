<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Recipe & Order — 项目指南

家庭菜谱管理 + 聚餐点单系统。Admin 管理菜谱和活动，Guest 通过分享码进入活动并点菜。

## 技术栈

| 层        | 技术                                                     |
| --------- | -------------------------------------------------------- |
| 框架      | Next.js 16 (App Router, React 19, Turbopack)             |
| 语言      | TypeScript (strict mode)                                 |
| 样式      | Tailwind CSS v4 + CSS 变量 (oklch 色彩空间)              |
| UI 组件   | shadcn/ui **base-nova** 风格 — 底层是 **@base-ui/react** |
| 数据库    | SQLite (Drizzle ORM + libsql/Turso)                      |
| 认证      | JWT (jose) + bcrypt，存 httpOnly cookie                  |
| 存储      | Cloudflare R2 (S3 兼容)                                  |
| 测试      | Bun (单元) + Playwright (E2E)                            |
| 包管理    | npm (运行时 Bun 支持)                                    |

## 关键约定

### Next.js 16 注意事项

- **路由参数是 Promise**：`{ params }: { params: Promise<{ id: string }> }` 需要 `await params`。
- **proxy.ts** 是 middleware（不叫 middleware.ts），用于保护 `/admin/*` 路由。
- **Server Component 是默认**，只在需要交互 (事件处理、hooks) 时加 `"use client"`。
- 使用 `next/headers` 中的 `cookies()` 读写 cookie（也是 async 的，需要 `await`）。

### UI 组件：Base UI，不是 Radix

shadcn/ui 在此项目中使用的是 **@base-ui/react**（非 @radix-ui）。
- `Select` 来自 `@base-ui/react/select`，API 不同于 Radix Select。
- 如果 Select 的 trigger 需要显示中文标签（而 value 是英文如 "easy"），需在 `<Select>` 根组件上传 `items` prop 做映射，否则 `<SelectValue>` 会回退显示原始 value 字符串。
- 添加新 UI 组件请用 `npx shadcn@latest add <component>`，不要手写。

### 表单模式

当前统一使用 **Client Component + fetch 到 API route** 的方式：
```tsx
"use client"
const res = await fetch("/api/xxx", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
})
```
不使用 Server Actions 提交表单（尽管框架支持）。

### API 路由约定

```
src/app/api/{entity}/route.ts          → GET (列表) / POST (新建)
src/app/api/{entity}/[id]/route.ts     → GET / PUT / DELETE (单条)
```

- **GET** 通常公开；**POST/PUT/DELETE** 必须验证 admin JWT：
  ```ts
  const token = (await cookies()).get("admin-token")?.value
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }
  ```
- 错误信息使用中文。
- 输入校验在 API 层做（客户端校验仅作 UX 辅助）。

### 数据库

- **Schema**: `src/db/schema.ts` — 单文件，所有表定义和类型导出。
- **Queries**: `src/db/queries/{entity}.ts` — 每个实体一个文件，导出查询函数。
- 使用 Drizzle 查询 API (`db.query.xxx.findFirst`, `db.select()` 等)，不用原始 SQL。
- JSON 字段 (`ingredients`, `steps`, `items`) 使用 `text("col", { mode: "json" }).$type<T>()`。
- Schema 变更后运行 `npm run db:generate && npm run db:push`。

### 样式

- 使用 `cn()` (来自 `@/lib/utils`) 合并 className。
- 主色调: orange（`--primary: oklch(0.705 0.213 47.604)`）。
- 支持暗色模式 (next-themes, `dark:` 前缀)。
- 组件变体使用 CVA (class-variance-authority)。

### 路径别名

`@/*` → `./src/*` (tsconfig paths)

## 架构

### 双端分离

| 端    | 路由             | 认证方式                      | 保护机制     |
| ----- | ---------------- | ----------------------------- | ------------ |
| Admin | `/admin/*`       | JWT (admin-token cookie)      | proxy.ts     |
| Guest | `/e/[code]/*`    | guestId (guest-{code} cookie) | 活动状态检查 |

### 核心数据流

```
Admin 创建菜谱 → Admin 创建活动(选菜谱) → 生成分享码
→ Guest 输入分享码加入 → Guest 浏览菜单点菜 → Admin 查看汇总
```

### 活动状态机

`draft` → `active` → `closed`
- draft: 仅 admin 可见
- active: guest 可加入、点菜、改单
- closed: 只读

## 文件组织

```
src/
├── app/
│   ├── admin/          # Admin 页面 (server components)
│   ├── e/[code]/       # Guest 页面
│   ├── api/            # API route handlers
│   ├── login/          # 登录页
│   └── page.tsx        # 首页 (菜谱展示墙)
├── components/
│   ├── ui/             # shadcn/base-ui 基础组件
│   ├── admin/          # Admin 专用组件 (client)
│   ├── guest/          # Guest 专用组件 (client)
│   ├── recipe/         # 菜谱编辑组件
│   └── event/          # 活动相关组件
├── db/
│   ├── schema.ts       # Drizzle schema + 类型
│   ├── queries/        # 按实体分文件的查询函数
│   └── index.ts        # DB 客户端实例
├── lib/
│   ├── auth.ts         # JWT + bcrypt
│   ├── storage.ts      # R2 上传
│   ├── share-code.ts   # 分享码生成
│   └── utils.ts        # cn(), difficultyLabel() 等工具
└── proxy.ts            # Middleware (路由保护)
```

## 常用命令

```bash
npm run dev              # 开发 (Turbopack)
npm run db:push          # 应用 schema 到数据库
npm run db:studio        # Drizzle Studio (可视化数据库)
npm run db:init-admin    # 初始化管理员账号
npm run test             # Bun 单元测试
npm run test:e2e         # Playwright E2E
```

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **recipe-n-order** (409 symbols, 899 relationships, 28 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## When Debugging

1. `gitnexus_query({query: "<error or symptom>"})` — find execution flows related to the issue
2. `gitnexus_context({name: "<suspect function>"})` — see all callers, callees, and process participation
3. `READ gitnexus://repo/recipe-n-order/process/{processName}` — trace the full execution flow step by step
4. For regressions: `gitnexus_detect_changes({scope: "compare", base_ref: "main"})` — see what your branch changed

## When Refactoring

- **Renaming**: MUST use `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` first. Review the preview — graph edits are safe, text_search edits need manual review. Then run with `dry_run: false`.
- **Extracting/Splitting**: MUST run `gitnexus_context({name: "target"})` to see all incoming/outgoing refs, then `gitnexus_impact({target: "target", direction: "upstream"})` to find all external callers before moving code.
- After any refactor: run `gitnexus_detect_changes({scope: "all"})` to verify only expected files changed.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Tools Quick Reference

| Tool | When to use | Command |
|------|-------------|---------|
| `query` | Find code by concept | `gitnexus_query({query: "auth validation"})` |
| `context` | 360-degree view of one symbol | `gitnexus_context({name: "validateUser"})` |
| `impact` | Blast radius before editing | `gitnexus_impact({target: "X", direction: "upstream"})` |
| `detect_changes` | Pre-commit scope check | `gitnexus_detect_changes({scope: "staged"})` |
| `rename` | Safe multi-file rename | `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` |
| `cypher` | Custom graph queries | `gitnexus_cypher({query: "MATCH ..."})` |

## Impact Risk Levels

| Depth | Meaning | Action |
|-------|---------|--------|
| d=1 | WILL BREAK — direct callers/importers | MUST update these |
| d=2 | LIKELY AFFECTED — indirect deps | Should test |
| d=3 | MAY NEED TESTING — transitive | Test if critical path |

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/recipe-n-order/context` | Codebase overview, check index freshness |
| `gitnexus://repo/recipe-n-order/clusters` | All functional areas |
| `gitnexus://repo/recipe-n-order/processes` | All execution flows |
| `gitnexus://repo/recipe-n-order/process/{name}` | Step-by-step execution trace |

## Self-Check Before Finishing

Before completing any code modification task, verify:
1. `gitnexus_impact` was run for all modified symbols
2. No HIGH/CRITICAL risk warnings were ignored
3. `gitnexus_detect_changes()` confirms changes match expected scope
4. All d=1 (WILL BREAK) dependents were updated

## Keeping the Index Fresh

After committing code changes, the GitNexus index becomes stale. Re-run analyze to update it:

```bash
npx gitnexus analyze
```

If the index previously included embeddings, preserve them by adding `--embeddings`:

```bash
npx gitnexus analyze --embeddings
```

To check whether embeddings exist, inspect `.gitnexus/meta.json` — the `stats.embeddings` field shows the count (0 means no embeddings). **Running analyze without `--embeddings` will delete any previously generated embeddings.**

> Claude Code users: A PostToolUse hook handles this automatically after `git commit` and `git merge`.

## CLI

- Re-index: `npx gitnexus analyze`
- Check freshness: `npx gitnexus status`
- Generate docs: `npx gitnexus wiki`

<!-- gitnexus:end -->
