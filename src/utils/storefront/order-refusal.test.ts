import { ApiError } from "@/lib/api/api-error"
import { describeOrderRefusal } from "@/utils/storefront/order-refusal"

const refused = (
  status: number,
  message: string,
  details: Record<string, unknown> = {}
) => new ApiError(status, [message], details)

describe("describeOrderRefusal", () => {
  it.each([
    ["QUOTE_EXPIRED", /expired/],
    ["PRICES_CHANGED", /Prices changed/],
    ["TOTAL_CHANGED", /Prices changed/],
    ["ITEMS_CHANGED", /Your order changed/],
    ["DESTINATION_CHANGED", /Your order changed/],
    ["TOKEN_INVALID", /Your order changed/],
  ])(
    "explains a stale quote (%s) as something to review, not a failure",
    (reason, text) => {
      const refusal = describeOrderRefusal(
        refused(409, "server wording", { code: "QUOTE_CHANGED", reason })
      )

      expect(refusal.remedy).toBe("review")
      expect(refusal.message).toMatch(text)
      expect(refusal.message).not.toContain("server wording")
    }
  )

  it.each(["PRODUCT_UNAVAILABLE", "INSUFFICIENT_STOCK"])(
    "sends %s to the bag, in the API's words",
    (code) => {
      expect(
        describeOrderRefusal(
          refused(409, "Review your bag.", { code, productId: "PRD-1" })
        )
      ).toEqual({ message: "Review your bag.", remedy: "bag" })
    }
  )

  it("sends a destination outside Pakistan to the details", () => {
    expect(
      describeOrderRefusal(
        refused(400, "We only deliver within Pakistan", {
          code: "UNSUPPORTED_DESTINATION",
        })
      )
    ).toEqual({
      message: "We only deliver within Pakistan",
      remedy: "details",
    })
  })

  it("lists the fields of a validation error, which has no code", () => {
    const refusal = describeOrderRefusal(
      new ApiError(400, [
        "contact.email must be a valid email address",
        "contact.phone must be a Pakistani phone number",
      ])
    )

    expect(refusal.remedy).toBe("details")
    expect(refusal.message).toBe(
      "Please check your details: contact.email must be a valid email address; contact.phone must be a Pakistani phone number"
    )
  })

  it("falls back to the generic wording for anything else", () => {
    expect(describeOrderRefusal(refused(404, "Not found"))).toEqual({
      message: "Not found",
      remedy: "review",
    })
  })
})
