import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getEventByShareCode, getEventRecipes } from "@/db/queries/events"
import { getGuestOrder } from "@/db/queries/orders"

export async function GET(_: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params

  const event = await getEventByShareCode(code)
  if (!event) {
    return NextResponse.json({ error: "活动不存在" }, { status: 404 })
  }
  if (event.status === "draft") {
    return NextResponse.json({ error: "活动不存在" }, { status: 404 })
  }

  const eventRecipes = await getEventRecipes(event.id)
  const recipes = eventRecipes.map((r) => r.recipe)

  const cookieStore = await cookies()
  const guestCookie = cookieStore.get(`guest-${code}`)

  let guest: { id: number } | null = null
  let currentOrder = null

  if (guestCookie) {
    const guestId = Number(guestCookie.value)
    if (!isNaN(guestId)) {
      guest = { id: guestId }
      currentOrder = (await getGuestOrder(event.id, guestId)) ?? null
    }
  }

  return NextResponse.json({ event, recipes, guest, currentOrder })
}
