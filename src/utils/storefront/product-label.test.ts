import {
  getProductLabel,
  splitParagraphs,
} from "@/utils/storefront/product-label"

describe("getProductLabel", () => {
  it("joins the name and the subtitle", () => {
    expect(getProductLabel({ name: "iPhone 11", subtitle: "Navy Blue" })).toBe(
      "iPhone 11, Navy Blue"
    )
  })

  it("is the name alone without a subtitle", () => {
    expect(getProductLabel({ name: "Kettle", subtitle: null })).toBe("Kettle")
    expect(getProductLabel({ name: "Kettle", subtitle: "" })).toBe("Kettle")
  })
})

describe("splitParagraphs", () => {
  it("splits at line breaks and drops empty lines", () => {
    expect(splitParagraphs("One.\n\n  Two.\r\nThree.\n")).toEqual([
      "One.",
      "Two.",
      "Three.",
    ])
  })

  it("is empty for no description", () => {
    expect(splitParagraphs(null)).toEqual([])
    expect(splitParagraphs("  \n ")).toEqual([])
  })
})
