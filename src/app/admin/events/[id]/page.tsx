import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { getEventById } from "@/db/queries/events"
import { SummaryPanel } from "@/components/event/SummaryPanel"
import { EventStatusButton } from "@/components/event/EventStatusButton"
import { formatDate } from "@/lib/utils"

const statusLabels = { draft: "草稿", active: "进行中", closed: "已结束" }

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const numId = Number(id)
  if (isNaN(numId)) notFound()
  const event = await getEventById(numId)
  if (!event) notFound()

  const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/e/${event.shareCode}`

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{event.title}</h1>
          <p className="text-muted-foreground">{formatDate(event.date)}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge>{statusLabels[event.status]}</Badge>
          <EventStatusButton eventId={event.id} currentStatus={event.status} />
        </div>
      </div>

      <div className="bg-muted rounded-lg p-4 mb-6">
        <p className="text-sm font-medium mb-1">分享链接（发给朋友）</p>
        <p className="text-sm font-mono break-all">{shareUrl}</p>
      </div>

      <SummaryPanel eventId={event.id} />
    </div>
  )
}
