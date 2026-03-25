import { notFound } from "next/navigation"
import Link from "next/link"
import { getRecipeById } from "@/db/queries/recipes"
import { Badge } from "@/components/ui/badge"
import { difficultyLabel } from "@/lib/utils"

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ code: string; id: string }>
}) {
  const { code, id } = await params
  const recipe = await getRecipeById(Number(id))

  if (!recipe) {
    notFound()
  }

  return (
    <div className="max-w-lg mx-auto pb-8">
      <div className="mb-4">
        <Link href={`/e/${code}/menu`} className="text-orange-500 hover:underline">
          ← 返回菜单
        </Link>
      </div>

      {recipe.coverImage && (
        <img
          src={recipe.coverImage}
          alt={recipe.title}
          className="w-full object-cover rounded-lg"
          style={{ maxHeight: "240px" }}
        />
      )}

      <h1 className="text-2xl font-bold mt-4">{recipe.title}</h1>

      <div className="flex flex-wrap gap-2 mt-3">
        <Badge variant="secondary">{difficultyLabel(recipe.difficulty)}</Badge>
        {recipe.cookTime && (
          <Badge variant="outline">{recipe.cookTime} 分钟</Badge>
        )}
        {recipe.servings && (
          <Badge variant="outline">{recipe.servings} 人份</Badge>
        )}
      </div>

      {recipe.description && (
        <p className="text-gray-600 mt-2">{recipe.description}</p>
      )}

      {recipe.ingredients?.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mt-6 mb-2">食材</h2>
          <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index} className="flex justify-between px-4 py-2 bg-white">
                <span>{ingredient.name}</span>
                <span className="text-gray-500">
                  {ingredient.amount} {ingredient.unit}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {recipe.steps?.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mt-6 mb-2">步骤</h2>
          <ol className="space-y-4">
            {recipe.steps.map((step) => (
              <li key={step.order} className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-medium">
                  {step.order}
                </span>
                <div className="flex-1">
                  <p>{step.content}</p>
                  {step.imageUrl && (
                    <img
                      src={step.imageUrl}
                      alt={`步骤 ${step.order}`}
                      className="mt-2 w-full rounded-lg object-cover"
                    />
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}
