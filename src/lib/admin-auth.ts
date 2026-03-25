import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"

/**
 * Shared admin gate for route handlers that only need a pass/fail decision.
 *
 * Returning a ready-made `NextResponse` keeps the route handlers small and
 * ensures unauthorized responses stay consistent across admin APIs.
 */
export async function requireAdmin() {
  const token = (await cookies()).get("admin-token")?.value
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 })
  }

  return null
}
