import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"

import { useAuth } from "@/hooks/auth/use-auth"
import { ApiError } from "@/lib/api/api-error"
import { getCustomerDetails } from "@/services/customers/customer.api"
import type { CustomerDetails as CustomerDetailsData } from "@/types/customer.types"
import { CustomerAddresses } from "@/screens/customers/details/components/customer-addresses"
import { CustomerDetails } from "@/screens/customers/details/components/customer-details"
import { CustomerDetailsHeader } from "@/screens/customers/details/components/customer-details-header"
import { CustomerInformation } from "@/screens/customers/details/components/customer-information"
import { CustomerRecentOrders } from "@/screens/customers/details/components/customer-recent-orders"
import { CustomerSummary } from "@/screens/customers/details/components/customer-summary"
import { createAuthUser } from "@/test-utils/auth-fixtures"
import {
  createCustomer,
  createCustomerAddress,
  createCustomerDetails,
  createCustomerOrder,
  createCustomerOrderAddress,
} from "@/test-utils/customer-fixtures"
import { renderWithQuery } from "@/test-utils/render"

vi.mock("@/services/customers/customer.api")
vi.mock("@/hooks/auth/use-auth")

const daniel = createCustomer({
  id: "CUS-1002",
  name: "Daniel Reyes",
  totalOrders: 23,
  totalSpent: 6212.4,
  spentByCurrency: [{ currency: "USD", amount: 6212.4 }],
  lastOrderAt: "2026-09-29T09:30:00Z",
})

function getValue(label: string) {
  const term = screen.getByText(label, { selector: "dt" })
  return term.nextElementSibling as HTMLElement
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(useAuth).mockReturnValue({
    status: "authenticated",
    user: createAuthUser({ role: "STAFF" }),
  })
})

describe("CustomerDetails", () => {
  const details = createCustomerDetails({ customer: daniel })

  it("shows a placeholder while loading, then the customer", async () => {
    let resolve: (value: CustomerDetailsData) => void = () => {}
    vi.mocked(getCustomerDetails).mockReturnValue(
      new Promise((res) => (resolve = res))
    )
    const { container } = renderWithQuery(
      <CustomerDetails customerId="CUS-1002" />
    )

    expect(container.querySelector("[aria-busy='true']")).toBeInTheDocument()
    expect(screen.queryByText("Customer information")).not.toBeInTheDocument()

    resolve(details)
    expect(
      await screen.findByRole("heading", { level: 2, name: "Daniel Reyes" })
    ).toBeInTheDocument()
    expect(container.querySelector("[aria-busy='true']")).toBeNull()
    expect(getCustomerDetails).toHaveBeenCalledWith(
      "CUS-1002",
      expect.any(AbortSignal)
    )
  })

  it("puts every card on the page", async () => {
    vi.mocked(getCustomerDetails).mockResolvedValue(details)
    renderWithQuery(<CustomerDetails customerId="CUS-1002" />)

    await screen.findByRole("heading", { level: 2, name: "Daniel Reyes" })
    expect(getValue("Total Orders")).toHaveTextContent("23")
    expect(
      screen.getByRole("heading", { level: 3, name: "Customer information" })
    ).toBeInTheDocument()
    expect(screen.getByRole("region", { name: "Recent orders" })).toBeVisible()
    expect(document.querySelectorAll("address")).toHaveLength(1)
  })

  it("shows a guest customer's delivery addresses on the page", async () => {
    vi.mocked(getCustomerDetails).mockResolvedValue(
      createCustomerDetails({
        customer: daniel,
        addresses: [],
        orderAddresses: [
          createCustomerOrderAddress({
            address: { addressLine1: "House 4, Street 9" },
            orderCount: 3,
          }),
        ],
      })
    )
    renderWithQuery(<CustomerDetails customerId="CUS-1002" />)

    await screen.findByRole("heading", { level: 2, name: "Daniel Reyes" })
    const address = document.querySelector("address")!
    expect(address).toHaveTextContent("House 4, Street 9")
    expect(address).toHaveTextContent("3 orders")
    expect(screen.queryByText("None saved")).not.toBeInTheDocument()
  })

  it.each([404, 400])("treats a %i as an unknown customer", async (status) => {
    vi.mocked(getCustomerDetails).mockRejectedValue(
      new ApiError(status, ["Customer not found"])
    )

    renderWithQuery(<CustomerDetails customerId="CUS-404" />)

    expect(
      await screen.findByRole("heading", { name: "Customer not found" })
    ).toBeInTheDocument()
    expect(screen.queryByRole("alert")).toBeNull()
  })

  it("reports other failures with a way to try again", async () => {
    vi.mocked(getCustomerDetails)
      .mockRejectedValueOnce(new ApiError(500, ["internal detail"]))
      .mockResolvedValueOnce(details)
    renderWithQuery(<CustomerDetails customerId="CUS-1002" />)

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent("Couldn't load this customer")
    expect(alert).not.toHaveTextContent("internal detail")

    await userEvent.click(screen.getByRole("button", { name: "Try again" }))

    expect(
      await screen.findByRole("heading", { level: 2, name: "Daniel Reyes" })
    ).toBeInTheDocument()
    expect(getCustomerDetails).toHaveBeenCalledTimes(2)
  })

  it("does not show another customer's details while a different one loads", async () => {
    vi.mocked(getCustomerDetails).mockResolvedValueOnce(details)
    const { rerender } = renderWithQuery(
      <CustomerDetails customerId="CUS-1002" />
    )
    await screen.findByRole("heading", { level: 2, name: "Daniel Reyes" })

    vi.mocked(getCustomerDetails).mockReturnValueOnce(new Promise(() => {}))
    rerender(<CustomerDetails customerId="CUS-1003" />)

    expect(screen.queryByText("Daniel Reyes")).not.toBeInTheDocument()
    expect(getCustomerDetails).toHaveBeenLastCalledWith(
      "CUS-1003",
      expect.any(AbortSignal)
    )
  })
})

