"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatDate } from "@/lib/utils"

interface JoinFormProps {
  shareCode: string
  eventTitle: string
  eventDate: string
  isClosed?: boolean
}

export default function JoinForm({ shareCode, eventTitle, eventDate, isClosed }: JoinFormProps) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/guest/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareCode, name }),
      })
      if (res.ok) {
        router.push(`/e/${shareCode}/menu`)
      } else {
        const data = await res.json()
        setError(data.error ?? "加入失败，请重试")
      }
    } catch {
      setError("网络错误，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{eventTitle}</h1>
        <p className="text-muted-foreground mt-1">{formatDate(eventDate)}</p>
      </div>

      {isClosed && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800 text-sm">
          此活动已结束，仅供查看
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="name">你的昵称</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="输入昵称加入活动"
            required
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading || isClosed}>
          {loading ? "加入中..." : "加入活动"}
        </Button>
      </form>
    </div>
  )
}
