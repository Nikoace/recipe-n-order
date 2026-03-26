"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Play, Square } from "lucide-react"

interface Props {
  eventId: number
  currentStatus: "draft" | "active" | "closed"
}

export function EventStatusButton({ eventId, currentStatus }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (currentStatus === "closed") return null

  const nextStatus = currentStatus === "active" ? "closed" : "active"
  const label = currentStatus === "active" ? "结束活动" : "开始活动"

  async function handleClick() {
    setLoading(true)
    try {
      await fetch(`/api/events/admin/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const icon = currentStatus === "active"
    ? <Square className="h-3.5 w-3.5 mr-1" />
    : <Play className="h-3.5 w-3.5 mr-1" />

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={loading}>
      {loading ? "处理中..." : <>{icon}{label}</>}
    </Button>
  )
}