describe("CustomerDetailsHeader", () => {
  it("shows the name and customer ID", () => {
    render(<CustomerDetailsHeader customer={daniel} />)

    expect(
      screen.getByRole("heading", { level: 2, name: "Daniel Reyes" })
    ).toBeInTheDocument()
    expect(screen.getByText("CUS-1002")).toBeInTheDocument()
    expect(screen.queryByRole("button")).toBeNull()
  })
})

describe("CustomerSummary", () => {
  it("shows total orders, total spent and the last order date", () => {
    render(<CustomerSummary customer={daniel} />)

    expect(getValue("Total Orders")).toHaveTextContent("23")
    expect(getValue("Total Spent")).toHaveTextContent("$6,212.40")
    expect(getValue("Last Order")).toHaveTextContent("Sep 29, 2026")
  })

  it("says so when the customer has not ordered yet", () => {
    render(
      <CustomerSummary
        customer={createCustomer({
          totalOrders: 0,
          totalSpent: 0,
          spentByCurrency: [],
          lastOrderAt: null,
        })}
      />
    )

    expect(getValue("Total Orders")).toHaveTextContent("0")
    expect(getValue("Total Spent")).toHaveTextContent("Nothing yet")
    expect(getValue("Last Order")).toHaveTextContent("No orders yet")
  })

  it("shows what was spent in each currency, never one added-up figure", () => {
    render(
      <CustomerSummary
        customer={createCustomer({
          totalOrders: 3,
          // A bare sum of rupees and dollars, which means nothing.
          totalSpent: 6619.5,
          spentByCurrency: [
            { currency: "PKR", amount: 6499.5 },
            { currency: "USD", amount: 120 },
          ],
        })}
      />
    )

    expect(getValue("Total Spent")).toHaveTextContent("PKR 6,499.50")
    expect(getValue("Total Spent")).toHaveTextContent("$120.00")
    expect(getValue("Total Spent")).not.toHaveTextContent("6,619.50")
  })
})

