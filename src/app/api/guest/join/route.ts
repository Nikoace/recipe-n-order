import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { guests } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { getGuestEvent } from "@/lib/guest-event-access"

export async function POST(req: NextRequest) {
  const { shareCode, name, avatar, note } = await req.json()

  if (!shareCode || !name) {
    return NextResponse.json({ error: "shareCode 和 name 不能为空" }, { status: 400 })
  }
  const trimmedName = name.trim()
  if (!trimmedName) {
    return NextResponse.json({ error: "昵称不能为空" }, { status: 400 })
  }

  const access = await getGuestEvent(shareCode, "join")
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }
  const event = access.event

  // 检查该昵称在该活动中是否已存在
  let guest = await db.query.guests.findFirst({
    where: and(eq(guests.eventId, event.id), eq(guests.name, trimmedName)),
  })

  if (!guest) {
    ;[guest] = await db
      .insert(guests)
      .values({ eventId: event.id, name: trimmedName, avatar, note })
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
