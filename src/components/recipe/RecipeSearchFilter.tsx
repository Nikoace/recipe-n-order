"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Tag } from "@/db/schema"

interface RecipeSearchFilterProps {
  tags: Tag[]
  className?: string
}

export function RecipeSearchFilter({ tags, className }: RecipeSearchFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentSearch = searchParams.get("search") ?? ""
  const currentTags = searchParams.get("tags")?.split(",").map(Number).filter(Boolean) ?? []

  const [inputValue, setInputValue] = useState(currentSearch)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync input value when URL changes (e.g. browser back/forward)
  useEffect(() => {
    setInputValue(searchParams.get("search") ?? "")
  }, [searchParams])

  const buildUrl = useCallback(
    (search: string, tagIds: number[]) => {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (tagIds.length) params.set("tags", tagIds.join(","))
      const qs = params.toString()
      return qs ? `?${qs}` : "?"
    },
    []
  )

  const handleSearchChange = (value: string) => {
    setInputValue(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      router.replace(buildUrl(value, currentTags))
    }, 300)
  }

  const toggleTag = (tagId: number) => {
    const next = currentTags.includes(tagId)
      ? currentTags.filter((id) => id !== tagId)
      : [...currentTags, tagId]
    router.replace(buildUrl(currentSearch, next))
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="search"
          placeholder="搜索菜谱..."
          value={inputValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
        />
      </div>

      {/* 标签筛选 */}
      {tags.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {tags.map((tag) => {
            const active = currentTags.includes(tag.id)
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                  active
                    ? "border-transparent text-white"
                    : "bg-transparent border-gray-200 text-gray-600 hover:border-gray-300"
                )}
                style={active ? { backgroundColor: tag.color, borderColor: tag.color } : {}}
              >
                {tag.name}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
