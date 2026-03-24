import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getRecipes } from "@/db/queries/recipes"
import { difficultyLabel } from "@/lib/utils"

export default async function RecipesPage() {
  const allRecipes = await getRecipes()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">菜谱管理</h1>
        <Link href="/admin/recipes/new">
          <Button>新建菜谱</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allRecipes.map((recipe) => (
          <div key={recipe.id} className="border rounded-lg overflow-hidden">
            {recipe.coverImage && (
              <img src={recipe.coverImage} alt={recipe.title} className="w-full h-40 object-cover" />
            )}
            <div className="p-4">
              <h2 className="font-semibold">{recipe.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {difficultyLabel(recipe.difficulty)} · {recipe.cookTime}分钟 · {recipe.servings}人份
              </p>
              <div className="flex gap-2 mt-3">
                <Link href={`/admin/recipes/${recipe.id}/edit`}>
                  <Button variant="outline" size="sm">编辑</Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {allRecipes.length === 0 && (
        <p className="text-muted-foreground text-center py-12">还没有菜谱，快去创建一个吧！</p>
      )}
    </div>
  )
}
