import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { getEventRecipes } from "@/db/queries/events"
import { getGuestOrder } from "@/db/queries/orders"
import MenuOrder from "@/components/guest/MenuOrder"
import { getGuestEvent } from "@/lib/guest-event-access"

export default async function MenuPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const cookieStore = await cookies()

  const guestCookie = cookieStore.get(`guest-${code}`)
  if (!guestCookie) {
    redirect(`/e/${code}`)
  }

  const guestId = Number(guestCookie.value)
  if (isNaN(guestId)) {
    redirect(`/e/${code}`)
  }

  const access = await getGuestEvent(code, "view")
  if (!access.ok) {
    notFound()
  }
  const event = access.event

  const eventRecipes = await getEventRecipes(event.id)
  const recipes = eventRecipes.map((r) => r.recipe)

  const order = await getGuestOrder(event.id, guestId)

  return (
    <MenuOrder
      shareCode={code}
      eventTitle={event.title}
      recipes={recipes}
      currentOrder={order ?? null}
      eventStatus={event.status}
      guestId={guestId}
    />
  )
}
