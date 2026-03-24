"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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

  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i))
  }

  return (
    <div className="space-y-2">
      {value.map((ing, i) => (
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
          />
          <Input
            placeholder="单位"
            value={ing.unit}
            onChange={(e) => update(i, "unit", e.target.value)}
            className="w-20"
          />
          <Button variant="ghost" size="sm" onClick={() => remove(i)}>删除</Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add} type="button">
        + 添加食材
      </Button>
    </div>
  )
}
