import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"

import { useAuth } from "@/hooks/auth/use-auth"
import { ApiError } from "@/lib/api/api-error"
import { getOrder } from "@/services/orders/order.api"
import { OrderAddresses } from "@/screens/orders/details/components/order-addresses"
import { OrderCustomerInformation } from "@/screens/orders/details/components/order-customer-information"
import { OrderDetails } from "@/screens/orders/details/components/order-details"
import { OrderItemsTable } from "@/screens/orders/details/components/order-items-table"
import { OrderPriceBreakdown } from "@/screens/orders/details/components/order-price-breakdown"
import { createAuthUser } from "@/test-utils/auth-fixtures"
import {
  createOrder,
  createOrderAddress,
  createOrderCustomer,
  createOrderItem,
} from "@/test-utils/order-fixtures"
import { renderWithQuery } from "@/test-utils/render"

vi.mock("@/services/orders/order.api")
vi.mock("@/hooks/auth/use-auth")

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(useAuth).mockReturnValue({
    status: "authenticated",
    user: createAuthUser(),
  })
})

function getValue(label: string) {
  const term = screen.getByText(label, { selector: "dt" })
  return term.nextElementSibling as HTMLElement
}

const bottle = createOrderItem()
const dripper = createOrderItem({
  id: "item-2",
  productId: "PRD-2126",
  productName:
    "Stainless Steel Pour-Over Coffee Dripper Set with Reusable Filter",
  sku: "HK-DRP-SET",
  quantity: 1,
  unitPrice: 54,
  total: 54,
})

