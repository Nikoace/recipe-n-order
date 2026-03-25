"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import type { Recipe } from "@/db/schema"
import { difficultyLabel } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import QuantityStepper from "@/components/guest/QuantityStepper"

interface OrderItem {
  recipeId: number
  quantity: number
  note?: string
}

interface CurrentOrder {
  id: number
  items: OrderItem[]
}

interface MenuOrderProps {
  shareCode: string
  eventTitle: string
  recipes: Recipe[]
  currentOrder: CurrentOrder | null
  eventStatus: "draft" | "active" | "closed"
}

export default function MenuOrder({
  shareCode,
  eventTitle,
  recipes,
  currentOrder,
  eventStatus,
}: MenuOrderProps) {
  const [quantities, setQuantities] = useState<Record<number, number>>(() => {
    if (!currentOrder) return {}
    const q: Record<number, number> = {}
    for (const item of currentOrder.items) {
      q[item.recipeId] = item.quantity
    }
    return q
  })
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<CurrentOrder | null>(currentOrder)

  const total = Object.values(quantities).reduce((sum, v) => sum + (v > 0 ? v : 0), 0)

  const handleQuantityChange = (recipeId: number, value: number) => {
    setQuantities((prev) => ({ ...prev, [recipeId]: value }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const items = Object.entries(quantities)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({ recipeId: Number(k), quantity: v }))

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareCode, items }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? "提交失败，请重试")
        return
      }

      const updatedOrder = await res.json()
      toast.success("点菜成功！")
      setOrder({ id: updatedOrder.id, items: updatedOrder.items })
    } catch {
      toast.error("网络错误，请重试")
    } finally {
      setLoading(false)
    }
  }

  const isClosed = eventStatus === "closed"

  return (
    <div className="max-w-lg mx-auto px-4 pt-4">
      <h1 className="text-xl font-bold mb-4">{eventTitle}</h1>

      {isClosed && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 mb-4">
          活动已结束，以下为你的点菜记录
        </div>
      )}

      <div className="space-y-4 pb-20">
        {recipes.map((recipe) => (
          <div key={recipe.id} className="border rounded-lg p-4 flex gap-4">
            <div className="shrink-0">
              {recipe.coverImage ? (
                <img
                  src={recipe.coverImage}
                  alt={recipe.title}
                  width={80}
                  height={80}
                  className="w-20 h-20 object-cover rounded"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                  无图片
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <Link
                href={`/e/${shareCode}/recipe/${recipe.id}`}
                className="font-semibold hover:underline block truncate"
              >
                {recipe.title}
              </Link>
              <div className="flex flex-wrap gap-1 mt-1 mb-2">
                <Badge variant="secondary">
                  {difficultyLabel(recipe.difficulty)}
                </Badge>
                {recipe.cookTime != null && (
                  <Badge variant="outline">{recipe.cookTime} 分钟</Badge>
                )}
              </div>
              <QuantityStepper
                value={quantities[recipe.id] ?? 0}
                onChange={(n) => handleQuantityChange(recipe.id, n)}
                disabled={isClosed}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <span className="text-sm text-gray-600">已选 {total} 道菜</span>
          {!isClosed && (
            <Button
              onClick={handleSubmit}
              disabled={total === 0 || loading}
            >
              {loading ? "提交中..." : order ? "更新点菜" : "提交点菜"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
