"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const PRESET_UNITS = ["g", "kg", "ml", "L", "个", "只", "条", "块", "片", "根", "把", "勺", "碗", "杯", "适量", "少许"]
const NO_AMOUNT_UNITS = new Set(["适量", "少许"])
const CUSTOM_VALUE = "__custom__"

interface Ingredient {
  name: string
  amount: string
  unit: string
}

interface Props {
  value: Ingredient[]
  onChange: (v: Ingredient[]) => void
}

export function IngredientsEditor({ value, onChange }: Props) {
  function add() {
    onChange([...value, { name: "", amount: "", unit: "g" }])
  }

  function update(i: number, field: keyof Ingredient, val: string) {
    const next = [...value]
    next[i] = { ...next[i], [field]: val }
    onChange(next)
  }

  function updateUnit(i: number, val: string) {
    const next = [...value]
    if (val === CUSTOM_VALUE) {
      next[i] = { ...next[i], unit: "" }
    } else {
      next[i] = { ...next[i], unit: val }
      if (NO_AMOUNT_UNITS.has(val)) {
        next[i].amount = ""
      }
    }
    onChange(next)
  }

  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i))
  }

  return (
    <div className="space-y-2">
      {value.map((ing, i) => {
        const isPreset = PRESET_UNITS.includes(ing.unit)
        const selectValue = isPreset ? ing.unit : CUSTOM_VALUE
        const noAmount = NO_AMOUNT_UNITS.has(ing.unit)

        return (
          <div key={i} className="flex gap-2">
            <Input
              placeholder="食材名"
              value={ing.name}
              onChange={(e) => update(i, "name", e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="用量"
              value={ing.amount}
              onChange={(e) => update(i, "amount", e.target.value)}
              className="w-20"
              disabled={noAmount}
            />
            <Select value={selectValue} onValueChange={(v) => { if (v) updateUnit(i, v) }}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="单位" />
              </SelectTrigger>
              <SelectContent>
                {PRESET_UNITS.map((u) => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
                <SelectItem value={CUSTOM_VALUE}>自定义…</SelectItem>
              </SelectContent>
            </Select>
            {selectValue === CUSTOM_VALUE && (
              <Input
                placeholder="单位"
                value={ing.unit}
                onChange={(e) => update(i, "unit", e.target.value)}
                className="w-20"
                autoFocus
              />
            )}
            <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)}>删除</Button>
          </div>
        )
      })}
      <Button variant="outline" size="sm" onClick={add} type="button">
        + 添加食材
      </Button>
    </div>
  )
}
