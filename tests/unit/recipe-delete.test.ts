import { expect, test } from "bun:test"
import { countRecipeDeleteBlockers } from "@/db/queries/recipes"

test("countRecipeDeleteBlockers counts event and order references", () => {
  const result = countRecipeDeleteBlockers(
    3,
    [{ recipeId: 3 }, { recipeId: 3 }, { recipeId: 8 }],
    [
      { items: [{ recipeId: 1, quantity: 1 }, { recipeId: 3, quantity: 2 }] },
      { items: [{ recipeId: 3, quantity: 1 }] },
      { items: [{ recipeId: 9, quantity: 1 }] },
    ]
  )

  expect(result).toEqual({
    eventCount: 2,
    orderCount: 2,
  })
})

test("countRecipeDeleteBlockers ignores unrelated references", () => {
  const result = countRecipeDeleteBlockers(
    5,
    [{ recipeId: 2 }],
    [{ items: [{ recipeId: 8, quantity: 1 }] }]
  )

  expect(result).toEqual({
    eventCount: 0,
    orderCount: 0,
  })
})
