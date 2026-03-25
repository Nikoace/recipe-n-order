import { getRecipes } from "@/db/queries/recipes"
import { difficultyLabel } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export default async function Home() {
  const recipes = await getRecipes()

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero section */}
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold text-orange-500">Recipe &amp; Order</h1>
        <p className="mt-2 text-gray-600">记录家常菜谱，轻松组织聚餐点菜</p>
      </div>

      {/* Recipe showcase grid */}
      {recipes.length === 0 ? (
        <div className="text-center text-gray-400">暂无菜谱</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="border rounded-lg overflow-hidden shadow-sm"
            >
              {recipe.coverImage ? (
                <img
                  src={recipe.coverImage}
                  alt={recipe.title}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-orange-50 flex items-center justify-center">
                  <span className="text-4xl">🍽</span>
                </div>
              )}
              <div className="p-4">
                <h2 className="font-semibold text-lg">{recipe.title}</h2>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <Badge variant="secondary">
                    {difficultyLabel(recipe.difficulty)}
                  </Badge>
                  {recipe.cookTime != null && (
                    <Badge variant="outline">{recipe.cookTime} 分钟</Badge>
                  )}
                </div>
                {recipe.description && (
                  <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                    {recipe.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
