// src/db/schema.ts
import { sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

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
  cookTime: integer("cook_time"),
  servings: integer("servings").notNull().default(2),
  ingredients: text("ingredients", { mode: "json" }).$type<
    Array<{ name: string; amount: string; unit: string }>
  >().notNull().default(sql`'[]'`),
  steps: text("steps", { mode: "json" }).$type<
    Array<{ order: number; content: string; imageUrl?: string }>
  >().notNull().default(sql`'[]'`),
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
  date: text("date").notNull(),
  shareCode: text("share_code").notNull().unique(),
  status: text("status", { enum: ["draft", "active", "closed"] }).notNull().default("draft"),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
})

// 活动-菜谱 多对多
export const eventRecipes = sqliteTable("event_recipes", {
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  recipeId: integer("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
})

// 访客
export const guests = sqliteTable("guests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  avatar: text("avatar"),
  note: text("note"),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
})

// 点菜记录
export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  guestId: integer("guest_id").notNull().references(() => guests.id, { onDelete: "cascade" }),
  items: text("items", { mode: "json" }).$type<
    Array<{ recipeId: number; quantity: number; note?: string }>
  >().notNull().default(sql`'[]'`),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
})

// 类型导出
export type Recipe = typeof recipes.$inferSelect
export type NewRecipe = typeof recipes.$inferInsert
export type Tag = typeof tags.$inferSelect
export type Event = typeof events.$inferSelect
export type Guest = typeof guests.$inferSelect
export type Order = typeof orders.$inferSelect
