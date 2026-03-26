import { db } from "@/db"
import { orders, guests, recipes, eventRecipes } from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import type { Recipe, Order } from "@/db/schema"

export type GuestOrderEntry = {
  guestId: number
  guestName: string
  items: Array<{ recipeId: number; recipeTitle: string; quantity: number; note?: string }>
}

export async function getEventOrdersWithGuests(eventId: number): Promise<GuestOrderEntry[]> {
  const [orderRows, eventRecipeRows] = await Promise.all([
    db
      .select({ guestId: orders.guestId, guestName: guests.name, items: orders.items })
      .from(orders)
      .innerJoin(guests, eq(orders.guestId, guests.id))
      .where(eq(orders.eventId, eventId)),
    db
      .select({ id: recipes.id, title: recipes.title })
      .from(eventRecipes)
      .innerJoin(recipes, eq(eventRecipes.recipeId, recipes.id))
      .where(eq(eventRecipes.eventId, eventId)),
  ])

  const recipeMap = new Map(eventRecipeRows.map((r) => [r.id, r.title]))

  return orderRows
    .map((row) => ({
      guestId: row.guestId,
      guestName: row.guestName,
      items: row.items
        .filter((item) => item.quantity > 0)
        .map((item) => ({
          recipeId: item.recipeId,
          recipeTitle: recipeMap.get(item.recipeId) ?? "未知菜品",
          quantity: item.quantity,
          note: item.note,
        })),
    }))
    .filter((row) => row.items.length > 0)
}

export async function getOrdersLatestUpdate(eventId: number): Promise<string | null> {
  const result = await db
    .select({ latest: sql<string>`MAX(updated_at)` })
    .from(orders)
    .where(eq(orders.eventId, eventId))
  return result[0]?.latest ?? null
}

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
      .set({ items, updatedAt: new Date().toISOString() })
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
  recipes: string[]
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
      const key = `${ing.name}::${ing.unit}`
      const amount = Number.parseFloat(ing.amount)
      const isNumeric = !Number.isNaN(amount)
      const round2 = (n: number) => Math.round(n * 100) / 100
      const title = recipe.title ?? ""

      const existing = ingredientMap.get(key)
      if (existing) {
        if (isNumeric) {
          existing.totalAmount = round2(Number.parseFloat(existing.totalAmount) + amount * qty).toString()
        }
        if (!existing.recipes.includes(title)) existing.recipes.push(title)
      } else {
        ingredientMap.set(key, {
          name: ing.name,
          totalAmount: isNumeric ? round2(amount * qty).toString() : ing.unit,
          unit: isNumeric ? ing.unit : "",
          recipes: [title],
        })
      }
    }
  }

  return Array.from(ingredientMap.values())
}
