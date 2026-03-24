"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface Step {
  order: number
  content: string
  imageUrl?: string
}

interface Props {
  value: Step[]
  onChange: (v: Step[]) => void
  onImageUpload: (file: File) => Promise<string>
}

export function StepEditor({ value, onChange, onImageUpload }: Props) {
  const [uploading, setUploading] = useState<number | null>(null)

  function add() {
    onChange([...value, { order: value.length + 1, content: "" }])
  }

  function update(i: number, field: keyof Step, val: string) {
    const next = [...value]
    next[i] = { ...next[i], [field]: val }
    onChange(next)
  }

  function remove(i: number) {
    const next = value.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, order: idx + 1 }))
    onChange(next)
  }

  async function handleImageChange(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(i)
    try {
      const url = await onImageUpload(file)
      update(i, "imageUrl", url)
    } finally {
      setUploading(null)
    }
  }

  return (
    <div className="space-y-4">
      {value.map((step, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">步骤 {i + 1}</span>
            <Button variant="ghost" size="sm" onClick={() => remove(i)}>删除</Button>
          </div>
          <Textarea
            placeholder="步骤描述..."
            value={step.content}
            onChange={(e) => update(i, "content", e.target.value)}
            rows={3}
          />
          {step.imageUrl && (
            <img src={step.imageUrl} alt="" className="max-h-40 rounded object-cover" />
          )}
          <div>
            <label className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
              {uploading === i ? "上传中..." : "上传步骤图片"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageChange(i, e)}
                disabled={uploading !== null}
              />
            </label>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add} type="button">
        + 添加步骤
      </Button>
    </div>
  )
}
