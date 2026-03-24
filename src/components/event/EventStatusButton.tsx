"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

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
      await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={loading}>
      {loading ? "处理中..." : label}
    </Button>
  )
}
