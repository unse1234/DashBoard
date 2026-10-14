import { render, screen } from "@testing-library/react"

import { routes } from "@/config/routes"
import { PaymentMethodScreen } from "@/screens/storefront/payment-method"

describe("the payment method screen", () => {
  it("offers cash on delivery as the one method, already selected", () => {
    render(<PaymentMethodScreen />)

    expect(
      screen.getByRole("heading", { level: 1, name: "Payment method" })
    ).toBeInTheDocument()
    const option = screen.getByRole("radio", { name: "Cash on delivery" })
    expect(option).toBeChecked()
    expect(screen.getAllByRole("radio")).toHaveLength(1)
  })

  it("explains that nothing is charged online", () => {
    render(<PaymentMethodScreen />)

    expect(
      screen.getByRole("radio", { name: "Cash on delivery" })
    ).toHaveAccessibleDescription(/You pay in cash when your order arrives/)
  })

  it("takes no card, no number and no security code", () => {
    render(<PaymentMethodScreen />)

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/card number|cvc|expiry/i)).toBeNull()
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument()
  })

  it("goes back to the review", () => {
    render(<PaymentMethodScreen />)

    expect(screen.getByRole("link", { name: "Continue" })).toHaveAttribute(
      "href",
      routes.checkout
    )
    expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute(
      "href",
      routes.checkout
    )
  })
})
