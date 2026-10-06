import { render, screen, within } from "@testing-library/react"

import { OrderAddresses } from "@/components/orders/order-addresses"
import { OrderCustomerInformation } from "@/components/orders/order-customer-information"
import { OrderDetailsHeader } from "@/components/orders/order-details-header"
import { OrderItemsTable } from "@/components/orders/order-items-table"
import { OrderPriceBreakdown } from "@/components/orders/order-price-breakdown"
import { getMockOrderById } from "@/lib/orders/order.mock-data"

function getOrder(orderId: string) {
  return getMockOrderById(orderId)!
}

function getValue(label: string) {
  const term = screen.getByText(label, { selector: "dt" })
  return term.nextElementSibling as HTMLElement
}

describe("OrderDetailsHeader summary", () => {
  it("shows the order ID as the heading", () => {
    render(<OrderDetailsHeader order={getOrder("ORD-31620")} />)

    expect(
      screen.getByRole("heading", { level: 2, name: "Order ORD-31620" })
    ).toBeInTheDocument()
  })

  it("shows the statuses, creation date and total", () => {
    render(<OrderDetailsHeader order={getOrder("ORD-31620")} />)

    expect(within(getValue("Order Status")).getByText("Shipped")).toBeInTheDocument()
    expect(within(getValue("Payment Status")).getByText("Paid")).toBeInTheDocument()
    expect(getValue("Created At")).toHaveTextContent("Sep 29, 2026, 8:40 AM UTC")
    expect(getValue("Total")).toHaveTextContent("$189.90")
  })

  it("shows a pending payment next to a pending order without mixing them up", () => {
    render(<OrderDetailsHeader order={getOrder("ORD-31640")} />)

    expect(within(getValue("Order Status")).getByText("Pending")).toBeInTheDocument()
    expect(within(getValue("Payment Status")).getByText("Pending")).toBeInTheDocument()
  })
})

describe("OrderItemsTable", () => {
  it("shows the columns and one row per item", () => {
    const order = getOrder("ORD-31624")
    render(<OrderItemsTable items={order.items} />)

    expect(
      screen
        .getAllByRole("columnheader")
        .map((header) => header.textContent?.trim())
    ).toEqual(["Product", "SKU", "Quantity", "Unit Price", "Total"])
    expect(screen.getAllByRole("row")).toHaveLength(order.items.length + 1)
  })

  it("shows each item's SKU, quantity, unit price and line total", () => {
    render(<OrderItemsTable items={getOrder("ORD-31624").items} />)
    const row = within(
      screen.getByRole("row", { name: /Trail Insulated Water Bottle/ })
    )

    expect(row.getByText("SPT-BTL-750-GRN")).toBeInTheDocument()
    expect(row.getByText("2")).toBeInTheDocument()
    expect(row.getByText("$24.50")).toBeInTheDocument()
    expect(row.getByText("$49.00")).toBeInTheDocument()
  })

  it("links each product to its details page", () => {
    render(<OrderItemsTable items={getOrder("ORD-31624").items} />)

    expect(
      screen.getByRole("link", { name: "Trail Insulated Water Bottle, 750 ml" })
    ).toHaveAttribute("href", "/dashboard/products/PRD-2063")
    expect(
      screen.getByRole("link", {
        name: "Stainless Steel Pour-Over Coffee Dripper Set with Reusable Filter",
      })
    ).toHaveAttribute("href", "/dashboard/products/PRD-2126")
  })

  it("is a named, focusable region so a narrow table can be scrolled by keyboard", () => {
    render(<OrderItemsTable items={getOrder("ORD-31656").items} />)

    expect(screen.getByRole("region", { name: "Order items" })).toHaveAttribute(
      "tabindex",
      "0"
    )
  })
})

describe("OrderPriceBreakdown", () => {
  it("shows each part of the price and the total", () => {
    render(<OrderPriceBreakdown order={getOrder("ORD-31624")} />)

    expect(getValue("Subtotal")).toHaveTextContent("$103.00")
    expect(getValue("Shipping")).toHaveTextContent("$6.50")
    expect(getValue("Discount")).toHaveTextContent("−$15.00")
    expect(getValue("Tax")).toHaveTextContent("$0.00")
    expect(getValue("Total")).toHaveTextContent("$94.50")
  })

  it("shows tax when the order has some", () => {
    render(<OrderPriceBreakdown order={getOrder("ORD-31620")} />)

    expect(getValue("Tax")).toHaveTextContent("$11.00")
    expect(getValue("Total")).toHaveTextContent("$189.90")
  })

  it("shows no minus sign without a discount", () => {
    render(<OrderPriceBreakdown order={getOrder("ORD-31656")} />)

    expect(getValue("Discount")).toHaveTextContent("$0.00")
    expect(getValue("Discount")).not.toHaveTextContent("−")
  })
})

describe("OrderCustomerInformation", () => {
  it("shows the customer's details", () => {
    render(
      <OrderCustomerInformation customer={getOrder("ORD-31656").customer} />
    )

    expect(getValue("Name")).toHaveTextContent("Margaret Okafor-Williams")
    expect(getValue("Customer ID")).toHaveTextContent("CUS-1001")
    expect(getValue("Email")).toHaveTextContent("margaret.okafor@brightwater.co.uk")
    expect(getValue("Phone")).toHaveTextContent("+44 20 7946 0958")
  })

  it("links the name to the customer's details page", () => {
    render(
      <OrderCustomerInformation customer={getOrder("ORD-31656").customer} />
    )

    expect(
      screen.getByRole("link", { name: "Margaret Okafor-Williams" })
    ).toHaveAttribute("href", "/dashboard/customers/CUS-1001")
  })

  it("says when there is no phone number", () => {
    render(
      <OrderCustomerInformation customer={getOrder("ORD-31416").customer} />
    )

    expect(getValue("Phone")).toHaveTextContent("Not provided")
  })
})

describe("OrderAddresses", () => {
  function getAddress(heading: string) {
    return screen.getByRole("heading", { name: heading })
      .nextElementSibling as HTMLElement
  }

  it("shows the shipping and billing addresses under their own headings", () => {
    render(<OrderAddresses order={getOrder("ORD-31604")} />)

    expect(getAddress("Shipping address")).toHaveTextContent("Isabella Fontaine")
    expect(getAddress("Shipping address")).toHaveTextContent(
      "1450 West Georgia Street"
    )
    expect(getAddress("Shipping address")).toHaveTextContent(
      "Vancouver, BC V6G 2T6"
    )
    expect(getAddress("Billing address")).toHaveTextContent(
      "Fontaine & Daughters Boutique Hotels Ltd."
    )
    expect(getAddress("Billing address")).toHaveTextContent("Canada")
  })

  it("shows the recipient's phone number when there is one", () => {
    render(<OrderAddresses order={getOrder("ORD-31604")} />)

    expect(getAddress("Shipping address")).toHaveTextContent("+1 (604) 555-0163")
    expect(getAddress("Billing address")).not.toHaveTextContent("555")
  })

  it("leaves out the lines that are not set", () => {
    render(<OrderAddresses order={getOrder("ORD-31640")} />)

    // No second street line and no postcode or region.
    expect(
      Array.from(getAddress("Shipping address").children).map(
        (line) => line.textContent
      )
    ).toEqual([
      "Omar Haddad",
      "+971 4 555 0176",
      "Villa 22, Street 14, Al Barsha 2",
      "Dubai",
      "United Arab Emirates",
    ])
  })
})
