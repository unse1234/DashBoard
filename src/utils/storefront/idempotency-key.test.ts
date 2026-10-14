import { vi } from "vitest"

import { createIdempotencyKey } from "@/utils/storefront/idempotency-key"

// What the API accepts of an Idempotency-Key.
const ACCEPTED = /^[A-Za-z0-9_-]{8,100}$/
const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("createIdempotencyKey", () => {
  it("makes a UUID the API accepts, and a new one each time", () => {
    const keys = Array.from({ length: 20 }, createIdempotencyKey)

    for (const key of keys) {
      expect(key).toMatch(UUID_V4)
      expect(key).toMatch(ACCEPTED)
    }
    expect(new Set(keys).size).toBe(20)
  })

  it("still makes one where crypto.randomUUID does not exist (an insecure page)", () => {
    vi.stubGlobal("crypto", {
      getRandomValues: (bytes: Uint8Array) => {
        bytes.forEach((_, index) => (bytes[index] = (index * 37 + 11) % 256))
        return bytes
      },
    })

    const key = createIdempotencyKey()

    expect(key).toMatch(UUID_V4)
    expect(key).toMatch(ACCEPTED)
  })
})
