import type {
  Order,
  OrderAddress,
  OrderCustomer,
  OrderItem,
  OrderStatus,
  PaymentStatus,
} from "@/lib/orders/order.types"

// Placeholder data until the orders API exists. `mockOrders` stands in for the
// page of results the list shows, newest first as the API would return them;
// the orders after it are not on that page but their details can still be
// opened. Orders keep a snapshot of their customer, address and product
// names and prices, so none of it is read from the Customers or Products mock
// data. The IDs are the same, though: each order here is also one of the
// customer's recent orders in `customer-order.mock-data.ts`, with the same
// customer, date, status and total. Product IDs and SKUs are those of the
// Products mock data, so the order items link to real product pages.

type CatalogItem = Pick<
  OrderItem,
  "productId" | "productName" | "sku" | "unitPrice"
>

const headphones: CatalogItem = {
  productId: "PRD-2041",
  productName: "Aurora Wireless Noise-Cancelling Headphones",
  sku: "AUD-ANC-500-BLK",
  unitPrice: 249,
}

const skillet: CatalogItem = {
  productId: "PRD-2042",
  productName: "Pre-Seasoned Cast Iron Skillet, 12 inch",
  sku: "HK-CIS-12",
  unitPrice: 39.95,
}

const chair: CatalogItem = {
  productId: "PRD-2057",
  productName:
    "Ergonomic Mesh Office Chair with Adjustable Lumbar Support and Headrest",
  sku: "FUR-CHR-MESH-02",
  unitPrice: 329,
}

const bottle: CatalogItem = {
  productId: "PRD-2063",
  productName: "Trail Insulated Water Bottle, 750 ml",
  sku: "SPT-BTL-750-GRN",
  unitPrice: 24.5,
}

const desk: CatalogItem = {
  productId: "PRD-2078",
  productName: "Walnut Standing Desk, 160 × 80 cm",
  sku: "FUR-DSK-WLN-160",
  unitPrice: 899,
}

const keyboard: CatalogItem = {
  productId: "PRD-2090",
  productName: "Hot-Swappable Mechanical Keyboard, 75%",
  sku: "ELC-KBD-75-HS",
  unitPrice: 129,
}

const dripper: CatalogItem = {
  productId: "PRD-2126",
  productName:
    "Stainless Steel Pour-Over Coffee Dripper Set with Reusable Filter",
  sku: "HK-CFE-DRP-SS",
  unitPrice: 54,
}

const dumbbells: CatalogItem = {
  productId: "PRD-2139",
  productName: "Adjustable Dumbbell Set, 2 × 24 kg",
  sku: "SPT-DMB-ADJ-48",
  unitPrice: 479,
}

type CustomerRecord = {
  customer: OrderCustomer
  shippingAddress: OrderAddress
  billingAddress: OrderAddress
}

function createCustomerRecord(
  customer: OrderCustomer,
  shippingAddress: OrderAddress,
  billingAddress: OrderAddress = shippingAddress
): CustomerRecord {
  return { customer, shippingAddress, billingAddress }
}

const margaret = createCustomerRecord(
  {
    id: "CUS-1001",
    name: "Margaret Okafor-Williams",
    email: "margaret.okafor@brightwater.co.uk",
    phone: "+44 20 7946 0958",
  },
  {
    recipientName: "Margaret Okafor-Williams",
    phone: "+44 20 7946 0958",
    addressLine1: "14 Alder Court",
    addressLine2: "Flat 3",
    city: "London",
    region: null,
    postalCode: "SE15 4QD",
    country: "United Kingdom",
  }
)

const daniel = createCustomerRecord(
  {
    id: "CUS-1002",
    name: "Daniel Reyes",
    email: "daniel.reyes@gmail.com",
    phone: "+1 (415) 555-0132",
  },
  {
    recipientName: "Daniel Reyes",
    phone: "+1 (415) 555-0132",
    addressLine1: "88 Hayes Street",
    addressLine2: "Apt 12",
    city: "San Francisco",
    region: "CA",
    postalCode: "94102",
    country: "United States",
  }
)

