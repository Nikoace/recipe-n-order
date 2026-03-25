# Recipe & Order

聚餐点菜系统。管理员管理菜谱和活动，通过分享链接让访客浏览菜谱并点菜。

## 功能

- 菜谱管理（增删改查、标签、难度、食材、步骤）
- 聚餐活动管理（创建活动、关联菜谱、发布分享链接）
- 访客点菜（扫码/访问分享链接、填写姓名、浏览菜谱、提交点菜）
- 活动汇总（查看所有访客点菜情况）

## 技术栈

- Next.js + TypeScript
- Drizzle ORM + SQLite (Turso/libsql)
- Tailwind CSS
- jose (JWT)、bcrypt（密码哈希）

## 开发

```bash
npm install
npm run dev
```

### 环境变量

复制 `.env.local.example` 为 `.env.local` 并按需修改：

```bash
cp .env.local.example .env.local
```

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | SQLite/Turso 数据库地址 | - |
| `DATABASE_AUTH_TOKEN` | Turso 认证 token（远程时需要） | - |
| `JWT_SECRET` | JWT 签名密钥（至少 32 位） | dev-secret |
| `ADMIN_USERNAME` | 管理员用户名 | admin |
| `ADMIN_PASSWORD` | 管理员密码 | changeme123 |

### 数据库初始化

```bash
# 推送 schema
npm run db:push

# 初始化管理员（会更新已有管理员的密码）
npm run db:init-admin
```

## 使用流程

1. 登录管理后台 `/admin`
2. 添加菜谱
3. 创建聚餐活动，关联菜谱，将状态改为「发布」
4. 复制分享链接发给访客
5. 访客填写姓名后可浏览菜谱、提交点菜
6. 在活动详情页查看汇总
