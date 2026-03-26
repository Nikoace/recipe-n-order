"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "./ConfirmDialog"
import { Trash2 } from "lucide-react"

export function EventDeleteButton({ id, title }: { id: number; title: string }) {
  const router = useRouter()

  async function handleDelete() {
    const res = await fetch(`/api/events/admin/${id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("活动已删除")
      router.push("/admin/events")
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error ?? "删除失败")
    }
  }

  return (
    <ConfirmDialog
      trigger={<Button type="button" variant="outline" size="sm"><Trash2 className="h-3.5 w-3.5 mr-1" />删除活动</Button>}
      title="删除活动"
      description={`确认删除「${title}」？相关点菜记录也将一并删除，此操作不可撤销。`}
      confirmLabel="删除"
      onConfirm={handleDelete}
    />
  )
}
