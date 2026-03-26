"use client"
import { useEffect, useState, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { ShoppingList } from "./ShoppingList"
import { Users, ClipboardList } from "lucide-react"

interface SummaryData {
  guests: Array<{ id: number; name: string }>
  orders: Array<{ guestId: number; items: Array<{ recipeId: number; quantity: number; note?: string }> }>
  recipeSummary: Array<{ id: number; title: string; totalQuantity: number; servings: number }>
  shoppingList: Array<{ name: string; totalAmount: string; unit: string; recipes: string[] }>
}

export function SummaryPanel({ eventId }: { eventId: number }) {
  const [data, setData] = useState<SummaryData | null>(null)

  const fetchSummary = useCallback(async () => {
    const res = await fetch(`/api/events/${eventId}/summary`)
    if (res.ok) setData(await res.json())
  }, [eventId])

  useEffect(() => {
    fetchSummary()
    const timer = setInterval(fetchSummary, 3000)
    return () => clearInterval(timer)
  }, [eventId, fetchSummary])

  if (!data) return <p className="text-muted-foreground">加载中...</p>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold mb-2 flex items-center gap-1.5"><Users className="h-4 w-4" />参与者 ({data.guests.length}人)</h2>
        <div className="flex flex-wrap gap-2">
          {data.guests.map((g) => (
            <Badge key={g.id} variant="secondary">{g.name}</Badge>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-semibold mb-2 flex items-center gap-1.5"><ClipboardList className="h-4 w-4" />菜品汇总</h2>
        <div className="space-y-2">
          {data.recipeSummary
            .filter((r) => r.totalQuantity > 0)
            .sort((a, b) => b.totalQuantity - a.totalQuantity)
            .map((r) => (
              <div key={r.id} className="flex items-center justify-between border-b pb-2">
                <span>{r.title}</span>
                <span className="text-muted-foreground text-sm">×{r.totalQuantity}</span>
              </div>
            ))}
        </div>
      </div>

      <ShoppingList items={data.shoppingList} />
    </div>
  )
}
