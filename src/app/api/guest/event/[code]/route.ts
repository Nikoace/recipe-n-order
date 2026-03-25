import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getEventRecipes } from "@/db/queries/events"
import { getGuestOrder } from "@/db/queries/orders"
import { getGuestEvent } from "@/lib/guest-event-access"

export async function GET(_: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params

  const access = await getGuestEvent(code, "view")
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }
  const event = access.event

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
