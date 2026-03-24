import { expect, test } from "bun:test"
import { signToken, verifyToken, hashPassword, verifyPassword } from "@/lib/auth"

test("signToken and verifyToken roundtrip", async () => {
  const payload = { adminId: 1, username: "admin" }
  const token = await signToken(payload)
  expect(typeof token).toBe("string")
  expect(token.length).toBeGreaterThan(0)
  const decoded = await verifyToken(token)
  expect(decoded?.adminId).toBe(1)
  expect(decoded?.username).toBe("admin")
})

test("verifyToken returns null for invalid token", async () => {
  const result = await verifyToken("invalid.token.here")
  expect(result).toBeNull()
})

test("verifyToken returns null for expired-looking token", async () => {
  const result = await verifyToken("eyJhbGciOiJIUzI1NiJ9.invalid.sig")
  expect(result).toBeNull()
})

test("hashPassword and verifyPassword roundtrip", async () => {
  const hash = await hashPassword("mypassword123")
  expect(typeof hash).toBe("string")
  expect(hash.length).toBeGreaterThan(0)
  expect(await verifyPassword("mypassword123", hash)).toBe(true)
  expect(await verifyPassword("wrongpassword", hash)).toBe(false)
})
