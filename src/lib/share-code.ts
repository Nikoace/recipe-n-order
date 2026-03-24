import { customAlphabet } from "nanoid"

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8)

export function generateShareCode(): string {
  return nanoid()
}

export function isValidShareCode(code: string): boolean {
  return /^[a-z0-9]{8}$/.test(code)
}
