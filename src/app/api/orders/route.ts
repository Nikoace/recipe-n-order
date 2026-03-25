import { NextRequest, NextResponse } from "next/server"
import { upsertOrder } from "@/db/queries/orders"
import { getGuestEvent } from "@/lib/guest-event-access"

export async function POST(req: NextRequest) {
  const { shareCode, items } = await req.json()

  if (!shareCode || !Array.isArray(items)) {
    return NextResponse.json({ error: "shareCode 和 items 不能为空" }, { status: 400 })
  }
  if (!items.every((i: unknown) =>
    typeof i === "object" && i !== null &&
    Number.isInteger((i as { recipeId: number }).recipeId) && (i as { recipeId: number }).recipeId > 0 &&
    Number.isInteger((i as { quantity: number }).quantity) && (i as { quantity: number }).quantity > 0
  )) {
    return NextResponse.json({ error: "items 格式不合法" }, { status: 400 })
  }

  const access = await getGuestEvent(shareCode, "order")
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }
  const event = access.event

  const guestId = Number(req.cookies.get(`guest-${shareCode}`)?.value)
  if (!guestId) return NextResponse.json({ error: "请先加入活动" }, { status: 401 })

  const order = await upsertOrder(event.id, guestId, items)
  return NextResponse.json(order)
}