const aiko = createCustomerRecord(
  {
    id: "CUS-1004",
    name: "Aiko Tanabe",
    email: "aiko.tanabe@sakuramail.jp",
    phone: "+81 3 5550 1234",
  },
  {
    recipientName: "Aiko Tanabe",
    phone: "+81 3 5550 1234",
    addressLine1: "2-14-7 Higashi",
    addressLine2: "Sakura Heights 402",
    city: "Shibuya City",
    region: "Tokyo",
    postalCode: "150-0011",
    country: "Japan",
  },
  {
    recipientName: "Aiko Tanabe",
    phone: "+81 3 5550 1234",
    addressLine1: "1-8-3 Marunouchi",
    addressLine2: "9F",
    city: "Chiyoda City",
    region: "Tokyo",
    postalCode: "100-0005",
    country: "Japan",
  }
)

const priyanka = createCustomerRecord(
  {
    id: "CUS-1009",
    name: "Priyanka Venkataraghavan-Subramaniam",
    email: "priyanka.venkataraghavan.subramaniam@kavericonsulting-international.in",
    phone: "+91 98765 43210",
  },
  {
    recipientName: "Priyanka Venkataraghavan-Subramaniam",
    phone: "+91 98765 43210",
    addressLine1: "Plot 47, 3rd Cross, Indiranagar",
    addressLine2: "Near Metro Pillar 112, opposite Greenleaf Apartments",
    city: "Bengaluru",
    region: "Karnataka",
    postalCode: "560038",
    country: "India",
  },
  {
    recipientName: "Kaveri Consulting International Pvt Ltd",
    phone: null,
    addressLine1: "Level 6, Prestige Tech Park",
    addressLine2: "Outer Ring Road, Marathahalli",
    city: "Bengaluru",
    region: "Karnataka",
    postalCode: "560103",
    country: "India",
  }
)

const tobias = createCustomerRecord(
  {
    id: "CUS-1012",
    name: "Tobias Lindqvist",
    email: "tobias@lindqvist.se",
    phone: "+46 8 555 012 34",
  },
  {
    recipientName: "Tobias Lindqvist",
    phone: "+46 8 555 012 34",
    addressLine1: "Kungsgatan 12",
    addressLine2: null,
    city: "Stockholm",
    region: null,
    postalCode: "111 43",
    country: "Sweden",
  }
)

const wei = createCustomerRecord(
  {
    id: "CUS-1021",
    name: "Wei Chen",
    email: "wei.chen@lotusgroup.sg",
    phone: "+65 6555 0148",
  },
  {
    recipientName: "Wei Chen",
    phone: "+65 6555 0148",
    addressLine1: "30 Raffles Place",
    addressLine2: "#12-05 Chevron House",
    city: "Singapore",
    region: null,
    postalCode: "048622",
    country: "Singapore",
  }
)

const omar = createCustomerRecord(
  {
    id: "CUS-1024",
    name: "Omar Haddad",
    email: "omar.haddad@haddadtrading.ae",
    phone: "+971 4 555 0176",
  },
  {
    recipientName: "Omar Haddad",
    phone: "+971 4 555 0176",
    addressLine1: "Villa 22, Street 14, Al Barsha 2",
    addressLine2: null,
    city: "Dubai",
    region: null,
    postalCode: null,
    country: "United Arab Emirates",
  }
)

const fatou = createCustomerRecord(
  {
    id: "CUS-1033",
    name: "Fatou Diallo",
    email: "fatou.diallo@diallo-boutique.sn",
    phone: "+221 33 555 01 23",
  },
  {
    recipientName: "Fatou Diallo",
    phone: "+221 33 555 01 23",
    addressLine1: "Rue MZ 54, Mermoz",
    addressLine2: null,
    city: "Dakar",
    region: "Dakar",
    postalCode: null,
    country: "Senegal",
  }
)

