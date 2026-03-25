import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { getEventByShareCode, getEventRecipes } from "@/db/queries/events"
import { getGuestOrder } from "@/db/queries/orders"
import MenuOrder from "@/components/guest/MenuOrder"

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

  const event = await getEventByShareCode(code)
  if (!event || event.status === "draft") {
    notFound()
  }

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
    />
  )
}
