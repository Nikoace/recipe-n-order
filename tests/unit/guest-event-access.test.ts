import { expect, test } from "bun:test"
import { checkGuestAccess } from "@/lib/guest-event-access"

test("view access allows active and closed events, but hides draft events", () => {
  expect(checkGuestAccess("active", "view")).toEqual({ ok: true })
  expect(checkGuestAccess("closed", "view")).toEqual({ ok: true })
  expect(checkGuestAccess("draft", "view")).toEqual({
    ok: false,
    status: 404,
    error: "活动不存在",
  })
})

test("join access only allows active events", () => {
  expect(checkGuestAccess("active", "join")).toEqual({ ok: true })
  expect(checkGuestAccess("draft", "join")).toEqual({
    ok: false,
    status: 404,
    error: "活动不存在",
  })
  expect(checkGuestAccess("closed", "join")).toEqual({
    ok: false,
    status: 403,
    error: "活动已结束",
  })
})

test("order access distinguishes draft and closed events", () => {
  expect(checkGuestAccess("active", "order")).toEqual({ ok: true })
  expect(checkGuestAccess("draft", "order")).toEqual({
    ok: false,
    status: 403,
    error: "活动尚未开始",
  })
  expect(checkGuestAccess("closed", "order")).toEqual({
    ok: false,
    status: 403,
    error: "活动已结束",
  })
})
