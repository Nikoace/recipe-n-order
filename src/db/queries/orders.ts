import { db } from "@/db"
import { orders } from "@/db/schema"
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
