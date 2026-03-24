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
  const numId = Number(id)
  if (isNaN(numId)) notFound()
  const [recipe, allTags, rt] = await Promise.all([
    getRecipeById(numId),
    db.select().from(tags),
    db.select().from(recipeTags).where(eq(recipeTags.recipeId, numId)),
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