const isabella = createCustomerRecord(
  {
    id: "CUS-1039",
    name: "Isabella Fontaine",
    email: "isabella.fontaine@fontaine-and-daughters-boutique-hotels.com",
    phone: "+1 (604) 555-0163",
  },
  {
    recipientName: "Isabella Fontaine",
    phone: "+1 (604) 555-0163",
    addressLine1: "1450 West Georgia Street",
    addressLine2: "Suite 2100",
    city: "Vancouver",
    region: "BC",
    postalCode: "V6G 2T6",
    country: "Canada",
  },
  {
    recipientName: "Fontaine & Daughters Boutique Hotels Ltd.",
    phone: null,
    addressLine1: "800-885 West Georgia Street",
    addressLine2: null,
    city: "Vancouver",
    region: "BC",
    postalCode: "V6C 3E8",
    country: "Canada",
  }
)

const mia = createCustomerRecord(
  {
    id: "CUS-1057",
    name: "Mia Johansson",
    email: "mia.johansson@gmail.com",
    phone: "+46 70 555 01 99",
  },
  {
    recipientName: "Mia Johansson",
    phone: "+46 70 555 01 99",
    addressLine1: "Linnégatan 41",
    addressLine2: "lgh 1203",
    city: "Göteborg",
    region: null,
    postalCode: "413 04",
    country: "Sweden",
  }
)

const chloe = createCustomerRecord(
  {
    id: "CUS-1063",
    name: "Chloe Bennett",
    email: "chloe.bennett@bennett.nz",
    phone: null,
  },
  {
    recipientName: "Chloe Bennett",
    phone: null,
    addressLine1: "12 Tory Street",
    addressLine2: null,
    city: "Wellington",
    region: "Wellington",
    postalCode: "6011",
    country: "New Zealand",
  }
)

type OrderSeed = {
  id: string
  customerRecord: CustomerRecord
  status: OrderStatus
  paymentStatus: PaymentStatus
  /** Each line as the product and how many were ordered. */
  lines: readonly (readonly [CatalogItem, number])[]
  shipping?: number
  discount?: number
  tax?: number
  createdAt: string
}

function roundToCents(amount: number) {
  return Math.round(amount * 100) / 100
}

// Works the item totals, subtotal and total out from the lines, so the amounts
// of an order cannot disagree with each other.
function createOrder({
  id,
  customerRecord,
  status,
  paymentStatus,
  lines,
  shipping = 0,
  discount = 0,
  tax = 0,
  createdAt,
}: OrderSeed): Order {
  const items = lines.map(([product, quantity], index) => ({
    id: `${id}-${index + 1}`,
    ...product,
    quantity,
    total: roundToCents(product.unitPrice * quantity),
  }))
  const subtotal = roundToCents(items.reduce((sum, item) => sum + item.total, 0))

  return {
    id,
    customer: customerRecord.customer,
    status,
    paymentStatus,
    items,
    subtotal,
    shipping,
    discount,
    tax,
    total: roundToCents(subtotal + shipping - discount + tax),
    shippingAddress: customerRecord.shippingAddress,
    billingAddress: customerRecord.billingAddress,
    createdAt,
  }
}

