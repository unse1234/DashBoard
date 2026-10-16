import type {
  Customer,
  CustomerAddress,
  CustomerDetails,
  CustomerOrderAddress,
  CustomerOrderSummary,
} from "@/types/customer.types"

/** A customer with a phone number and a few orders; override fields per test. */
export function createCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: "CUS-1001",
    name: "Olivia Martin",
    email: "olivia.martin@example.com",
    phone: "+1 415 555 0132",
    joinedAt: "2025-02-14T10:24:00Z",
    totalOrders: 3,
    totalSpent: 248.5,
    spentByCurrency: [{ currency: "PKR", amount: 248.5 }],
    lastOrderAt: "2026-09-02T08:12:00Z",
    ...overrides,
  }
}

export function createCustomerAddress(
  overrides: Partial<CustomerAddress> = {}
): CustomerAddress {
  return {
    id: "addr-1",
    customerId: "CUS-1001",
    type: "shipping",
    recipientName: "Olivia Martin",
    phone: null,
    addressLine1: "1 Market Street",
    addressLine2: null,
    city: "San Francisco",
    region: "CA",
    postalCode: "94105",
    country: "United States",
    isDefault: true,
    ...overrides,
  }
}

/** An address a customer's orders went to, as a guest checkout records it. */
export function createCustomerOrderAddress(
  overrides: Partial<Omit<CustomerOrderAddress, "address">> & {
    address?: Partial<CustomerOrderAddress["address"]>
  } = {}
): CustomerOrderAddress {
  const { address, ...rest } = overrides
  return {
    address: {
      recipientName: "Hira Khan",
      phone: "+923001234567",
      addressLine1: "House 4, Street 9",
      addressLine2: null,
      city: "Dera Ismail Khan",
      region: "KPK",
      postalCode: "29111",
      country: "PK",
      ...address,
    },
    lastUsedAt: "2026-10-14T07:44:00Z",
    orderCount: 1,
    ...rest,
  }
}

export function createCustomerOrder(
  overrides: Partial<CustomerOrderSummary> = {}
): CustomerOrderSummary {
  return {
    id: "ORD-10001",
    customerId: "CUS-1001",
    total: 82.5,
    currency: "PKR",
    status: "delivered",
    createdAt: "2026-09-02T08:12:00Z",
    ...overrides,
  }
}

export function createCustomerDetails(
  overrides: Partial<CustomerDetails> = {}
): CustomerDetails {
  return {
    customer: createCustomer(),
    addresses: [createCustomerAddress()],
    orderAddresses: [],
    recentOrders: [createCustomerOrder()],
    ...overrides,
  }
}
