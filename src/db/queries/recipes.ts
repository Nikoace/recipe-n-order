import { db } from "@/db"
import { recipes, tags, recipeTags, eventRecipes, orders } from "@/db/schema"
import { eq, inArray } from "drizzle-orm"
import type { Order } from "@/db/schema"

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

export interface RecipeDeleteBlockers {
  eventCount: number
  orderCount: number
}

/**
 * Counts how many persisted references would be broken by deleting a recipe.
 *
 * `eventCount` tracks menu bindings in `event_recipes`, while `orderCount`
 * tracks historical order rows whose JSON payload still includes the recipe.
 */
export function countRecipeDeleteBlockers(
  recipeId: number,
  eventRows: Array<{ recipeId: number }>,
  orderRows: Array<Pick<Order, "items">>
): RecipeDeleteBlockers {
  const eventCount = eventRows.filter((row) => row.recipeId === recipeId).length
  const orderCount = orderRows.filter((order) =>
    order.items.some((item) => item.recipeId === recipeId)
  ).length

  return { eventCount, orderCount }
}

/**
 * Collects the deletion blockers for a recipe from both relational links and
 * JSON order payloads so the API layer can reject unsafe deletes.
 */
export async function getRecipeDeleteBlockers(recipeId: number): Promise<RecipeDeleteBlockers> {
  const [eventRows, orderRows] = await Promise.all([
    db
      .select({ recipeId: eventRecipes.recipeId })
      .from(eventRecipes)
      .where(eq(eventRecipes.recipeId, recipeId)),
    db.select({ items: orders.items }).from(orders),
  ])

  return countRecipeDeleteBlockers(recipeId, eventRows, orderRows)
}

export async function setRecipeTags(recipeId: number, tagIds: number[]) {
  await db.delete(recipeTags).where(eq(recipeTags.recipeId, recipeId))
  if (tagIds.length) {
    await db.insert(recipeTags).values(tagIds.map((tagId) => ({ recipeId, tagId })))
  }
}