describe("CustomerInformation", () => {
  it("shows the basic information", () => {
    render(
      <CustomerInformation
        customer={createCustomer({
          id: "CUS-1009",
          name: "Priyanka Venkataraghavan-Subramaniam",
          email:
            "priyanka.venkataraghavan.subramaniam@kavericonsulting-international.in",
          phone: "+91 98765 43210",
          joinedAt: "2023-01-17T05:48:00Z",
        })}
      />
    )

    expect(
      screen.getByRole("heading", { level: 3, name: "Customer information" })
    ).toBeInTheDocument()
    expect(getValue("Full Name")).toHaveTextContent(
      "Priyanka Venkataraghavan-Subramaniam"
    )
    expect(getValue("Customer ID")).toHaveTextContent("CUS-1009")
    expect(getValue("Email")).toHaveTextContent(
      "priyanka.venkataraghavan.subramaniam@kavericonsulting-international.in"
    )
    expect(getValue("Phone")).toHaveTextContent("+91 98765 43210")
    expect(getValue("Joined At")).toHaveTextContent("Jan 17, 2023, 5:48 AM UTC")
  })

  it("marks a missing phone number", () => {
    render(<CustomerInformation customer={createCustomer({ phone: null })} />)

    expect(getValue("Phone")).toHaveTextContent("Not provided")
  })
})

