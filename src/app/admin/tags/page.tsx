"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConfirmDialog } from "@/components/admin/ConfirmDialog"
import type { Tag } from "@/db/schema"
import { Plus, Pencil, Trash2, Check, X } from "lucide-react"

const PRESET_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"]

export default function TagsPage() {
  const [tagList, setTagList] = useState<Tag[]>([])
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState("#f97316")
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("")

  useEffect(() => { loadTags() }, [])

  async function loadTags() {
    const res = await fetch("/api/tags")
    const data = await res.json()
    if (Array.isArray(data)) setTagList(data)
  }

  async function handleCreate(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      })
      if (res.ok) {
        setNewName("")
        setNewColor("#f97316")
        await loadTags()
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? "创建失败")
      }
    } finally {
      setCreating(false)
    }
  }

  function startEdit(tag: Tag) {
    setEditingId(tag.id)
    setEditName(tag.name)
    setEditColor(tag.color)
  }

  async function handleSaveEdit(id: number) {
    const res = await fetch(`/api/tags/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), color: editColor }),
    })
    if (res.ok) {
      setEditingId(null)
      await loadTags()
    } else {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error ?? "保存失败")
    }
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/tags/${id}`, { method: "DELETE" })
    if (res.ok) {
      await loadTags()
      toast.success("标签已删除")
    } else {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error ?? "删除失败")
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">标签管理</h1>

      <form onSubmit={handleCreate} className="flex gap-2 mb-8">
        <Input
          placeholder="标签名"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1"
        />
        <div className="flex gap-1 items-center">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`w-6 h-6 rounded-full border-2 ${newColor === c ? "border-gray-800" : "border-transparent"}`}
              style={{ backgroundColor: c }}
              onClick={() => setNewColor(c)}
            />
          ))}
        </div>
        <Button type="submit" disabled={creating || !newName.trim()}>
          {creating ? "添加中..." : <><Plus className="h-4 w-4 mr-1" />添加</>}
        </Button>
      </form>

      <div className="space-y-2">
        {tagList.map((tag) =>
          editingId === tag.id ? (
            <div key={tag.id} className="flex gap-2 items-center border rounded-lg p-3">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1"
                autoFocus
              />
              <div className="flex gap-1 items-center">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`w-5 h-5 rounded-full border-2 ${editColor === c ? "border-gray-800" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setEditColor(c)}
                  />
                ))}
              </div>
              <Button size="sm" onClick={() => handleSaveEdit(tag.id)} disabled={!editName.trim()}><Check className="h-3.5 w-3.5 mr-1" />保存</Button>
              <Button size="sm" variant="outline" onClick={() => setEditingId(null)}><X className="h-3.5 w-3.5 mr-1" />取消</Button>
            </div>
          ) : (
            <div key={tag.id} className="flex items-center justify-between border rounded-lg p-3">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full inline-block" style={{ backgroundColor: tag.color }} />
                <span className="font-medium">{tag.name}</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => startEdit(tag)}><Pencil className="h-3.5 w-3.5 mr-1" />编辑</Button>
                <ConfirmDialog
                  trigger={<Button type="button" size="sm" variant="outline"><Trash2 className="h-3.5 w-3.5 mr-1" />删除</Button>}
                  title="删除标签"
                  description={`确认删除标签「${tag.name}」？已使用该标签的菜谱不受影响。`}
                  confirmLabel="删除"
                  onConfirm={() => handleDelete(tag.id)}
                />
              </div>
            </div>
          )
        )}
        {tagList.length === 0 && (
          <p className="text-muted-foreground text-center py-8">还没有标签</p>
        )}
      </div>
    </div>
  )
}
