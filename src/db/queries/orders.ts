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
      const amount = parseFloat(ing.amount)
      if (isNaN(amount)) continue

      const total = amount * qty
      const round2 = (n: number) => Math.round(n * 100) / 100
      const existing = ingredientMap.get(ing.name)
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
