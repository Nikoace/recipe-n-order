import { NextRequest, NextResponse } from "next/server"
import sharp from "sharp"
import { uploadImage } from "@/lib/storage"
import { requireAdmin } from "@/lib/admin-auth"

export async function POST(req: NextRequest) {
  const authError = await requireAdmin()
  if (authError) return authError

  const formData = await req.formData()
  const file = formData.get("file") as File
  const folder = (formData.get("folder") as string) ?? "recipes"

  if (!file) {
    return NextResponse.json({ error: "未提供文件" }, { status: 400 })
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "仅支持 JPEG、PNG、WebP、GIF 格式" }, { status: 400 })
  }

  const raw = Buffer.from(await file.arrayBuffer())
  const buffer = await sharp(raw)
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer()
  const url = await uploadImage(buffer, "image/webp", folder)
  return NextResponse.json({ url })
}
