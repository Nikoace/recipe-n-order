import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { getEventByShareCode } from "@/db/queries/events"
import JoinForm from "@/components/guest/JoinForm"

export default async function EventEntryPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const cookieStore = await cookies()

  const event = await getEventByShareCode(code)

  if (!event || event.status === "draft") {
    notFound()
  }

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
