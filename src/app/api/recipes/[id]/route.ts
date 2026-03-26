import { NextRequest, NextResponse } from "next/server"
import {
  getRecipeById,
  getRecipeTags,
  updateRecipe,
  deleteRecipe,
  setRecipeTags,
  getRecipeDeleteBlockers,
} from "@/db/queries/recipes"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const numId = Number(id)
  const [recipe, tagRows] = await Promise.all([
    getRecipeById(numId),
    getRecipeTags(numId),
  ])
  if (!recipe) return NextResponse.json({ error: "未找到" }, { status: 404 })
  return NextResponse.json({ ...recipe, tags: tagRows.map((r) => r.tag) })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin()
  if (authError) return authError

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
  const authError = await requireAdmin()
  if (authError) return authError

  const { id } = await params
  const numId = Number(id)
  if (isNaN(numId)) return NextResponse.json({ error: "无效 ID" }, { status: 400 })
  const existing = await getRecipeById(numId)
  if (!existing) return NextResponse.json({ error: "未找到" }, { status: 404 })

  const blockers = await getRecipeDeleteBlockers(numId)
  if (blockers.eventCount > 0 || blockers.orderCount > 0) {
    const reasons: string[] = []
    if (blockers.eventCount > 0) reasons.push(`已被 ${blockers.eventCount} 个活动菜单引用`)
    if (blockers.orderCount > 0) reasons.push(`已有 ${blockers.orderCount} 条点菜记录`)

    return NextResponse.json(
      { error: `该菜谱${reasons.join("，")}，无法删除` },
      { status: 409 }
    )
  }

  await deleteRecipe(numId)
  return NextResponse.json({ ok: true })
}
