import { writeFileSync, mkdirSync } from "fs"
import { nanoid } from "nanoid"
import path from "path"

export async function uploadImage(
  buffer: Buffer,
  mimeType: string,
  folder: string = "recipes"
): Promise<string> {
  const ext = mimeType.split("/")[1] ?? "jpg"
  const filename = `${nanoid()}.${ext}`
  const dir = path.join(process.cwd(), "public", "uploads", folder)
  mkdirSync(dir, { recursive: true })
  writeFileSync(path.join(dir, filename), buffer)
  return `/uploads/${folder}/${filename}`
}
