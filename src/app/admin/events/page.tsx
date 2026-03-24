import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getEvents } from "@/db/queries/events"
import { formatDate } from "@/lib/utils"

const statusLabels = { draft: "草稿", active: "进行中", closed: "已结束" }
const statusVariants = {
  draft: "secondary",
  active: "default",
  closed: "outline",
} as const

export default async function EventsPage() {
  const allEvents = await getEvents()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">聚餐活动</h1>
        <Link href="/admin/events/new">
          <Button>新建活动</Button>
        </Link>
      </div>

      <div className="space-y-3">
        {allEvents.map((event) => (
          <div key={event.id} className="border rounded-lg p-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">{event.title}</h2>
              <p className="text-sm text-muted-foreground">{formatDate(event.date)}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={statusVariants[event.status]}>
                {statusLabels[event.status]}
              </Badge>
              <Link href={`/admin/events/${event.id}`}>
                <Button variant="outline" size="sm">查看</Button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {allEvents.length === 0 && (
        <p className="text-muted-foreground text-center py-12">还没有活动</p>
      )}
    </div>
  )
}
