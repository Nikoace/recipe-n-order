import { Suspense } from "react"
import { db } from "@/db"
import { tags } from "@/db/schema"
import { getRecipesWithTags } from "@/db/queries/recipes"
import { RecipeCard } from "@/components/recipe/RecipeCard"
import { RecipeSearchFilter } from "@/components/recipe/RecipeSearchFilter"

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; tags?: string }>
}) {
  const { search, tags: tagsParam } = await searchParams
  const tagIds = tagsParam?.split(",").map(Number).filter(Boolean)

  const [recipes, allTags] = await Promise.all([
    getRecipesWithTags(search, tagIds),
    db.select().from(tags).orderBy(tags.name),
  ])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero section */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-orange-500">Recipe &amp; Order</h1>
        <p className="mt-2 text-gray-600">记录家常菜谱，轻松组织聚餐点菜</p>
      </div>

      {/* Search & filter */}
      <Suspense>
        <RecipeSearchFilter tags={allTags} className="mb-6" />
      </Suspense>

      {/* Recipe grid */}
      {recipes.length === 0 ? (
        <div className="text-center text-gray-400 py-16">
          {search || tagIds?.length ? "没有找到符合条件的菜谱" : "暂无菜谱"}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              href={`/recipe/${recipe.id}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
