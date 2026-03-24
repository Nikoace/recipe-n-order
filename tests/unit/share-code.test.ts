import { expect, test } from "bun:test"
import { generateShareCode, isValidShareCode } from "@/lib/share-code"

test("generateShareCode returns 8-char alphanumeric string", () => {
  const code = generateShareCode()
  expect(code).toHaveLength(8)
  expect(code).toMatch(/^[a-z0-9]+$/)
})

test("generateShareCode generates unique codes", () => {
  const codes = new Set(Array.from({ length: 100 }, generateShareCode))
  expect(codes.size).toBe(100)
})

test("isValidShareCode validates format", () => {
  expect(isValidShareCode("abc12345")).toBe(true)
  expect(isValidShareCode("ABC12345")).toBe(false)
  expect(isValidShareCode("ab!@#$%^")).toBe(false)
  expect(isValidShareCode("short")).toBe(false)
  expect(isValidShareCode("toolongstring")).toBe(false)
})