describe("OrderDetails", () => {
  it("shows the page's outline until the order arrives, then the order", async () => {
    let resolve: (value: ReturnType<typeof createOrder>) => void = () => {}
    vi.mocked(getOrder).mockReturnValue(new Promise((res) => (resolve = res)))
    const { container } = renderWithQuery(<OrderDetails orderId="ORD-10001" />)

    expect(container.querySelector("[aria-busy='true']")).not.toBeNull()
    expect(screen.queryByRole("heading", { level: 2 })).toBeNull()

    resolve(createOrder())
    expect(
      await screen.findByRole("heading", { level: 2, name: "Order ORD-10001" })
    ).toBeInTheDocument()
    expect(getOrder).toHaveBeenCalledWith("ORD-10001", expect.any(AbortSignal))
  })

  it("lays the order out: items, price, customer and addresses", async () => {
    vi.mocked(getOrder).mockResolvedValue(
      createOrder({ items: [bottle, dripper] })
    )
    renderWithQuery(<OrderDetails orderId="ORD-10001" />)

    await screen.findByRole("heading", { level: 2, name: "Order ORD-10001" })
    expect(
      screen.getByRole("heading", { level: 3, name: "Order items" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { level: 3, name: "Price breakdown" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { level: 3, name: "Customer" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: "Shipping address" })
    ).toBeInTheDocument()
    expect(screen.getAllByRole("row")).toHaveLength(3)
  })

  it("shows a storefront order's payment method and its total in rupees", async () => {
    vi.mocked(getOrder).mockResolvedValue(
      createOrder({
        paymentMethod: "cod",
        currency: "PKR",
        paymentStatus: "pending",
        status: "shipped",
        total: 4500,
        items: [createOrderItem({ unitPrice: 1500, quantity: 3, total: 4500 })],
        subtotal: 4500,
        shipping: 0,
        tax: 0,
      })
    )
    renderWithQuery(<OrderDetails orderId="ORD-10001" />)

    await screen.findByRole("heading", { level: 2, name: "Order ORD-10001" })
    expect(getValue("Payment Method")).toHaveTextContent("Cash on delivery")
    // In the summary card and again as the price breakdown's total.
    expect(screen.getAllByText("PKR 4,500.00").length).toBeGreaterThanOrEqual(2)
    expect(screen.queryByText(/\$/)).toBeNull()
  })

  it("says so when an order predates payment methods", async () => {
    vi.mocked(getOrder).mockResolvedValue(createOrder({ paymentMethod: null }))
    renderWithQuery(<OrderDetails orderId="ORD-10001" />)

    await screen.findByRole("heading", { level: 2, name: "Order ORD-10001" })
    expect(getValue("Payment Method")).toHaveTextContent("Not recorded")
  })

  it.each([404, 400])(
    "says the order was not found for a %s",
    async (status) => {
      vi.mocked(getOrder).mockRejectedValue(new ApiError(status, ["nope"]))
      renderWithQuery(<OrderDetails orderId="ORD-9" />)

      expect(await screen.findByText("Order not found")).toBeInTheDocument()
      expect(screen.queryByRole("alert")).toBeNull()
    }
  )

  it("explains any other failure and retries on request", async () => {
    vi.mocked(getOrder).mockRejectedValueOnce(
      new ApiError(500, ["internal detail"])
    )
    vi.mocked(getOrder).mockResolvedValue(createOrder())
    renderWithQuery(<OrderDetails orderId="ORD-10001" />)

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent("Couldn't load this order")
    expect(alert).not.toHaveTextContent("internal detail")

    await userEvent.click(screen.getByRole("button", { name: "Try again" }))

    expect(
      await screen.findByRole("heading", { level: 2, name: "Order ORD-10001" })
    ).toBeInTheDocument()
  })
})

describe("OrderItemsTable", () => {
  it("shows the columns and one row per item", () => {
    render(<OrderItemsTable items={[bottle, dripper]} currency="USD" />)

    expect(
      screen
        .getAllByRole("columnheader")
        .map((header) => header.textContent?.trim())
    ).toEqual(["Product", "SKU", "Quantity", "Unit Price", "Total"])
    expect(screen.getAllByRole("row")).toHaveLength(3)
  })

  it("shows each item's SKU, quantity, unit price and line total", () => {
    render(<OrderItemsTable items={[bottle, dripper]} currency="USD" />)
    const row = within(
      screen.getByRole("row", { name: /Trail Insulated Water Bottle/ })
    )

    expect(row.getByText("SPT-BTL-750-GRN")).toBeInTheDocument()
    expect(row.getByText("2")).toBeInTheDocument()
    expect(row.getByText("$24.50")).toBeInTheDocument()
    expect(row.getByText("$49.00")).toBeInTheDocument()
  })

  it("links each product to its details page", () => {
    render(<OrderItemsTable items={[bottle, dripper]} currency="USD" />)

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
    render(<OrderItemsTable items={[bottle]} currency="USD" />)

    expect(screen.getByRole("region", { name: "Order items" })).toHaveAttribute(
      "tabindex",
      "0"
    )
  })

  it("shows the unit price and line total in the order's currency", () => {
    render(
      <OrderItemsTable
        items={[createOrderItem({ unitPrice: 1500, quantity: 2, total: 3000 })]}
        currency="PKR"
      />
    )

    const row = within(
      screen.getByRole("row", { name: /Trail Insulated Water Bottle/ })
    )
    expect(row.getByText("PKR 1,500.00")).toBeInTheDocument()
    expect(row.getByText("PKR 3,000.00")).toBeInTheDocument()
    expect(screen.queryByText(/\$/)).toBeNull()
  })
})

describe("OrderPriceBreakdown", () => {
  it("shows each part of the price and the total", () => {
    render(
      <OrderPriceBreakdown
        order={{
          currency: "USD",
          subtotal: 103,
          shipping: 6.5,
          discount: 15,
          tax: 0,
          total: 94.5,
        }}
      />
    )

    expect(getValue("Subtotal")).toHaveTextContent("$103.00")
    expect(getValue("Shipping")).toHaveTextContent("$6.50")
    expect(getValue("Discount")).toHaveTextContent("−$15.00")
    expect(getValue("Tax")).toHaveTextContent("$0.00")
    expect(getValue("Total")).toHaveTextContent("$94.50")
  })

  it("shows every amount in the order's currency, never as dollars", () => {
    render(
      <OrderPriceBreakdown
        order={{
          currency: "PKR",
          subtotal: 159999,
          shipping: 0,
          discount: 0,
          tax: 0,
          total: 159999,
        }}
      />
    )

    expect(getValue("Subtotal")).toHaveTextContent("PKR 159,999.00")
    expect(getValue("Shipping")).toHaveTextContent("PKR 0.00")
    expect(getValue("Total")).toHaveTextContent("PKR 159,999.00")
    expect(screen.queryByText(/\$/)).toBeNull()
  })

  it("shows tax when the order has some", () => {
    render(
      <OrderPriceBreakdown order={createOrder({ tax: 11, total: 189.9 })} />
    )

    expect(getValue("Tax")).toHaveTextContent("$11.00")
    expect(getValue("Total")).toHaveTextContent("$189.90")
  })

  it("shows no minus sign without a discount", () => {
    render(<OrderPriceBreakdown order={createOrder({ discount: 0 })} />)

    expect(getValue("Discount")).toHaveTextContent("$0.00")
    expect(getValue("Discount")).not.toHaveTextContent("−")
  })
})

describe("OrderCustomerInformation", () => {
  it("shows the customer's details", () => {
    render(<OrderCustomerInformation customer={createOrderCustomer()} />)

    expect(getValue("Name")).toHaveTextContent("Margaret Okafor-Williams")
    expect(getValue("Customer ID")).toHaveTextContent("CUS-1001")
    expect(getValue("Email")).toHaveTextContent(
      "margaret.okafor@brightwater.co.uk"
    )
    expect(getValue("Phone")).toHaveTextContent("+44 20 7946 0958")
  })

  it("links the name to the customer's details page", () => {
    render(<OrderCustomerInformation customer={createOrderCustomer()} />)

    expect(
      screen.getByRole("link", { name: "Margaret Okafor-Williams" })
    ).toHaveAttribute("href", "/dashboard/customers/CUS-1001")
  })

  it("says when there is no phone number", () => {
    render(
      <OrderCustomerInformation
        customer={createOrderCustomer({ phone: null })}
      />
    )

    expect(getValue("Phone")).toHaveTextContent("Not provided")
  })
})

describe("OrderAddresses", () => {
  function getAddress(heading: string) {
    return screen.getByRole("heading", { name: heading })
      .nextElementSibling as HTMLElement
  }

  const order = createOrder({
    shippingAddress: createOrderAddress({
      recipientName: "Isabella Fontaine",
      phone: "+1 (604) 555-0163",
      addressLine1: "1450 West Georgia Street",
      addressLine2: null,
      city: "Vancouver",
      region: "BC",
      postalCode: "V6G 2T6",
      country: "Canada",
    }),
    billingAddress: createOrderAddress({
      recipientName: "Fontaine & Daughters Boutique Hotels Ltd.",
      phone: null,
      addressLine1: "900 Burrard Street",
      addressLine2: null,
      city: "Vancouver",
      region: "BC",
      postalCode: "V6Z 2J9",
      country: "Canada",
    }),
  })

  it("shows the shipping and billing addresses under their own headings", () => {
    render(<OrderAddresses order={order} />)

    expect(getAddress("Shipping address")).toHaveTextContent(
      "Isabella Fontaine"
    )
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
    render(<OrderAddresses order={order} />)

    expect(getAddress("Shipping address")).toHaveTextContent(
      "+1 (604) 555-0163"
    )
    expect(getAddress("Billing address")).not.toHaveTextContent("555")
  })

  it("leaves out the lines that are not set", () => {
    render(
      <OrderAddresses
        order={createOrder({
          shippingAddress: createOrderAddress({
            recipientName: "Omar Haddad",
            phone: "+971 4 555 0176",
            addressLine1: "Villa 22, Street 14, Al Barsha 2",
            addressLine2: null,
            city: "Dubai",
            region: null,
            postalCode: null,
            country: "United Arab Emirates",
          }),
        })}
      />
    )

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
