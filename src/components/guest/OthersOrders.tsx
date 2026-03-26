"use client"

import { useEffect, useState } from "react"
import type { GuestOrderEntry } from "@/db/queries/orders"

interface OthersOrdersProps {
  shareCode: string
  myGuestId: number
}

export function OthersOrders({ shareCode, myGuestId }: OthersOrdersProps) {
  const [orders, setOrders] = useState<GuestOrderEntry[]>([])

  useEffect(() => {
    const es = new EventSource(`/api/events/${shareCode}/stream`)

    es.onmessage = (e) => {
      try {
        const data: GuestOrderEntry[] = JSON.parse(e.data)
        setOrders(data)
      } catch {
        // 忽略解析失败
      }
    }

    return () => es.close()
  }, [shareCode])

  const others = orders.filter((o) => o.guestId !== myGuestId)

  if (others.length === 0) return null

  return (
    <div className="max-w-lg mx-auto px-4 pb-6">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        大家的点菜
      </h2>
      <div className="space-y-3">
        {others.map((guest) => (
          <div key={guest.guestId} className="border rounded-lg p-3 bg-gray-50">
            <p className="font-medium text-sm mb-2">{guest.guestName}</p>
            <ul className="space-y-1">
              {guest.items.map((item) => (
                <li key={item.recipeId} className="flex justify-between text-sm text-gray-700">
                  <span>{item.recipeTitle}</span>
                  <span className="text-gray-500 shrink-0 ml-2">
                    ×{item.quantity}
                    {item.note && <span className="ml-1 text-gray-400">（{item.note}）</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
