import type {
  Category,
  Product,
  ProductHistoryEntry,
} from "@/lib/products/product.types"

/** An active, in-stock product with a cost price; override fields per test. */
export function createProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "PRD-1001",
    name: "Aurora Wireless Noise-Cancelling Headphones",
    sku: "AUD-ANC-500-BLK",
    description:
      "Over-ear Bluetooth headphones with adaptive noise cancelling and a 40-hour battery.",
    categoryId: "cat-electronics",
    category: "Electronics",
    brand: "Soundcraft",
    status: "active",
    price: 249,
    costPrice: 138.5,
    stock: 184,
    version: 1,
    createdAt: "2025-02-11T10:20:00Z",
    updatedAt: "2026-09-18T14:05:00Z",
    ...overrides,
  }
}

export function createCategory(overrides: Partial<Category> = {}): Category {
  return { id: "cat-electronics", name: "Electronics", ...overrides }
}

/** The categories the API seeds, in the order it returns them. */
export const categoryFixtures: Category[] = [
  { id: "cat-accessories", name: "Accessories" },
  { id: "cat-electronics", name: "Electronics" },
  { id: "cat-furniture", name: "Furniture" },
  { id: "cat-home", name: "Home & Kitchen" },
  { id: "cat-office", name: "Office Supplies" },
  { id: "cat-sports", name: "Sports & Outdoors" },
]

export function createHistoryEntry(
  overrides: Partial<ProductHistoryEntry> = {}
): ProductHistoryEntry {
  return {
    id: "evt-1",
    change: "Price changed from $269.00 to $249.00",
    occurredAt: "2026-09-18T14:05:00Z",
    actor: "Priya Raman",
    ...overrides,
  }
}
