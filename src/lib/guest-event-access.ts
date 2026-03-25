import { getEventByShareCode } from "@/db/queries/events"
import type { Event } from "@/db/schema"

/**
 * Guest side capabilities are narrower than raw event statuses:
 * some callers only need read access, while join/order require the
 * event to be actively open.
 */
export type GuestEventAccessMode = "view" | "join" | "order"

type EventStatus = Event["status"]

interface GuestEventAccessFailure {
  ok: false
  status: number
  error: string
}

interface GuestEventAccessSuccess {
  ok: true
}

type GuestEventAccessCheckResult = GuestEventAccessSuccess | GuestEventAccessFailure

export type GuestEventAccessResult =
  | { ok: true; event: Event }
  | GuestEventAccessFailure

/**
 * Centralized guest-facing status matrix.
 *
 * Keeping these rules in one place prevents page-level checks and API-level
 * checks from drifting apart when event status semantics change.
 */
const ACCESS_RULES: Record<
  GuestEventAccessMode,
  Record<EventStatus, GuestEventAccessCheckResult>
> = {
  view: {
    draft: { ok: false, status: 404, error: "活动不存在" },
    active: { ok: true },
    closed: { ok: true },
  },
  join: {
    draft: { ok: false, status: 404, error: "活动不存在" },
    active: { ok: true },
    closed: { ok: false, status: 403, error: "活动已结束" },
  },
  order: {
    draft: { ok: false, status: 403, error: "活动尚未开始" },
    active: { ok: true },
    closed: { ok: false, status: 403, error: "活动已结束" },
  },
}

/**
 * Maps a concrete event status to the guest capability being requested.
 *
 * This function is pure on purpose so the status matrix can be tested without
 * a database or route handler context.
 */
export function checkGuestAccess(
  status: EventStatus,
  mode: GuestEventAccessMode
): GuestEventAccessCheckResult {
  return ACCESS_RULES[mode][status]
}

/**
 * Loads an event by share code and applies the guest access matrix in one step.
 *
 * Callers receive either the resolved event or a ready-to-return HTTP status
 * and message, which keeps page routes and API routes aligned.
 */
export async function getGuestEvent(
  shareCode: string,
  mode: GuestEventAccessMode
): Promise<GuestEventAccessResult> {
  const event = await getEventByShareCode(shareCode)
  if (!event) {
    return { ok: false, status: 404, error: "活动不存在" }
  }

  const access = checkGuestAccess(event.status, mode)
  if (!access.ok) {
    return access
  }

  return { ok: true, event }
}
