import { storefrontProducts } from "@/mocks/storefront/products"
import { getProductDetails } from "@/screens/storefront/product-details/product-details.mocks"

describe("getProductDetails", () => {
  it("resolves the reference product from its id", () => {
    const details = getProductDetails("apple-watch-series-5-se")

    expect(details?.product.name).toBe("Apple Watch")
    expect(details?.product.subtitle).toBe("Series 5 SE")
    expect(details?.product.price).toBe(529.99)
    expect(details?.rating).toBe(4.5)
  })

  it("resolves every catalog product, so no catalog link dead-ends", () => {
    for (const product of storefrontProducts) {
      expect(getProductDetails(product.id)?.product).toBe(product)
    }
  })

  it("returns undefined for an id the catalog does not have", () => {
    expect(getProductDetails("not-a-product")).toBeUndefined()
    expect(getProductDetails("")).toBeUndefined()
  })

  it("matches the id exactly, not by prefix or case", () => {
    expect(getProductDetails("apple-watch")).toBeUndefined()
    expect(getProductDetails("APPLE-WATCH-SERIES-5-SE")).toBeUndefined()
  })

  it("gives each product the three pictures of its own catalog image", () => {
    const details = getProductDetails("sony-zx330bt-light-grey")

    expect(details?.gallery).toHaveLength(3)
    expect(
      details?.gallery.every((image) => image === details.product.image)
    ).toBe(true)
  })
})
