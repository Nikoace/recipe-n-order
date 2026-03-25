import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { tags } from "@/db/schema"
import { requireAdmin } from "@/lib/admin-auth"

export async function GET() {
  const all = await db.select().from(tags).orderBy(tags.name)
  return NextResponse.json(all)
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin()
  if (authError) return authError

  const { name, color } = await req.json()
  const [tag] = await db.insert(tags).values({ name, color }).returning()
  return NextResponse.json(tag, { status: 201 })
}
