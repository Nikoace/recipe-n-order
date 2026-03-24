import { NextRequest, NextResponse } from "next/server"
import { getEvents, createEvent } from "@/db/queries/events"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function GET() {
  const data = await getEvents()
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const token = (await cookies()).get("admin-token")?.value
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

  const { title, date, recipeIds } = await req.json()
  if (!title || !date) {
    return NextResponse.json({ error: "活动名称和日期不能为空" }, { status: 400 })
  }
  const event = await createEvent({ title, date, recipeIds: recipeIds ?? [] })
  return NextResponse.json(event, { status: 201 })
}
