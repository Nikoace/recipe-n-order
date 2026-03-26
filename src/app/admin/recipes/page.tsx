import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { db } from "@/db"
import { tags } from "@/db/schema"
import { getRecipesWithTags } from "@/db/queries/recipes"
import { RecipeCard } from "@/components/recipe/RecipeCard"
import { RecipeSearchFilter } from "@/components/recipe/RecipeSearchFilter"
import { RecipeDeleteButton } from "@/components/admin/RecipeDeleteButton"
import { Plus, Pencil, Eye } from "lucide-react"

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; tags?: string }>
}) {
  const { search, tags: tagsParam } = await searchParams
  const tagIds = tagsParam?.split(",").map(Number).filter(Boolean)

  const [allRecipes, allTags] = await Promise.all([
    getRecipesWithTags(search, tagIds),
    db.select().from(tags).orderBy(tags.name),
  ])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">菜谱管理</h1>
        <Link href="/admin/recipes/new">
          <Button><Plus className="h-4 w-4 mr-1" />新建菜谱</Button>
        </Link>
      </div>

      <Suspense>
        <RecipeSearchFilter tags={allTags} className="mb-6" />
      </Suspense>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allRecipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            actions={
              <>
                <Link href={`/admin/recipes/${recipe.id}/edit`}>
                  <Button variant="outline" size="sm"><Pencil className="h-3.5 w-3.5 mr-1" />编辑</Button>
                </Link>
                <Link href={`/recipe/${recipe.id}`} target="_blank">
                  <Button variant="outline" size="sm"><Eye className="h-3.5 w-3.5 mr-1" />预览</Button>
                </Link>
                <RecipeDeleteButton id={recipe.id} title={recipe.title} />
              </>
            }
          />
        ))}
      </div>

      {allRecipes.length === 0 && (
        <p className="text-muted-foreground text-center py-12">
          {search || tagIds?.length ? "没有找到符合条件的菜谱" : "还没有菜谱，快去创建一个吧！"}
        </p>
      )}
    </div>
  )
}
