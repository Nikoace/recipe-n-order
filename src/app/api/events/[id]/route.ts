import { NextRequest, NextResponse } from "next/server"
import { getEventById, updateEventStatus } from "@/db/queries/events"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const numId = Number(id)
  if (isNaN(numId)) return NextResponse.json({ error: "无效 ID" }, { status: 400 })
  const event = await getEventById(numId)
  if (!event) return NextResponse.json({ error: "未找到" }, { status: 404 })
  return NextResponse.json(event)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get("admin-token")?.value
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

  const { id } = await params
  const numId = Number(id)
  if (isNaN(numId)) return NextResponse.json({ error: "无效 ID" }, { status: 400 })
  const { status } = await req.json()
  const event = await updateEventStatus(numId, status)
  if (!event) return NextResponse.json({ error: "未找到" }, { status: 404 })
  return NextResponse.json(event)
}
