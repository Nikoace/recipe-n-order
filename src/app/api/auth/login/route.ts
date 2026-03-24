import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { admins } from "@/db/schema"
import { eq } from "drizzle-orm"
import { verifyPassword, signToken } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  if (!username || !password) {
    return NextResponse.json({ error: "缺少用户名或密码" }, { status: 400 })
  }

  const admin = await db.query.admins.findFirst({
    where: eq(admins.username, username),
  })

  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 })
  }

  const token = await signToken({ adminId: admin.id, username: admin.username })

  const res = NextResponse.json({ ok: true })
  res.cookies.set("admin-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7天
    path: "/",
  })
  return res
}
