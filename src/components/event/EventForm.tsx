"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Recipe } from "@/db/schema"

interface EventFormProps {
  mode: "create" | "edit"
  eventId?: number
  defaultTitle?: string
  defaultDate?: string
  defaultRecipeIds?: number[]
}

export function EventForm({
  mode,
  eventId,
  defaultTitle = "",
  defaultDate = "",
  defaultRecipeIds = [],
}: EventFormProps) {
  const router = useRouter()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [selectedRecipes, setSelectedRecipes] = useState<number[]>(defaultRecipeIds)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/recipes")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setRecipes(data) })
      .catch(() => {})
  }, [])

  function toggle(id: number) {
    setSelectedRecipes((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const form = new FormData(e.currentTarget)
      const body = {
        title: form.get("title"),
        date: form.get("date"),
        recipeIds: selectedRecipes,
      }
      const res = await fetch(
        mode === "create" ? "/api/events" : `/api/events/admin/${eventId}`,
        {
          method: mode === "create" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      )
      if (res.ok) {
        router.push("/admin/events")
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? (mode === "create" ? "创建失败，请重试" : "保存失败，请重试"))
      }
    } catch {
      setError("网络错误，请重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label>活动名称 *</Label>
        <Input name="title" required placeholder="例：周末家庭聚餐" defaultValue={defaultTitle} />
      </div>
      <div>
        <Label>日期 *</Label>
        <Input name="date" type="date" required defaultValue={defaultDate} />
      </div>
      <div>
        <Label>选择菜单（可多选）</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {recipes.map((recipe) => (
            <button
              key={recipe.id}
              type="button"
              onClick={() => toggle(recipe.id)}
              className={`p-3 border rounded-lg text-left transition-colors ${
                selectedRecipes.includes(recipe.id)
                  ? "border-orange-500 bg-orange-50"
                  : "hover:border-gray-400"
              }`}
            >
              <p className="font-medium">{recipe.title}</p>
              <p className="text-sm text-muted-foreground">{recipe.servings}人份</p>
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? (mode === "create" ? "创建中..." : "保存中...") : (mode === "create" ? "创建活动" : "保存")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          取消
        </Button>
      </div>
    </form>
  )
}
