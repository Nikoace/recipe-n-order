import { NextRequest, NextResponse } from "next/server"
import { uploadImage } from "@/lib/storage"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  const token = (await cookies()).get("admin-token")?.value
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

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

  const buffer = Buffer.from(await file.arrayBuffer())
  const url = await uploadImage(buffer, file.type, folder)
  return NextResponse.json({ url })
}
