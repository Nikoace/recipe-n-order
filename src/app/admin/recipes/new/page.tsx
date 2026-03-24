import { db } from "@/db"
import { tags } from "@/db/schema"
import { RecipeForm } from "@/components/recipe/RecipeForm"

export default async function NewRecipePage() {
  const allTags = await db.select().from(tags)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">新建菜谱</h1>
      <RecipeForm tags={allTags} mode="create" />
    </div>
  )
}
