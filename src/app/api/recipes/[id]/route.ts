import { NextRequest, NextResponse } from "next/server"
import { getRecipeById, updateRecipe, deleteRecipe, setRecipeTags } from "@/db/queries/recipes"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const recipe = await getRecipeById(Number(id))
  if (!recipe) return NextResponse.json({ error: "未找到" }, { status: 404 })
  return NextResponse.json(recipe)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get("admin-token")?.value
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

  const { id } = await params
  const { tagIds, ...data } = await req.json()
  const recipe = await updateRecipe(Number(id), data)
  if (!recipe) return NextResponse.json({ error: "未找到" }, { status: 404 })
  if (tagIds !== undefined) {
    await setRecipeTags(Number(id), tagIds)
  }
  return NextResponse.json(recipe)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get("admin-token")?.value
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

  const { id } = await params
  const numId = Number(id)
  if (isNaN(numId)) return NextResponse.json({ error: "无效 ID" }, { status: 400 })
  const existing = await getRecipeById(numId)
  if (!existing) return NextResponse.json({ error: "未找到" }, { status: 404 })
  await deleteRecipe(numId)
  return NextResponse.json({ ok: true })
}
