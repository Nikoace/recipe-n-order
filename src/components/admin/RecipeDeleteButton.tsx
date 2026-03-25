"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "./ConfirmDialog"

export function RecipeDeleteButton({ id, title }: { id: number; title: string }) {
  const router = useRouter()

  async function handleDelete() {
    const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("菜谱已删除")
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error ?? "删除失败")
    }
  }

  return (
    <ConfirmDialog
      trigger={<Button type="button" variant="outline" size="sm">删除</Button>}
      title="删除菜谱"
      description={`确认删除「${title}」？若已被活动或点菜记录引用，将无法删除。`}
      confirmLabel="删除"
      onConfirm={handleDelete}
    />
  )
}
