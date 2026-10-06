import type { Product, ProductHistoryEntry } from "@/lib/products/product.types"

// Placeholder data until the products API exists. Stands in for one page of results.
export const mockProducts: Product[] = [
  {
    id: "PRD-2041",
    name: "Aurora Wireless Noise-Cancelling Headphones",
    sku: "AUD-ANC-500-BLK",
    description:
      "Over-ear Bluetooth headphones with adaptive noise cancelling, 40-hour battery life and a foldable carrying case.",
    category: "Electronics",
    brand: "Soundcraft",
    status: "active",
    price: 249,
    costPrice: 138.5,
    stock: 184,
    createdAt: "2025-02-11T10:20:00Z",
    updatedAt: "2026-09-18T14:05:00Z",
  },
  {
    id: "PRD-2042",
    name: "Pre-Seasoned Cast Iron Skillet, 12 inch",
    sku: "HK-CIS-12",
    description:
      "A heavy, pre-seasoned skillet that works on every hob, in the oven and over a campfire.",
    category: "Home & Kitchen",
    brand: "Hearthstone",
    status: "active",
    price: 39.95,
    costPrice: 17.2,
    stock: 62,
    createdAt: "2024-06-03T08:15:00Z",
    updatedAt: "2026-05-21T11:40:00Z",
  },
  {
    id: "PRD-2057",
    name: "Ergonomic Mesh Office Chair with Adjustable Lumbar Support and Headrest",
    sku: "FUR-CHR-MESH-02",
    description:
      "Breathable mesh back, height-adjustable lumbar support and a 4D armrest. Rated for 8-hour days at the desk.",
    category: "Furniture",
    brand: "Northwind",
    status: "active",
    price: 329,
    costPrice: 188,
    stock: 9,
    createdAt: "2024-11-19T13:00:00Z",
    updatedAt: "2026-10-01T16:25:00Z",
  },
  {
    id: "PRD-2063",
    name: "Trail Insulated Water Bottle, 750 ml",
    sku: "SPT-BTL-750-GRN",
    description:
      "Double-wall stainless steel bottle that keeps drinks cold for 24 hours or hot for 12.",
    category: "Sports & Outdoors",
    brand: "Ridgeline",
    status: "active",
    price: 24.5,
    costPrice: 9.8,
    stock: 1240,
    createdAt: "2023-09-25T07:45:00Z",
    updatedAt: "2026-07-14T08:50:00Z",
  },
  {
    id: "PRD-2078",
    name: "Walnut Standing Desk, 160 × 80 cm",
    sku: "FUR-DSK-WLN-160",
    description:
      "Dual-motor sit-stand desk with a solid walnut top and four programmable height presets.",
    category: "Furniture",
    brand: "Oakmoor",
    status: "inactive",
    price: 899,
    costPrice: 512,
    stock: 14,
    createdAt: "2024-04-08T15:30:00Z",
    updatedAt: "2026-06-27T12:15:00Z",
  },
  {
    id: "PRD-2090",
    name: "Hot-Swappable Mechanical Keyboard, 75%",
    sku: "ELC-KBD-75-HS",
    description:
      "Compact wireless keyboard with a gasket-mounted frame and hot-swappable switches.",
    category: "Electronics",
    brand: "Keywave",
    status: "active",
    price: 129,
    costPrice: 71.4,
    stock: 0,
    createdAt: "2025-05-30T09:10:00Z",
    updatedAt: "2026-09-29T18:35:00Z",
  },
  {
    id: "PRD-2104",
    name: "A5 Dot Grid Notebook, 3-Pack",
    sku: "OFF-NTB-A5-3PK",
    description: null,
    category: "Office Supplies",
    brand: null,
    status: "active",
    price: 8.49,
    costPrice: 3.1,
    stock: 530,
    createdAt: "2022-12-12T11:00:00Z",
    updatedAt: "2026-02-09T10:05:00Z",
  },
  {
    id: "PRD-2111",
    name: "USB-C Braided Charging Cable, 2 m",
    sku: "ACC-CBL-USBC-2M",
    description: "Braided 100 W USB-C cable with reinforced connectors.",
    category: "Accessories",
    brand: "Voltline",
    status: "active",
    price: 12.99,
    costPrice: 3.4,
    stock: 0,
    createdAt: "2024-01-22T12:40:00Z",
    updatedAt: "2026-10-03T07:20:00Z",
  },
  {
    id: "PRD-2126",
    name: "Stainless Steel Pour-Over Coffee Dripper Set with Reusable Filter",
    sku: "HK-CFE-DRP-SS",
    description:
      "Dripper, carafe and permanent mesh filter in one set. Dishwasher safe.",
    category: "Home & Kitchen",
    brand: "Hearthstone",
    status: "inactive",
    price: 54,
    costPrice: null,
    stock: 37,
    createdAt: "2025-08-14T10:55:00Z",
    updatedAt: "2026-04-03T13:30:00Z",
  },
  {
    id: "PRD-2139",
    name: "Adjustable Dumbbell Set, 2 × 24 kg",
    sku: "SPT-DMB-ADJ-48",
    description:
      "A pair of dumbbells that adjust from 4 kg to 24 kg in 2 kg steps, with a storage tray.",
    category: "Sports & Outdoors",
    brand: "Ridgeline",
    status: "active",
    price: 479,
    costPrice: 301,
    stock: 23,
    createdAt: "2026-09-08T09:00:00Z",
    updatedAt: "2026-09-08T09:00:00Z",
  },
]

