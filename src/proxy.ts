import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname

  // 保护 /admin/* 路由
  if (path.startsWith("/admin")) {
    const token = req.cookies.get("admin-token")?.value
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url))
    }
    const payload = await verifyToken(token)
    if (!payload) {
      const res = NextResponse.redirect(new URL("/login", req.url))
      res.cookies.delete("admin-token")
      return res
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
