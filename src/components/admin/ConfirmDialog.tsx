"use client"

import { cloneElement, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ConfirmDialogProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trigger: React.ReactElement<any>
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => Promise<void>
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "确认",
  onConfirm,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    try {
      await onConfirm()
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const triggerEl = cloneElement(trigger, {
    onClick: (e: React.MouseEvent) => {
      e.preventDefault()
      setOpen(true)
    },
  })

  return (
    <>
      {triggerEl}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              取消
            </Button>
            <Button type="button" variant="destructive" onClick={handleConfirm} disabled={loading}>
              {loading ? "处理中..." : confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
