import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { guests } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { getEventByShareCode } from "@/db/queries/events"

export async function POST(req: NextRequest) {
  const { shareCode, name, avatar, note } = await req.json()

  if (!shareCode || !name) {
    return NextResponse.json({ error: "shareCode 和 name 不能为空" }, { status: 400 })
  }

  const event = await getEventByShareCode(shareCode)
  if (!event) {
    return NextResponse.json({ error: "活动不存在" }, { status: 404 })
  }
  if (event.status === "closed") {
    return NextResponse.json({ error: "活动已结束" }, { status: 403 })
  }

  // 检查该昵称在该活动中是否已存在
  let guest = await db.query.guests.findFirst({
    where: and(eq(guests.eventId, event.id), eq(guests.name, name)),
  })

  if (!guest) {
    ;[guest] = await db
      .insert(guests)
      .values({ eventId: event.id, name, avatar, note })
      .returning()
  }

  const res = NextResponse.json({ event, guest })
  res.cookies.set(`guest-${event.shareCode}`, guest.id.toString(), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  })
  return res
}
