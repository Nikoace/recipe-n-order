import { NextRequest, NextResponse } from "next/server"
import { getRecipes, createRecipe, setRecipeTags } from "@/db/queries/recipes"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const search = searchParams.get("search") ?? undefined
  const tagIds = searchParams.get("tags")?.split(",").map(Number).filter(Boolean)
  const data = await getRecipes(search, tagIds)
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin()
  if (authError) return authError

  const body = await req.json()
  if (!body.title || typeof body.title !== "string") {
    return NextResponse.json({ error: "标题不能为空" }, { status: 400 })
  }
  const { tagIds, ...recipeData } = body
  const recipe = await createRecipe(recipeData)
  if (tagIds?.length) {
    await setRecipeTags(recipe.id, tagIds)
  }
  return NextResponse.json(recipe, { status: 201 })
}
