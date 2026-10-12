import { getOrderAddressLines } from "@/lib/orders/order.utils"

describe("getOrderAddressLines", () => {
  it("lists the street, the city line and the country", () => {
    expect(
      getOrderAddressLines({
        addressLine1: "88 Hayes Street",
        addressLine2: "Apt 12",
        city: "San Francisco",
        region: "CA",
        postalCode: "94102",
        country: "United States",
      })
    ).toEqual([
      "88 Hayes Street",
      "Apt 12",
      "San Francisco, CA 94102",
      "United States",
    ])
  })

  it("leaves out the lines that are not set", () => {
    expect(
      getOrderAddressLines({
        addressLine1: "Villa 22, Street 14, Al Barsha 2",
        addressLine2: null,
        city: "Dubai",
        region: null,
        postalCode: null,
        country: "United Arab Emirates",
      })
    ).toEqual([
      "Villa 22, Street 14, Al Barsha 2",
      "Dubai",
      "United Arab Emirates",
    ])
  })
})
