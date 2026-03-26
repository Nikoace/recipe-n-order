"use client"

import { Button } from "@/components/ui/button"
import { Minus, Plus } from "lucide-react"

interface QuantityStepperProps {
  value: number
  onChange: (n: number) => void
  min?: number
  disabled?: boolean
}

export default function QuantityStepper({
  value,
  onChange,
  min,
  disabled,
}: QuantityStepperProps) {
  const minimum = min ?? 0

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= minimum || disabled}
        aria-label="减少数量"
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <span className="min-w-[1ch] text-center">{value}</span>
      <Button
        variant="outline"
        size="sm"
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={disabled}
        aria-label="增加数量"
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
