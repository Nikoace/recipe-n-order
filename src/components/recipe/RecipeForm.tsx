"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IngredientsEditor } from "./IngredientsEditor"
import { StepEditor } from "./StepEditor"
import type { Recipe, Tag } from "@/db/schema"

interface Props {
  recipe?: Recipe
  tags: Tag[]
  selectedTagIds?: number[]
  mode: "create" | "edit"
}

export function RecipeForm({ recipe, tags, selectedTagIds = [], mode }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [coverPreview, setCoverPreview] = useState(recipe?.coverImage ?? "")
  const [ingredients, setIngredients] = useState(recipe?.ingredients ?? [])
  const [steps, setSteps] = useState(recipe?.steps ?? [])
  const [selectedTags, setSelectedTags] = useState<number[]>(selectedTagIds)

  async function uploadFile(file: File, folder: string): Promise<string> {
    const fd = new FormData()
    fd.append("file", file)
    fd.append("folder", folder)
    const res = await fetch("/api/upload", { method: "POST", body: fd })
    if (!res.ok) throw new Error("图片上传失败")
    const { url } = await res.json()
    return url
  }

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const url = await uploadFile(file, "covers")
      setCoverPreview(url)
    } catch {
      setError("封面图片上传失败，请重试")
    }
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const form = new FormData(e.currentTarget)

      const body = {
        title: form.get("title") as string,
        description: form.get("description") as string,
        difficulty: form.get("difficulty") as string,
        cookTime: Number(form.get("cookTime")),
        servings: Number(form.get("servings")),
        coverImage: coverPreview,
        ingredients,
        steps,
        tagIds: selectedTags,
      }

      const url = mode === "create" ? "/api/recipes" : `/api/recipes/${recipe!.id}`
      const method = mode === "create" ? "POST" : "PATCH"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        router.push("/admin/recipes")
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "保存失败，请重试")
      }
    } catch {
      setError("网络错误，请重试")
    } finally {
      setLoading(false)
    }
  }

  function toggleTag(id: number) {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div>
        <Label>菜名 *</Label>
        <Input name="title" defaultValue={recipe?.title} required />
      </div>

      <div>
        <Label>简介</Label>
        <Textarea name="description" defaultValue={recipe?.description ?? ""} rows={3} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>难度</Label>
          <Select name="difficulty" defaultValue={recipe?.difficulty ?? "medium"} items={{ easy: "简单", medium: "中等", hard: "困难" }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">简单</SelectItem>
              <SelectItem value="medium">中等</SelectItem>
              <SelectItem value="hard">困难</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>烹饪时间（分钟）</Label>
          <Input name="cookTime" type="number" defaultValue={recipe?.cookTime ?? 30} />
        </div>
        <div>
          <Label>几人份 *</Label>
          <Input name="servings" type="number" defaultValue={recipe?.servings ?? 2} required />
        </div>
      </div>

      <div>
        <Label>封面图片</Label>
        {coverPreview && (
          <img src={coverPreview} alt="封面" className="mb-2 max-h-48 rounded object-cover" />
        )}
        <Input type="file" accept="image/*" onChange={handleCoverChange} />
      </div>

      <div>
        <Label>标签</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                selectedTags.includes(tag.id)
                  ? "bg-orange-500 text-white border-orange-500"
                  : "border-gray-300"
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>食材</Label>
        <IngredientsEditor value={ingredients} onChange={setIngredients} />
      </div>

      <div>
        <Label>制作步骤</Label>
        <StepEditor
          value={steps}
          onChange={setSteps}
          onImageUpload={(file) => uploadFile(file, "steps")}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "保存中..." : mode === "create" ? "创建菜谱" : "保存修改"}
      </Button>
    </form>
  )
}