// Simulates a larger result set so the pagination controls can be reviewed.
export const mockTotalProducts = 134

export function getMockProductById(productId: string) {
  return mockProducts.find((product) => product.id === productId)
}

// Newest first. The actors are the dashboard users from the users mock data;
// a null actor is an automatic change.
const mockProductHistory: Record<string, ProductHistoryEntry[]> = {
  "PRD-2041": [
    {
      id: "PRD-2041-3",
      change: "Price changed from $269.00 to $249.00",
      occurredAt: "2026-09-18T14:05:00Z",
      actor: "Priya Raman",
    },
    {
      id: "PRD-2041-2",
      change: "Stock updated from 96 to 184",
      occurredAt: "2026-08-02T09:30:00Z",
      actor: "Jonathan Whitfield",
    },
    {
      id: "PRD-2041-1",
      change: "Product created",
      occurredAt: "2025-02-11T10:20:00Z",
      actor: "Priya Raman",
    },
  ],
  "PRD-2042": [
    {
      id: "PRD-2042-2",
      change: "Stock updated from 41 to 62",
      occurredAt: "2026-05-21T11:40:00Z",
      actor: "Jonathan Whitfield",
    },
    {
      id: "PRD-2042-1",
      change: "Product created",
      occurredAt: "2024-06-03T08:15:00Z",
      actor: "Sofia Marchetti",
    },
  ],
  "PRD-2057": [
    {
      id: "PRD-2057-3",
      change: "Stock updated from 34 to 9",
      occurredAt: "2026-10-01T16:25:00Z",
      actor: null,
    },
    {
      id: "PRD-2057-2",
      change: "Price changed from $349.00 to $329.00",
      occurredAt: "2026-03-12T10:10:00Z",
      actor: "Priya Raman",
    },
    {
      id: "PRD-2057-1",
      change: "Product created",
      occurredAt: "2024-11-19T13:00:00Z",
      actor: "Jonathan Whitfield",
    },
  ],
  "PRD-2063": [
    {
      id: "PRD-2063-2",
      change: "Stock updated from 880 to 1,240",
      occurredAt: "2026-07-14T08:50:00Z",
      actor: "Jonathan Whitfield",
    },
    {
      id: "PRD-2063-1",
      change: "Product created",
      occurredAt: "2023-09-25T07:45:00Z",
      actor: "Sofia Marchetti",
    },
  ],
  "PRD-2078": [
    {
      id: "PRD-2078-3",
      change: "Status changed from Active to Inactive",
      occurredAt: "2026-06-27T12:15:00Z",
      actor: "Priya Raman",
    },
    {
      id: "PRD-2078-2",
      change: "Price changed from $949.00 to $899.00",
      occurredAt: "2025-11-05T09:00:00Z",
      actor: "Sofia Marchetti",
    },
    {
      id: "PRD-2078-1",
      change: "Product created",
      occurredAt: "2024-04-08T15:30:00Z",
      actor: "Jonathan Whitfield",
    },
  ],
  "PRD-2090": [
    {
      id: "PRD-2090-2",
      change: "Stock updated from 3 to 0",
      occurredAt: "2026-09-29T18:35:00Z",
      actor: null,
    },
    {
      id: "PRD-2090-1",
      change: "Product created",
      occurredAt: "2025-05-30T09:10:00Z",
      actor: "Jonathan Whitfield",
    },
  ],
  "PRD-2104": [
    {
      id: "PRD-2104-2",
      change: "Price changed from $7.99 to $8.49",
      occurredAt: "2026-02-09T10:05:00Z",
      actor: "Sofia Marchetti",
    },
    {
      id: "PRD-2104-1",
      change: "Product created",
      occurredAt: "2022-12-12T11:00:00Z",
      actor: "Priya Raman",
    },
  ],
  "PRD-2111": [
    {
      id: "PRD-2111-2",
      change: "Stock updated from 12 to 0",
      occurredAt: "2026-10-03T07:20:00Z",
      actor: null,
    },
    {
      id: "PRD-2111-1",
      change: "Product created",
      occurredAt: "2024-01-22T12:40:00Z",
      actor: "Jonathan Whitfield",
    },
  ],
  "PRD-2126": [
    {
      id: "PRD-2126-2",
      change: "Status changed from Active to Inactive",
      occurredAt: "2026-04-03T13:30:00Z",
      actor: "Jonathan Whitfield",
    },
    {
      id: "PRD-2126-1",
      change: "Product created",
      occurredAt: "2025-08-14T10:55:00Z",
      actor: "Priya Raman",
    },
  ],
  "PRD-2139": [
    {
      id: "PRD-2139-1",
      change: "Product created",
      occurredAt: "2026-09-08T09:00:00Z",
      actor: "Sofia Marchetti",
    },
  ],
}

export function getMockProductHistory(productId: string) {
  return mockProductHistory[productId] ?? []
}
