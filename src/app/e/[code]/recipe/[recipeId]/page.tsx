import { notFound } from "next/navigation"
import { getRecipeById, getRecipeTags } from "@/db/queries/recipes"
import { RecipeDetail } from "@/components/recipe/RecipeDetail"

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ code: string; recipeId: string }>
}) {
  const { code, recipeId } = await params
  const [recipe, tagRows] = await Promise.all([
    getRecipeById(Number(recipeId)),
    getRecipeTags(Number(recipeId)),
  ])

  if (!recipe) {
    notFound()
  }

  return (
    <RecipeDetail
      recipe={recipe}
      tags={tagRows.map((r) => r.tag)}
      backLink={{ href: `/e/${code}/menu`, label: "返回菜单" }}
    />
  )
}
