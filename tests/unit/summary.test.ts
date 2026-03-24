import { expect, test } from "bun:test"
import { calculateShoppingList, type ShoppingItem } from "@/db/queries/orders"

test("calculateShoppingList aggregates ingredients correctly", () => {
  const recipes = [
    {
      id: 1,
      servings: 2,
      ingredients: [
        { name: "五花肉", amount: "500", unit: "g" },
        { name: "生抽", amount: "3", unit: "勺" },
      ],
    },
    {
      id: 2,
      servings: 4,
      ingredients: [
        { name: "鸡蛋", amount: "4", unit: "个" },
      ],
    },
  ]

  const orders = [
    { items: [{ recipeId: 1, quantity: 2 }] },
    { items: [{ recipeId: 2, quantity: 1 }] },
  ]

  const result: ShoppingItem[] = calculateShoppingList(recipes as any, orders as any)

  // 红烧肉点了2份，每份500g五花肉，总计1000g
  const pork = result.find((r) => r.name === "五花肉")
  expect(pork?.totalAmount).toBe("1000")
  expect(pork?.unit).toBe("g")

  // 蛋羹点了1份，需要4个鸡蛋
  const egg = result.find((r) => r.name === "鸡蛋")
  expect(egg?.totalAmount).toBe("4")
})

test("calculateShoppingList handles empty orders", () => {
  const result = calculateShoppingList([], [])
  expect(result).toEqual([])
})
