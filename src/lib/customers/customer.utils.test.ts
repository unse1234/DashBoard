import { getAddressLines } from "@/lib/customers/customer.utils"

describe("getAddressLines", () => {
  const address = {
    addressLine1: "88 Hayes Street",
    addressLine2: "Apt 12",
    city: "San Francisco",
    region: "CA",
    postalCode: "94102",
    country: "United States",
  }

  it("puts the street, the city line and the country on separate lines", () => {
    expect(getAddressLines(address)).toEqual([
      "88 Hayes Street",
      "Apt 12",
      "San Francisco, CA 94102",
      "United States",
    ])
  })

  it("leaves out the second street line and the region when they are not set", () => {
    expect(
      getAddressLines({
        ...address,
        addressLine2: null,
        city: "London",
        region: null,
        postalCode: "SE15 4QD",
        country: "United Kingdom",
      })
    ).toEqual(["88 Hayes Street", "London SE15 4QD", "United Kingdom"])
  })

  it("still shows the city when there is no postal code", () => {
    expect(
      getAddressLines({
        ...address,
        addressLine2: null,
        city: "Dubai",
        region: null,
        postalCode: null,
        country: "United Arab Emirates",
      })
    ).toEqual(["88 Hayes Street", "Dubai", "United Arab Emirates"])
  })
})