export const mockOrders: Order[] = [
  createOrder({
    id: "ORD-31656",
    customerRecord: margaret,
    status: "processing",
    paymentStatus: "paid",
    lines: [[chair, 1]],
    createdAt: "2026-10-04T14:22:00Z",
  }),
  createOrder({
    id: "ORD-31640",
    customerRecord: omar,
    status: "pending",
    paymentStatus: "pending",
    lines: [[desk, 1]],
    createdAt: "2026-10-03T12:10:00Z",
  }),
  createOrder({
    id: "ORD-31624",
    customerRecord: tobias,
    status: "shipped",
    paymentStatus: "paid",
    lines: [
      [bottle, 2],
      [dripper, 1],
    ],
    shipping: 6.5,
    discount: 15,
    createdAt: "2026-10-01T09:27:00Z",
  }),
  createOrder({
    id: "ORD-31620",
    customerRecord: daniel,
    status: "shipped",
    paymentStatus: "paid",
    lines: [
      [keyboard, 1],
      [skillet, 1],
    ],
    shipping: 9.95,
    tax: 11,
    createdAt: "2026-09-29T08:40:00Z",
  }),
  createOrder({
    id: "ORD-31604",
    customerRecord: isabella,
    status: "delivered",
    paymentStatus: "paid",
    lines: [
      [desk, 1],
      [chair, 1],
    ],
    discount: 100,
    createdAt: "2026-09-25T20:05:00Z",
  }),
  createOrder({
    id: "ORD-31588",
    customerRecord: aiko,
    status: "delivered",
    paymentStatus: "paid",
    lines: [
      [keyboard, 1],
      [bottle, 1],
    ],
    shipping: 4.5,
    createdAt: "2026-09-21T03:15:00Z",
  }),
  createOrder({
    id: "ORD-31572",
    customerRecord: margaret,
    status: "delivered",
    paymentStatus: "paid",
    lines: [
      [skillet, 1],
      [dripper, 1],
    ],
    shipping: 18.5,
    createdAt: "2026-09-18T10:05:00Z",
  }),
  createOrder({
    id: "ORD-31568",
    customerRecord: mia,
    status: "delivered",
    paymentStatus: "paid",
    lines: [
      [dripper, 2],
      [skillet, 1],
    ],
    shipping: 16.95,
    createdAt: "2026-09-17T09:00:00Z",
  }),
  createOrder({
    id: "ORD-31552",
    customerRecord: omar,
    status: "delivered",
    paymentStatus: "paid",
    lines: [[headphones, 1]],
    createdAt: "2026-09-15T07:44:00Z",
  }),
  createOrder({
    id: "ORD-31516",
    customerRecord: daniel,
    status: "delivered",
    paymentStatus: "paid",
    lines: [[skillet, 1]],
    createdAt: "2026-09-04T19:12:00Z",
  }),
]

export const mockOtherOrders: Order[] = [
  createOrder({
    id: "ORD-31500",
    customerRecord: fatou,
    status: "delivered",
    paymentStatus: "paid",
    lines: [[chair, 1]],
    shipping: 16.75,
    createdAt: "2026-09-02T11:25:00Z",
  }),
  createOrder({
    id: "ORD-31416",
    customerRecord: chloe,
    status: "delivered",
    paymentStatus: "paid",
    lines: [
      [skillet, 1],
      [bottle, 1],
    ],
    shipping: 10.5,
    createdAt: "2026-08-19T21:05:00Z",
  }),
  createOrder({
    id: "ORD-31396",
    customerRecord: tobias,
    status: "delivered",
    paymentStatus: "paid",
    lines: [[bottle, 1]],
    shipping: 12.25,
    createdAt: "2026-08-14T08:03:00Z",
  }),
  createOrder({
    id: "ORD-31344",
    customerRecord: isabella,
    status: "delivered",
    paymentStatus: "paid",
    lines: [
      [dumbbells, 1],
      [keyboard, 1],
      [bottle, 1],
    ],
    shipping: 16.5,
    createdAt: "2026-07-07T09:55:00Z",
  }),
  createOrder({
    id: "ORD-31312",
    customerRecord: priyanka,
    status: "delivered",
    paymentStatus: "paid",
    lines: [[dumbbells, 1]],
    createdAt: "2026-06-12T08:49:00Z",
  }),
  createOrder({
    id: "ORD-31224",
    customerRecord: wei,
    status: "cancelled",
    paymentStatus: "refunded",
    lines: [[keyboard, 1]],
    discount: 50,
    createdAt: "2025-12-12T13:05:00Z",
  }),
]

export const mockTotalOrders = mockOrders.length + mockOtherOrders.length

export function getMockOrderById(orderId: string) {
  return [...mockOrders, ...mockOtherOrders].find(
    (order) => order.id === orderId
  )
}
