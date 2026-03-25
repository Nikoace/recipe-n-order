import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { tags } from "@/db/schema"
import { eq } from "drizzle-orm"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

async function requireAdmin() {
  const token = (await cookies()).get("admin-token")?.value
  if (!token || !(await verifyToken(token))) return false
  return true
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "未授权" }, { status: 401 })

  const { id } = await params
  const numId = Number(id)
  if (isNaN(numId)) return NextResponse.json({ error: "无效 ID" }, { status: 400 })

  const { name, color } = await req.json()
  const [tag] = await db.update(tags).set({ name, color }).where(eq(tags.id, numId)).returning()
  if (!tag) return NextResponse.json({ error: "未找到" }, { status: 404 })
  return NextResponse.json(tag)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "未授权" }, { status: 401 })

  const { id } = await params
  const numId = Number(id)
  if (isNaN(numId)) return NextResponse.json({ error: "无效 ID" }, { status: 400 })

  const [tag] = await db.delete(tags).where(eq(tags.id, numId)).returning()
  if (!tag) return NextResponse.json({ error: "未找到" }, { status: 404 })
  return NextResponse.json({ ok: true })
}
