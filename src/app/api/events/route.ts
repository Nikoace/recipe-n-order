import { NextRequest, NextResponse } from "next/server"
import { getEvents, createEvent } from "@/db/queries/events"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET() {
  const authError = await requireAdmin()
  if (authError) return authError

  const data = await getEvents()
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin()
  if (authError) return authError

  const { title, date, recipeIds } = await req.json()
  if (!title || !date) {
    return NextResponse.json({ error: "活动名称和日期不能为空" }, { status: 400 })
  }
  const event = await createEvent({ title, date, recipeIds: recipeIds ?? [] })
  return NextResponse.json(event, { status: 201 })
}
