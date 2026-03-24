import { NextRequest, NextResponse } from "next/server"
import { upsertOrder } from "@/db/queries/orders"
import { getEventByShareCode } from "@/db/queries/events"

export async function POST(req: NextRequest) {
  const { shareCode, items } = await req.json()

  if (!shareCode || !Array.isArray(items)) {
    return NextResponse.json({ error: "shareCode 和 items 不能为空" }, { status: 400 })
  }

  const event = await getEventByShareCode(shareCode)
  if (!event) return NextResponse.json({ error: "活动不存在" }, { status: 404 })
  if (event.status === "closed") return NextResponse.json({ error: "活动已结束" }, { status: 403 })

  const guestId = Number(req.cookies.get(`guest-${shareCode}`)?.value)
  if (!guestId) return NextResponse.json({ error: "请先加入活动" }, { status: 401 })

  const order = await upsertOrder(event.id, guestId, items)
  return NextResponse.json(order)
}
