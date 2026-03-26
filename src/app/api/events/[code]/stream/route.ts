import type { NextRequest } from "next/server"
import { getGuestEvent } from "@/lib/guest-event-access"
import { getOrdersLatestUpdate, getEventOrdersWithGuests } from "@/db/queries/orders"

const POLL_INTERVAL_MS = 3000

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  const result = await getGuestEvent(code, "view")
  if (!result.ok) {
    return new Response(JSON.stringify({ error: result.error }), {
      status: result.status,
      headers: { "Content-Type": "application/json" },
    })
  }

  const eventId = result.event.id
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let lastTimestamp: string | null = null

      const push = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      const tick = async () => {
        try {
          const latest = await getOrdersLatestUpdate(eventId)
          if (latest !== lastTimestamp) {
            lastTimestamp = latest
            const orders = await getEventOrdersWithGuests(eventId)
            push(orders)
          }
        } catch {
          // 忽略单次查询失败，等下次 tick
        }
      }

      // 立即推送初始数据
      await tick()

      const interval = setInterval(tick, POLL_INTERVAL_MS)

      req.signal.addEventListener("abort", () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
