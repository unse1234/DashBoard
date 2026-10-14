import { render, screen, within } from "@testing-library/react"

import { routes } from "@/config/routes"
import { ConfirmationScreen } from "@/screens/storefront/confirmation"
import type { OrderConfirmation } from "@/types/storefront/checkout.types"
import {
  clearConfirmation,
  saveConfirmation,
} from "@/utils/storefront/order-session"

const confirmation: OrderConfirmation = {
  receipt: {
    id: "ORD-10042",
    createdAt: "2026-10-14T08:00:00.000Z",
    status: "PENDING",
    paymentStatus: "PENDING",
    paymentMethod: "COD",
    currency: "PKR",
    items: [
      {
        productId: "PRD-1001",
        productName: "Kettle",
        quantity: 2,
        unitPrice: 1500,
        total: 3000,
      },
      {
        productId: "PRD-1002",
        productName: "Mug",
        quantity: 1,
        unitPrice: 250.5,
        total: 250.5,
      },
    ],
    subtotal: 3250.5,
    shipping: 0,
    tax: 0,
    discount: 0,
    total: 3250.5,
  },
  delivery: {
    contactName: "Ayesha Khan",
    email: "ayesha@example.com",
    phone: "0300 1234567",
    address: {
      recipientName: "Bilal Khan",
      addressLine1: "House 12, Street 4",
      addressLine2: "Near the park",
      city: "Lahore",
      region: "Punjab",
      postalCode: "54000",
      country: "PK",
    },
  },
}

afterEach(() => {
  clearConfirmation()
  window.sessionStorage.clear()
})

describe("the confirmation screen", () => {
  it("shows the reference, what is to be paid in cash, and what was ordered", () => {
    saveConfirmation(confirmation)
    render(<ConfirmationScreen />)

    expect(
      screen.getByRole("heading", { level: 1, name: "Order placed" })
    ).toBeInTheDocument()
    expect(screen.getByText("ORD-10042")).toBeInTheDocument()
    expect(screen.getByText(/Thank you, Ayesha Khan/)).toBeInTheDocument()
    expect(screen.getByText(/Cash on delivery: pay/).textContent).toContain(
      "Rs 3,250.50"
    )

    const items = within(screen.getByRole("list"))
    expect(items.getAllByRole("listitem")).toHaveLength(2)
    expect(items.getByText("Rs 3,000.00")).toBeInTheDocument()
    expect(items.getByText(/× 2 at Rs 1,500.00/)).toBeInTheDocument()
  })

  it("shows every charge the receipt carries, and the total to pay", () => {
    saveConfirmation(confirmation)
    render(<ConfirmationScreen />)

    const total = screen.getByText("Total to pay on delivery")
    expect(total.nextElementSibling).toHaveTextContent("Rs 3,250.50")
    for (const label of ["Items", "Shipping", "Tax", "Discount"]) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it("shows where it is going", () => {
    saveConfirmation(confirmation)
    render(<ConfirmationScreen />)

    expect(screen.getByText("Bilal Khan")).toBeInTheDocument()
    expect(screen.getByText("House 12, Street 4")).toBeInTheDocument()
    expect(screen.getByText("Near the park")).toBeInTheDocument()
    expect(screen.getByText("Lahore, Punjab 54000")).toBeInTheDocument()
    expect(screen.getByText("Pakistan")).toBeInTheDocument()
    expect(screen.getByText("0300 1234567")).toBeInTheDocument()
  })

  it("offers to keep shopping", () => {
    saveConfirmation(confirmation)
    render(<ConfirmationScreen />)

    expect(
      screen.getByRole("link", { name: "Continue shopping" })
    ).toHaveAttribute("href", routes.shop)
  })

  it("says there is no recent order when this tab has none", () => {
    render(<ConfirmationScreen />)

    expect(
      screen.getByRole("heading", { level: 1, name: "No recent order" })
    ).toBeInTheDocument()
    expect(screen.queryByText(/ORD-/)).not.toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "Continue shopping" })
    ).toHaveAttribute("href", routes.shop)
  })

  it("leaves out anything a receipt should not carry", () => {
    saveConfirmation(confirmation)
    render(<ConfirmationScreen />)

    // No order status jargon, no card fields: it is a receipt for cash.
    expect(screen.queryByText(/card/i)).not.toBeInTheDocument()
    expect(screen.queryByText("PENDING")).not.toBeInTheDocument()
  })
})
