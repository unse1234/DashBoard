import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"

import { CustomerAddresses } from "@/components/customers/customer-addresses"
import { CustomerDetailsHeader } from "@/components/customers/customer-details-header"
import { CustomerInformation } from "@/components/customers/customer-information"
import { CustomerRecentOrders } from "@/components/customers/customer-recent-orders"
import { CustomerSummary } from "@/components/customers/customer-summary"
import {
  getMockCustomerAddresses,
  getMockCustomerById,
} from "@/lib/customers/customer.mock-data"
import { getMockCustomerRecentOrders } from "@/lib/customers/customer-order.mock-data"

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }))

function getCustomer(customerId: string) {
  return getMockCustomerById(customerId)!
}

function getValue(label: string) {
  const term = screen.getByText(label, { selector: "dt" })
  return term.nextElementSibling as HTMLElement
}

afterEach(() => {
  vi.clearAllMocks()
})

describe("CustomerDetailsHeader", () => {
  it("shows the name, customer ID and status", () => {
    render(<CustomerDetailsHeader customer={getCustomer("CUS-1002")} />)

    expect(
      screen.getByRole("heading", { level: 2, name: "Daniel Reyes" })
    ).toBeInTheDocument()
    expect(screen.getByText("CUS-1002")).toBeInTheDocument()
    expect(screen.getByText("Active")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Disable customer" })
    ).toBeInTheDocument()
  })

  it("disables an active customer and says so", async () => {
    render(<CustomerDetailsHeader customer={getCustomer("CUS-1002")} />)
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: "Disable customer" }))

    expect(screen.getByText("Inactive")).toBeInTheDocument()
    expect(screen.queryByText("Active")).toBeNull()
    expect(
      screen.getByRole("button", { name: "Enable customer" })
    ).toBeInTheDocument()
    expect(toast.success).toHaveBeenCalledWith("Daniel Reyes is now inactive.")
  })

  it("offers Enable for an inactive customer and enables them", async () => {
    render(<CustomerDetailsHeader customer={getCustomer("CUS-1007")} />)
    const user = userEvent.setup()

    expect(screen.getByText("Inactive")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Enable customer" }))

    expect(screen.getByText("Active")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Disable customer" })
    ).toBeInTheDocument()
    expect(toast.success).toHaveBeenCalledWith("Lucas Ferreira is now active.")
  })
})

describe("CustomerSummary", () => {
  it("shows total orders, total spent and the last order date", () => {
    render(<CustomerSummary customer={getCustomer("CUS-1002")} />)

    expect(getValue("Total Orders")).toHaveTextContent("23")
    expect(getValue("Total Spent")).toHaveTextContent("$6,212.40")
    expect(getValue("Last Order")).toHaveTextContent("Sep 29, 2026")
  })

  it("says so when the customer has not ordered yet", () => {
    render(<CustomerSummary customer={getCustomer("CUS-1066")} />)

    expect(getValue("Total Orders")).toHaveTextContent("0")
    expect(getValue("Total Spent")).toHaveTextContent("$0.00")
    expect(getValue("Last Order")).toHaveTextContent("No orders yet")
  })
})

describe("CustomerInformation", () => {
  it("shows the basic information", () => {
    render(<CustomerInformation customer={getCustomer("CUS-1009")} />)

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
    render(<CustomerInformation customer={getCustomer("CUS-1007")} />)

    expect(getValue("Phone")).toHaveTextContent("Not provided")
  })

  it("leaves the status to the header, which owns the Enable / Disable button", () => {
    render(<CustomerInformation customer={getCustomer("CUS-1007")} />)

    expect(screen.queryByText("Status", { selector: "dt" })).toBeNull()
  })
})

describe("CustomerAddresses", () => {
  it("groups a customer's addresses into shipping and billing", () => {
    render(<CustomerAddresses addresses={getMockCustomerAddresses("CUS-1018")} />)

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
    render(<CustomerAddresses addresses={getMockCustomerAddresses("CUS-1024")} />)

    const address = document.querySelector("address")!
    expect(address).toHaveTextContent("Dubai")
    expect(address).toHaveTextContent("United Arab Emirates")
    expect(address.textContent).not.toMatch(/null|undefined/)
  })

  it("says which type has nothing saved", () => {
    render(<CustomerAddresses addresses={getMockCustomerAddresses("CUS-1024")} />)

    expect(screen.getByText("None saved")).toBeInTheDocument()
    expect(document.querySelectorAll("address")).toHaveLength(1)
  })

  it("marks the default only when a type has several addresses", () => {
    const { unmount } = render(
      <CustomerAddresses addresses={getMockCustomerAddresses("CUS-1001")} />
    )

    // Two shipping addresses, one of them the default; billing has just one.
    expect(screen.getAllByText("Default")).toHaveLength(1)
    expect(document.querySelectorAll("address")).toHaveLength(3)
    unmount()

    render(<CustomerAddresses addresses={getMockCustomerAddresses("CUS-1002")} />)
    expect(screen.queryByText("Default")).toBeNull()
  })

  it("shows the empty state when no address is saved", () => {
    render(<CustomerAddresses addresses={[]} />)

    expect(
      screen.getByText("No addresses are saved for this customer.")
    ).toBeInTheDocument()
    expect(screen.queryByRole("heading", { level: 4 })).toBeNull()
  })
})

describe("CustomerRecentOrders", () => {
  function renderOrders(customerId: string) {
    const customer = getCustomer(customerId)
    return render(
      <CustomerRecentOrders
        orders={getMockCustomerRecentOrders(customerId)}
        totalOrders={customer.totalOrders}
      />
    )
  }

  it("lists the latest orders with their ID, date, total and status", () => {
    renderOrders("CUS-1001")

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

  it("shows the order's date under its ID too, for narrow cards", () => {
    renderOrders("CUS-1036")

    const [id] = within(screen.getAllByRole("row")[1]).getAllByRole("cell")
    expect(within(id).getByText("Feb 11, 2025")).toBeInTheDocument()
  })

  it("shows a cancelled order as cancelled", () => {
    renderOrders("CUS-1021")

    expect(screen.getByText("Cancelled")).toBeInTheDocument()
  })

  it("says how many orders there are when only the latest are listed", () => {
    renderOrders("CUS-1001")

    expect(
      screen.getByText("Showing the 3 most recent of 41 orders.")
    ).toBeInTheDocument()
  })

  it("does not say it when every order is listed", () => {
    renderOrders("CUS-1027")

    expect(screen.queryByText(/most recent of/)).toBeNull()
  })

  it("keeps the scrolling table reachable by keyboard", () => {
    renderOrders("CUS-1001")

    const region = screen.getByRole("region", { name: "Recent orders" })
    expect(region).toHaveAttribute("tabindex", "0")
    expect(within(region).getByRole("table")).toBeInTheDocument()
  })

  it("does not link orders until there is an Orders page to link to", () => {
    renderOrders("CUS-1001")

    expect(screen.queryByRole("link")).toBeNull()
  })

  it("shows the empty state for a customer without orders", () => {
    renderOrders("CUS-1042")

    expect(
      screen.getByText("This customer has not placed any orders yet.")
    ).toBeInTheDocument()
    expect(screen.queryByRole("table")).toBeNull()
  })
})
