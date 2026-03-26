import { ShoppingBag } from "lucide-react"

interface Props {
  items: Array<{ name: string; totalAmount: string; unit: string; recipes: string[] }>
}

export function ShoppingList({ items }: Props) {
  if (items.length === 0) return <p className="text-muted-foreground text-sm">暂无点菜</p>

  return (
    <div>
      <h2 className="font-semibold mb-2 flex items-center gap-1.5"><ShoppingBag className="h-4 w-4" />备菜清单</h2>
      <div className="border rounded-lg divide-y">
        {items.map((item) => (
          <div key={`${item.name}::${item.unit}`} className="flex items-center justify-between p-3">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.recipes.join("、")}</p>
            </div>
            <span className="font-semibold">
              {item.totalAmount} {item.unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
