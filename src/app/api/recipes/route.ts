import { NextRequest, NextResponse } from "next/server"
import { getRecipes, createRecipe, setRecipeTags } from "@/db/queries/recipes"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const search = searchParams.get("search") ?? undefined
  const tagIds = searchParams.get("tags")?.split(",").map(Number).filter(Boolean)
  const data = await getRecipes(search, tagIds)
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const token = (await cookies()).get("admin-token")?.value
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

  const body = await req.json()
  const { tagIds, ...recipeData } = body
  const recipe = await createRecipe(recipeData)
  if (tagIds?.length) {
    await setRecipeTags(recipe.id, tagIds)
  }
  return NextResponse.json(recipe, { status: 201 })
}
