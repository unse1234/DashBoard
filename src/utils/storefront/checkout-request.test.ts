import type { BagLine } from "@/types/storefront/bag.types"
import {
  toDraftLines,
  toShippingAddressRequest,
} from "@/utils/storefront/checkout-request"

describe("toShippingAddressRequest", () => {
  it("trims, sets the country the shop delivers to, and leaves out blanks", () => {
    expect(
      toShippingAddressRequest({
        recipientName: "  Ayesha Khan ",
        addressLine1: " House 12 ",
        addressLine2: "   ",
        city: "Lahore ",
        region: " Punjab",
        postalCode: "",
      })
    ).toEqual({
      recipientName: "Ayesha Khan",
      addressLine1: "House 12",
      city: "Lahore",
      region: "Punjab",
      country: "PK",
    })
  })

  it("keeps the optional fields that were given", () => {
    expect(
      toShippingAddressRequest({
        recipientName: "A",
        addressLine1: "B",
        addressLine2: " Flat 3 ",
        city: "C",
        region: "D",
        postalCode: " 54000 ",
      })
    ).toMatchObject({ addressLine2: "Flat 3", postalCode: "54000" })
  })
})

describe("toDraftLines", () => {
  it("keeps only the id and the quantity of each line", () => {
    const lines: BagLine[] = [
      {
        productId: "PRD-1",
        quantity: 2,
        product: null,
        unitPrice: 10,
        lineTotal: 20,
        issue: null,
      },
    ]

    expect(toDraftLines(lines)).toEqual([{ productId: "PRD-1", quantity: 2 }])
  })
})
