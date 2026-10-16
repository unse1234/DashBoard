import { productFormSchema } from "@/validations/product.schemas";
import { type ProductFormInput } from "@/types/product.types";

const validInput: ProductFormInput = {
  name: "Aurora Headphones",
  sku: "AUD-ANC-500",
  subtitle: "Wireless, noise cancelling",
  brand: "Soundcraft",
  description: "Wireless over-ear headphones.",
  imageUrl: "https://cdn.example.com/aurora.jpg",
  galleryUrls: "/images/aurora-2.png\n/images/aurora-3.png",
  categoryId: "cat-electronics",
  status: "active",
  price: "249.00",
  costPrice: "138.50",
  stock: "184",
}

function parse(changes: Partial<ProductFormInput> = {}) {
  return productFormSchema.safeParse({ ...validInput, ...changes })
}

// First message per field, which is what the form displays.
function getErrors(changes: Partial<ProductFormInput>) {
  const errors: Record<string, string> = {}
  const result = parse(changes)
  if (result.success) return errors

  for (const issue of result.error.issues) {
    errors[String(issue.path[0])] ??= issue.message
  }
  return errors
}

describe("productFormSchema", () => {
  it("turns the typed values into a product payload", () => {
    expect(parse().data).toEqual({
      name: "Aurora Headphones",
      sku: "AUD-ANC-500",
      subtitle: "Wireless, noise cancelling",
      brand: "Soundcraft",
      description: "Wireless over-ear headphones.",
      imageUrl: "https://cdn.example.com/aurora.jpg",
      galleryUrls: ["/images/aurora-2.png", "/images/aurora-3.png"],
      categoryId: "cat-electronics",
      status: "active",
      price: 249,
      costPrice: 138.5,
      stock: 184,
    })
  })

  it("trims the text fields", () => {
    expect(
      parse({ name: "  Aurora  ", sku: " AUD-1 ", brand: "  Soundcraft " }).data
    ).toMatchObject({ name: "Aurora", sku: "AUD-1", brand: "Soundcraft" })
  })

  it("accepts a product with only the required fields", () => {
    const result = parse({
      subtitle: " ",
      brand: "",
      description: "  ",
      imageUrl: "",
      galleryUrls: "  \n ",
      costPrice: " ",
    })

    expect(result.data).toMatchObject({
      subtitle: null,
      brand: null,
      description: null,
      imageUrl: null,
      galleryUrls: [],
      costPrice: null,
    })
  })

  describe("subtitle", () => {
    it("is limited to the API's length", () => {
      expect(getErrors({ subtitle: "a".repeat(161) }).subtitle).toBe(
        "Subtitle must be 160 characters or fewer."
      )
      expect(getErrors({ subtitle: "a".repeat(160) }).subtitle).toBeUndefined()
    })
  })

  describe("main image", () => {
    it.each([
      "https://cdn.example.com/a.jpg",
      "http://localhost:3000/a.png",
      "/images/mug.png",
    ])("accepts %s", (imageUrl) => {
      expect(getErrors({ imageUrl }).imageUrl).toBeUndefined()
    })

    it.each([
      ["a script", "javascript:alert(1)"],
      ["inline data", "data:image/png;base64,AAAA"],
      ["a protocol-relative address", "//evil.example.com/a.png"],
      ["a path that climbs out", "/images/../secrets.png"],
      ["a bare file name", "mug.png"],
      ["an address with credentials", "https://user:pw@example.com/a.png"],
      ["an address with spaces", "https://example.com/my photo.png"],
      ["an ftp address", "ftp://example.com/a.png"],
    ])("refuses %s", (_label, imageUrl) => {
      expect(getErrors({ imageUrl }).imageUrl).toBe(
        "Use an http(s) address or a path on the shop that starts with “/”."
      )
    })

    it("is limited to the API's length", () => {
      expect(
        getErrors({ imageUrl: `/${"a".repeat(500)}` }).imageUrl
      ).toBeDefined()
    })
  })

  describe("more images", () => {
    it("takes one address per line, in order, ignoring blank lines", () => {
      expect(
        parse({ galleryUrls: " /a.png \r\n\n/b.png\n" }).data
      ).toMatchObject({ galleryUrls: ["/a.png", "/b.png"] })
    })

    it("refuses a line that is not an address, as one message on the field", () => {
      expect(
        getErrors({ galleryUrls: "/a.png\nnot an address" }).galleryUrls
      ).toMatch(/^Each line must be one address\./)
    })

    it("allows ten and refuses eleven", () => {
      const lines = (count: number) =>
        Array.from({ length: count }, (_, index) => `/img-${index}.png`).join(
          "\n"
        )

      expect(getErrors({ galleryUrls: lines(10) }).galleryUrls).toBeUndefined()
      expect(getErrors({ galleryUrls: lines(11) }).galleryUrls).toBe(
        "Add at most 10 more pictures."
      )
    })
  })

  describe("name", () => {
    it("is required, and whitespace does not count", () => {
      expect(getErrors({ name: "" }).name).toBe("Enter a product name.")
      expect(getErrors({ name: "   " }).name).toBe("Enter a product name.")
    })

    it("enforces the length limits", () => {
      expect(getErrors({ name: "A" }).name).toBe(
        "Product name must be at least 2 characters."
      )
      expect(getErrors({ name: "A".repeat(121) }).name).toBe(
        "Product name must be 120 characters or fewer."
      )
    })
  })

  describe("sku", () => {
    it("is required", () => {
      expect(getErrors({ sku: " " }).sku).toBe("Enter a SKU.")
    })

    it("can't contain spaces or be too long", () => {
      expect(getErrors({ sku: "AUD 500" }).sku).toBe(
        "SKU can't contain spaces."
      )
      expect(getErrors({ sku: "A".repeat(65) }).sku).toBe(
        "SKU must be 64 characters or fewer."
      )
    })
  })

  describe("optional text", () => {
    it("limits the brand and the description", () => {
      const errors = getErrors({
        brand: "B".repeat(81),
        description: "D".repeat(2001),
      })

      expect(errors).toEqual({
        brand: "Brand must be 80 characters or fewer.",
        description: "Description must be 2000 characters or fewer.",
      })
    })
  })

  describe("category and status", () => {
    it("requires a category", () => {
      expect(getErrors({ categoryId: "" }).categoryId).toBe(
        "Select a category."
      )
    })

    it("only accepts active or inactive", () => {
      expect(
        getErrors({ status: "out-of-stock" as ProductFormInput["status"] })
          .status
      ).toBe("Select a status.")
      expect(parse({ status: "inactive" }).data?.status).toBe("inactive")
    })
  })

  describe("selling price", () => {
    it("is required", () => {
      expect(getErrors({ price: "" }).price).toBe("Enter a selling price.")
    })

    it("accepts zero and values with up to two decimals", () => {
      expect(parse({ price: "0" }).data?.price).toBe(0)
      expect(parse({ price: "19.99" }).data?.price).toBe(19.99)
      expect(parse({ price: "0.1" }).data?.price).toBe(0.1)
    })

    it("rejects negative amounts", () => {
      expect(getErrors({ price: "-1" }).price).toBe(
        "Selling price must not be negative."
      )
    })

    it("rejects text and more than two decimals", () => {
      expect(getErrors({ price: "abc" }).price).toBe(
        "Enter a valid selling price."
      )
      expect(getErrors({ price: "10.999" }).price).toBe(
        "Selling price can have at most two decimal places."
      )
    })

    it("rejects an unreasonably large amount", () => {
      expect(getErrors({ price: "1000001" }).price).toBe(
        "Selling price must be 1,000,000 or less."
      )
    })
  })

  describe("cost price", () => {
    it("is optional", () => {
      expect(parse({ costPrice: "" }).data?.costPrice).toBeNull()
    })

    it("is validated like the selling price once supplied", () => {
      expect(getErrors({ costPrice: "-0.5" }).costPrice).toBe(
        "Cost price must not be negative."
      )
      expect(getErrors({ costPrice: "x" }).costPrice).toBe(
        "Enter a valid cost price."
      )
    })

    it("accepts zero", () => {
      expect(parse({ costPrice: "0" }).data?.costPrice).toBe(0)
    })
  })

  describe("stock quantity", () => {
    it("is required", () => {
      expect(getErrors({ stock: "" }).stock).toBe("Enter the stock quantity.")
    })

    it("accepts zero and whole numbers", () => {
      expect(parse({ stock: "0" }).data?.stock).toBe(0)
      expect(parse({ stock: "1240" }).data?.stock).toBe(1240)
    })

    it("rejects negative, fractional and non-numeric values", () => {
      expect(getErrors({ stock: "-3" }).stock).toBe(
        "Stock quantity must not be negative."
      )
      expect(getErrors({ stock: "2.5" }).stock).toBe(
        "Stock quantity must be a whole number."
      )
      expect(getErrors({ stock: "many" }).stock).toBe(
        "Enter a valid stock quantity."
      )
    })
  })

  it("reports every invalid field at once", () => {
    expect(
      Object.keys(
        getErrors({ name: "", sku: "", categoryId: "", price: "", stock: "" })
      )
    ).toEqual(["name", "sku", "categoryId", "price", "stock"])
  })
})
