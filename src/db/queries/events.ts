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
