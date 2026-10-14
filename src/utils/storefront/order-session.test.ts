import { vi } from "vitest"

import type {
  OrderAttempt,
  OrderConfirmation,
} from "@/types/storefront/checkout.types"
import {
  ATTEMPT_STORAGE_KEY,
  clearAttempt,
  clearConfirmation,
  CONFIRMATION_STORAGE_KEY,
  readAttemptSnapshot,
  readConfirmationSnapshot,
  saveAttempt,
  saveConfirmation,
  subscribeToOrderSession,
  toAttempt,
  toConfirmation,
} from "@/utils/storefront/order-session"

const attempt: OrderAttempt = {
  key: "4f0c1a52-2c3e-4b1f-9d3e-0a1b2c3d4e5f",
  request: {
    contact: {
      name: "Ayesha Khan",
      email: "ayesha@example.com",
      phone: "0300 1234567",
    },
    items: [{ productId: "PRD-1001", quantity: 2 }],
    shippingAddress: {
      recipientName: "Ayesha Khan",
      addressLine1: "House 12, Street 4",
      city: "Islamabad",
      region: "Islamabad Capital Territory",
      country: "PK",
    },
    quoteToken: "token.123",
  },
}

const confirmation: OrderConfirmation = {
  receipt: {
    id: "ORD-10001",
    createdAt: "2026-10-14T08:00:00.000Z",
    status: "PENDING",
    paymentStatus: "PENDING",
    paymentMethod: "COD",
    currency: "PKR",
    items: [
      {
        productId: "PRD-1001",
        productName: "Kettle",
        quantity: 2,
        unitPrice: 1500,
        total: 3000,
      },
    ],
    subtotal: 3000,
    shipping: 0,
    tax: 0,
    discount: 0,
    total: 3000,
  },
  delivery: {
    contactName: "Ayesha Khan",
    email: "ayesha@example.com",
    phone: "0300 1234567",
    address: attempt.request.shippingAddress,
  },
}

afterEach(() => {
  vi.restoreAllMocks()
  window.sessionStorage.clear()
})

describe("the pending order attempt", () => {
  it("round-trips through the session", () => {
    saveAttempt(attempt)

    expect(toAttempt(readAttemptSnapshot())).toEqual(attempt)
  })

  it("is gone once cleared", () => {
    saveAttempt(attempt)
    clearAttempt()

    expect(readAttemptSnapshot()).toBeNull()
    expect(toAttempt(readAttemptSnapshot())).toBeNull()
  })

  it("tells subscribers when it is saved and cleared", () => {
    const listener = vi.fn()
    const stop = subscribeToOrderSession(listener)

    saveAttempt(attempt)
    clearAttempt()
    stop()
    saveAttempt(attempt)

    expect(listener).toHaveBeenCalledTimes(2)
  })

  it.each([
    ["not JSON", "{oops"],
    ["not an object", "[1]"],
    ["a key the API would refuse", JSON.stringify({ ...attempt, key: "x" })],
    [
      "a request without a quote token",
      JSON.stringify({
        ...attempt,
        request: { ...attempt.request, quoteToken: undefined },
      }),
    ],
    [
      "contact fields that are not text",
      JSON.stringify({
        ...attempt,
        request: {
          ...attempt.request,
          contact: { ...attempt.request.contact, phone: 3001234567 },
        },
      }),
    ],
    [
      "lines that are not ids and whole quantities",
      JSON.stringify({
        ...attempt,
        request: {
          ...attempt.request,
          items: [{ productId: "PRD-1", quantity: 1.5 }],
        },
      }),
    ],
  ])("ignores a stored attempt that is %s", (_label, stored) => {
    window.sessionStorage.setItem(ATTEMPT_STORAGE_KEY, stored)

    expect(toAttempt(readAttemptSnapshot())).toBeNull()
  })

  it("survives unavailable storage without throwing", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked")
    })

    expect(() => saveAttempt(attempt)).not.toThrow()
    expect(readAttemptSnapshot()).toBeNull()
  })
})

describe("the confirmation", () => {
  it("round-trips through the session", () => {
    saveConfirmation(confirmation)

    expect(toConfirmation(readConfirmationSnapshot())).toEqual(confirmation)
  })

  it("is gone once cleared", () => {
    saveConfirmation(confirmation)
    clearConfirmation()

    expect(toConfirmation(readConfirmationSnapshot())).toBeNull()
  })

  it.each([
    [
      "a reference that is not an order's",
      { ...confirmation.receipt, id: "X" },
    ],
    [
      "a total that is not a number",
      { ...confirmation.receipt, total: "3000" },
    ],
  ])("ignores a stored receipt with %s", (_label, receipt) => {
    window.sessionStorage.setItem(
      CONFIRMATION_STORAGE_KEY,
      JSON.stringify({ ...confirmation, receipt })
    )

    expect(toConfirmation(readConfirmationSnapshot())).toBeNull()
  })

  it("keeps the two records apart", () => {
    saveAttempt(attempt)
    saveConfirmation(confirmation)
    clearAttempt()

    expect(toAttempt(readAttemptSnapshot())).toBeNull()
    expect(toConfirmation(readConfirmationSnapshot())).toEqual(confirmation)
  })
})