describe("CustomerAddresses", () => {
  const dubai = createCustomerAddress({
    id: "addr-dubai",
    recipientName: "Omar Haddad",
    addressLine1: "Sheikh Zayed Road 14",
    addressLine2: null,
    city: "Dubai",
    region: null,
    postalCode: null,
    country: "United Arab Emirates",
  })

  it("groups a customer's addresses into shipping and billing", () => {
    render(
      <CustomerAddresses
        addresses={[
          createCustomerAddress({
            id: "addr-ship",
            recipientName: "Giulia Romano",
            phone: "+39 06 5550 1982",
            addressLine1: "Via dei Fori Imperiali 23",
            city: "Roma",
            region: "RM",
            postalCode: "00186",
            country: "Italy",
          }),
          createCustomerAddress({
            id: "addr-bill",
            type: "billing",
            recipientName: "Studio Romano S.r.l.",
            addressLine1: "Via Appia Nuova 112",
            addressLine2: "Interno 5",
            city: "Roma",
            region: "RM",
            postalCode: "00183",
            country: "Italy",
          }),
        ]}
        orderAddresses={[]}
      />
    )

    expect(
      screen.getByRole("heading", { level: 4, name: "Shipping address" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { level: 4, name: "Billing address" })
    ).toBeInTheDocument()

    const addresses = document.querySelectorAll("address")
    expect(addresses).toHaveLength(2)
    expect(addresses[0]).toHaveTextContent("Giulia Romano")
    expect(addresses[0]).toHaveTextContent("+39 06 5550 1982")
    expect(addresses[0]).toHaveTextContent("Via dei Fori Imperiali 23")
    expect(addresses[0]).toHaveTextContent("Roma, RM 00186")
    expect(addresses[0]).toHaveTextContent("Italy")
    expect(addresses[1]).toHaveTextContent("Studio Romano S.r.l.")
    expect(addresses[1]).toHaveTextContent("Via Appia Nuova 112")
    expect(addresses[1]).toHaveTextContent("Interno 5")
  })

  it("leaves out the details an address does not have", () => {
    render(<CustomerAddresses addresses={[dubai]} orderAddresses={[]} />)

    const address = document.querySelector("address")!
    expect(address).toHaveTextContent("Dubai")
    expect(address).toHaveTextContent("United Arab Emirates")
    expect(address.textContent).not.toMatch(/null|undefined/)
  })

  it("says which type has nothing saved", () => {
    render(<CustomerAddresses addresses={[dubai]} orderAddresses={[]} />)

    expect(screen.getByText("None saved")).toBeInTheDocument()
    expect(document.querySelectorAll("address")).toHaveLength(1)
  })

  it("marks the default only when a type has several addresses", () => {
    const { unmount } = render(
      <CustomerAddresses
        addresses={[
          createCustomerAddress({ id: "a1", isDefault: true }),
          createCustomerAddress({ id: "a2", isDefault: false }),
          createCustomerAddress({ id: "a3", type: "billing", isDefault: true }),
        ]}
        orderAddresses={[]}
      />
    )

    // Two shipping addresses, one of them the default; billing has just one.
    expect(screen.getAllByText("Default")).toHaveLength(1)
    expect(document.querySelectorAll("address")).toHaveLength(3)
    unmount()

    render(
      <CustomerAddresses
        addresses={[
          createCustomerAddress({ id: "b1", isDefault: true }),
          createCustomerAddress({ id: "b2", type: "billing", isDefault: true }),
        ]}
        orderAddresses={[]}
      />
    )
    expect(screen.queryByText("Default")).toBeNull()
  })

  it("shows the empty state when no address is saved and none was delivered to", () => {
    render(<CustomerAddresses addresses={[]} orderAddresses={[]} />)

    expect(
      screen.getByText("No addresses are saved for this customer.")
    ).toBeInTheDocument()
    expect(screen.queryByRole("heading", { level: 4 })).toBeNull()
  })

  describe("addresses their orders were delivered to", () => {
    const home = createCustomerOrderAddress({
      address: {
        recipientName: "Hira Khan",
        addressLine1: "House 4, Street 9",
      },
      lastUsedAt: "2026-10-14T07:44:00Z",
      orderCount: 3,
    })
    const office = createCustomerOrderAddress({
      address: {
        recipientName: "Hira Khan",
        phone: null,
        addressLine1: "Office 2, Main Road",
        addressLine2: "Second floor",
        postalCode: null,
      },
      lastUsedAt: "2026-09-02T09:00:00Z",
      orderCount: 1,
    })

    it("shows a guest's delivery addresses although none is saved", () => {
      render(
        <CustomerAddresses addresses={[]} orderAddresses={[home, office]} />
      )

      expect(
        screen.getByText(/No addresses are saved for this customer\./)
      ).toHaveTextContent(
        "These are the addresses their orders were delivered to."
      )
      expect(
        screen.getByRole("heading", {
          level: 4,
          name: "Delivered to on orders",
        })
      ).toBeInTheDocument()

      const blocks = document.querySelectorAll("address")
      expect(blocks).toHaveLength(2)
      expect(blocks[0]).toHaveTextContent("Hira Khan")
      expect(blocks[0]).toHaveTextContent("+923001234567")
      expect(blocks[0]).toHaveTextContent("House 4, Street 9")
      expect(blocks[0]).toHaveTextContent("Dera Ismail Khan, KPK 29111")
      expect(blocks[0]).toHaveTextContent("3 orders, last on Oct 14, 2026")
      expect(blocks[1]).toHaveTextContent("Office 2, Main Road")
      expect(blocks[1]).toHaveTextContent("Second floor")
      expect(blocks[1]).toHaveTextContent("1 order, last on Sep 2, 2026")
      expect(blocks[1].textContent).not.toMatch(/null|undefined/)
    })

    it("sits under the saved addresses, set apart, when there are some", () => {
      render(
        <CustomerAddresses
          addresses={[createCustomerAddress({ id: "saved-1" })]}
          orderAddresses={[home]}
        />
      )

      expect(
        screen.queryByText(/No addresses are saved for this customer\./)
      ).toBeNull()
      expect(
        screen.getByRole("heading", { level: 4, name: "Shipping address" })
      ).toBeInTheDocument()
      expect(
        screen.getByRole("heading", {
          level: 4,
          name: "Delivered to on orders",
        })
      ).toBeInTheDocument()
      // One saved address and one delivered-to address.
      expect(document.querySelectorAll("address")).toHaveLength(2)
    })

    it("is omitted when no order has an address to show", () => {
      render(
        <CustomerAddresses
          addresses={[createCustomerAddress({ id: "saved-1" })]}
          orderAddresses={[]}
        />
      )

      expect(
        screen.queryByRole("heading", { name: "Delivered to on orders" })
      ).toBeNull()
    })
  })
})

describe("CustomerRecentOrders", () => {
  const latest = [
    createCustomerOrder({
      id: "ORD-31656",
      total: 329,
      status: "processing",
      createdAt: "2026-10-04T13:20:00Z",
    }),
    createCustomerOrder({
      id: "ORD-31544",
      total: 74.9,
      status: "delivered",
      createdAt: "2026-09-12T08:00:00Z",
    }),
    createCustomerOrder({
      id: "ORD-31210",
      total: 18,
      status: "delivered",
      createdAt: "2026-08-30T17:45:00Z",
    }),
  ]

  function renderOrders(orders = latest, totalOrders = 41) {
    return render(
      <CustomerRecentOrders orders={orders} totalOrders={totalOrders} />
    )
  }

  it("lists the latest orders with their ID, date, total and status", () => {
    renderOrders()

    expect(
      screen
        .getAllByRole("columnheader")
        .map((header) => header.textContent?.trim())
    ).toEqual(["Order ID", "Date", "Total", "Status"])

    const rows = screen.getAllByRole("row").slice(1)
    expect(rows).toHaveLength(3)

    const [id, date, total, status] = within(rows[0]).getAllByRole("cell")
    expect(id).toHaveTextContent("ORD-31656")
    expect(date).toHaveTextContent("Oct 4, 2026")
    expect(total).toHaveTextContent("$329.00")
    expect(status).toHaveTextContent("Processing")
    expect(rows[1]).toHaveTextContent("Delivered")
  })

  it("shows each order's total in the currency it was placed in", () => {
    renderOrders(
      [
        createCustomerOrder({ id: "ORD-1", total: 4500, currency: "PKR" }),
        createCustomerOrder({ id: "ORD-2", total: 82.5, currency: "USD" }),
      ],
      2
    )

    const rows = screen.getAllByRole("row").slice(1)
    expect(rows[0]).toHaveTextContent("PKR 4,500.00")
    expect(rows[1]).toHaveTextContent("$82.50")
  })

  it("shows the order's date under its ID too, for narrow cards", () => {
    renderOrders(
      [createCustomerOrder({ createdAt: "2025-02-11T10:00:00Z" })],
      1
    )

    const [id] = within(screen.getAllByRole("row")[1]).getAllByRole("cell")
    expect(within(id).getByText("Feb 11, 2025")).toBeInTheDocument()
  })

  it("shows a cancelled order as cancelled", () => {
    renderOrders([createCustomerOrder({ status: "cancelled" })], 1)

    expect(screen.getByText("Cancelled")).toBeInTheDocument()
  })

  it("says how many orders there are when only the latest are listed", () => {
    renderOrders()

    expect(
      screen.getByText("Showing the 3 most recent of 41 orders.")
    ).toBeInTheDocument()
  })

  it("does not say it when every order is listed", () => {
    renderOrders(latest.slice(0, 2), 2)

    expect(screen.queryByText(/most recent of/)).toBeNull()
  })

  it("keeps the scrolling table reachable by keyboard", () => {
    renderOrders()

    const region = screen.getByRole("region", { name: "Recent orders" })
    expect(region).toHaveAttribute("tabindex", "0")
    expect(within(region).getByRole("table")).toBeInTheDocument()
  })

  it("links each order ID to the order's details page", () => {
    renderOrders()

    expect(screen.getByRole("link", { name: "ORD-31656" })).toHaveAttribute(
      "href",
      "/dashboard/orders/ORD-31656"
    )
    expect(screen.getAllByRole("link")).toHaveLength(latest.length)
  })

  it("shows the empty state for a customer without orders", () => {
    renderOrders([], 0)

    expect(
      screen.getByText("This customer has not placed any orders yet.")
    ).toBeInTheDocument()
    expect(screen.queryByRole("table")).toBeNull()
  })
})
