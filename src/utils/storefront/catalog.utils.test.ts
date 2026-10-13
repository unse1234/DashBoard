import { storefrontProducts } from "@/mocks/storefront/products"
import { filterProductsByQuery } from "@/utils/storefront/catalog.utils"

const names = (query: string) =>
  filterProductsByQuery(storefrontProducts, query).map(
    (product) => `${product.name} / ${product.subtitle}`
  )

describe("filterProductsByQuery", () => {
  it("returns every product for an empty or blank query", () => {
    expect(filterProductsByQuery(storefrontProducts, "")).toBe(
      storefrontProducts
    )
    expect(filterProductsByQuery(storefrontProducts, "   ")).toBe(
      storefrontProducts
    )
  })

  it("matches the name, ignoring case", () => {
    expect(names("APPLE")).toEqual(["Apple Watch / Series 5 SE"])
    expect(names("iphone")).toHaveLength(4)
  })

  it("matches the subtitle", () => {
    expect(names("m1 pro")).toEqual(["MacBook Pro 16” / Silver - M1 Pro"])
    expect(names("serious")).toEqual(["iPhone 11 / Serious Black"])
  })

  it("ignores spaces around the query", () => {
    expect(names("  sony  ")).toEqual(["Sony ZX330BT / Light Grey"])
  })

  it("returns nothing when no name or subtitle matches", () => {
    expect(names("galaxy")).toEqual([])
  })
})
