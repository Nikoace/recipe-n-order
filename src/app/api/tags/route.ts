import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { tags } from "@/db/schema"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"

export async function GET() {
  const all = await db.select().from(tags).orderBy(tags.name)
  return NextResponse.json(all)
}

export async function POST(req: NextRequest) {
  const token = (await cookies()).get("admin-token")?.value
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

  const { name, color } = await req.json()
  const [tag] = await db.insert(tags).values({ name, color }).returning()
  return NextResponse.json(tag, { status: 201 })
}
