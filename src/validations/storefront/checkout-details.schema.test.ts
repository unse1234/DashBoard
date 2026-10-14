import { checkoutDetailsSchema } from "@/validations/storefront/checkout-details.schema"

const valid = {
  name: "Ayesha Khan",
  email: "ayesha@example.com",
  phone: "0300 1234567",
  recipientName: "",
  addressLine1: "House 12, Street 4, F-7/2",
  addressLine2: "",
  city: "Islamabad",
  region: "Islamabad Capital Territory",
  postalCode: "",
}

const issuesOf = (values: object) => {
  const result = checkoutDetailsSchema.safeParse({ ...valid, ...values })
  return result.success
    ? []
    : result.error.issues.map((issue) => [issue.path.join("."), issue.message])
}

describe("checkoutDetailsSchema", () => {
  it("accepts a complete set of details, trimming them", () => {
    const parsed = checkoutDetailsSchema.parse({
      ...valid,
      name: "  Ayesha Khan ",
      city: " Lahore ",
      postalCode: " 54000 ",
    })

    expect(parsed).toMatchObject({
      name: "Ayesha Khan",
      city: "Lahore",
      postalCode: "54000",
    })
  })

  it.each([
    "0300 1234567",
    "03001234567",
    "+92 300 1234567",
    "0092-300-1234567",
    "(042) 3576-1234",
    "92 300 1234567",
  ])("accepts the phone number %s", (phone) => {
    expect(issuesOf({ phone })).toEqual([])
  })

  it.each([
    ["", "phone"],
    ["abc", "phone"],
    ["12345", "phone"],
    ["+1 202 555 0147 99999", "phone"],
    ["0300-CALL-ME", "phone"],
  ])("refuses the phone number %j", (phone, path) => {
    expect(issuesOf({ phone }).map(([field]) => field)).toEqual([path])
  })

  it("requires the fields the order cannot do without", () => {
    const fields = issuesOf({
      name: " ",
      email: "",
      phone: "",
      addressLine1: "",
      city: " ",
      region: "",
    }).map(([field]) => field)

    expect(fields.sort()).toEqual(
      ["addressLine1", "city", "email", "name", "phone", "region"].sort()
    )
  })

  it("refuses an email that is not one", () => {
    expect(issuesOf({ email: "ayesha@" })).toEqual([
      ["email", "Enter a valid email address."],
    ])
  })

  it("keeps to the API's limits, which city and province make 100, not 120", () => {
    expect(issuesOf({ city: "x".repeat(101) })).toEqual([
      ["city", "Use 100 characters or fewer."],
    ])
    expect(issuesOf({ region: "x".repeat(101) })).toEqual([
      ["region", "Use 100 characters or fewer."],
    ])
    expect(issuesOf({ addressLine1: "x".repeat(201) })).toEqual([
      ["addressLine1", "Use 200 characters or fewer."],
    ])
    expect(issuesOf({ name: "x".repeat(121) })).toEqual([
      ["name", "Use 120 characters or fewer."],
    ])
    expect(issuesOf({ city: "x".repeat(100) })).toEqual([])
  })

  it("accepts an optional postal code only as five digits", () => {
    expect(issuesOf({ postalCode: "54000" })).toEqual([])
    expect(issuesOf({ postalCode: "5400" })).toEqual([
      ["postalCode", "Use five digits."],
    ])
    expect(issuesOf({ postalCode: "54000-1" })).toEqual([
      ["postalCode", "Use five digits."],
    ])
  })
})
