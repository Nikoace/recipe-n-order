import { NextRequest, NextResponse } from "next/server"
import { getEventById, getEventRecipes } from "@/db/queries/events"
import { getOrdersByEvent, calculateShoppingList } from "@/db/queries/orders"
import { db } from "@/db"
import { guests } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const eventId = Number(id)
  if (isNaN(eventId)) return NextResponse.json({ error: "无效 ID" }, { status: 400 })

  const [event, eventRecipeRows, allOrders, allGuests] = await Promise.all([
    getEventById(eventId),
    getEventRecipes(eventId),
    getOrdersByEvent(eventId),
    db.select().from(guests).where(eq(guests.eventId, eventId)),
  ])

  if (!event) return NextResponse.json({ error: "未找到" }, { status: 404 })

  const recipeList = eventRecipeRows.map((r) => r.recipe)
  const shoppingList = calculateShoppingList(recipeList, allOrders)

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
