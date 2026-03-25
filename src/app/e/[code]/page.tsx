import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import JoinForm from "@/components/guest/JoinForm"
import { getGuestEvent } from "@/lib/guest-event-access"

export default async function EventEntryPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const cookieStore = await cookies()

  const access = await getGuestEvent(code, "view")
  if (!access.ok) {
    notFound()
  }
  const event = access.event

  const guestCookie = cookieStore.get(`guest-${code}`)
  if (guestCookie) {
    redirect(`/e/${code}/menu`)
  }

  return (
    <JoinForm
      shareCode={code}
      eventTitle={event.title}
      eventDate={event.date}
      isClosed={event.status === "closed"}
    />
  )
}
