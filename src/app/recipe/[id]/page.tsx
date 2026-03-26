import { notFound } from "next/navigation"
import { getRecipeById, getRecipeTags } from "@/db/queries/recipes"
import { RecipeDetail } from "@/components/recipe/RecipeDetail"

export default async function PublicRecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const numId = Number(id)

  const [recipe, tagRows] = await Promise.all([
    getRecipeById(numId),
    getRecipeTags(numId),
  ])

  if (!recipe) {
    notFound()
  }

  return (
    <div className="px-4 py-6">
      <RecipeDetail
        recipe={recipe}
        tags={tagRows.map((r) => r.tag)}
        backLink={{ href: "/", label: "返回首页" }}
      />
    </div>
  )
}
