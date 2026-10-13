import { useState } from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { routes } from "@/config/routes"
import { useCheckoutDraft } from "@/hooks/storefront/use-checkout-draft"
import { CheckoutDraftProvider } from "@/providers/checkout-draft-provider"
import { ShippingAddressScreen } from "@/screens/storefront/shipping-address"
import { PaymentMethodScreen } from "@/screens/storefront/payment-method"
import { checkoutPaymentSchema } from "@/validations/storefront/checkout-payment.schema"

const { push } = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))

function TestFlow({ initial = "address" }: { initial?: "address" | "payment" }) {
  const [step, setStep] = useState(initial)
  const { draft } = useCheckoutDraft()
  return (
    <>
      <button onClick={() => setStep("address")}>Open address</button>
      <button onClick={() => setStep("payment")}>Open payment</button>
      {step === "address" ? <ShippingAddressScreen /> : <PaymentMethodScreen />}
      <output data-testid="draft">{JSON.stringify(draft)}</output>
    </>
  )
}

function renderFlow(initial?: "address" | "payment") {
  render(<CheckoutDraftProvider><TestFlow initial={initial} /></CheckoutDraftProvider>)
  return userEvent.setup()
}

function readDraft() {
  return JSON.parse(screen.getByTestId("draft").textContent ?? "{}")
}

beforeEach(() => push.mockClear())

it("keeps address input on errors, trims a valid address, and retains its preference across screens", async () => {
  const user = renderFlow()
  await user.clear(screen.getByLabelText("City"))
  await user.type(screen.getByLabelText("City"), "   ")
  await user.click(screen.getByRole("button", { name: "Add Address" }))
  expect(await screen.findByText("Enter a city.")).toBeInTheDocument()
  expect(screen.getByLabelText("Shipping Name")).toHaveValue("Jordan Maker")
  expect(screen.getByLabelText("City")).toHaveValue("   ")
  expect(screen.getByLabelText("City")).toHaveAccessibleDescription("Enter a city.")
  expect(push).not.toHaveBeenCalled()
  await user.clear(screen.getByLabelText("City"))
  await user.type(screen.getByLabelText("City"), "  Demo City  ")
  await user.click(screen.getByRole("checkbox", { name: "Save this as your default address" }))
  await user.click(screen.getByRole("button", { name: "Add Address" }))
  await waitFor(() => expect(push).toHaveBeenCalledWith(routes.checkout))
  expect(readDraft().shippingAddress).toMatchObject({ city: "Demo City", isDefault: false })
  await user.click(screen.getByRole("button", { name: "Open payment" }))
  await user.click(screen.getByRole("button", { name: "Open address" }))
  expect(screen.getByLabelText("City")).toHaveValue("Demo City")
  expect(screen.getByRole("checkbox")).not.toBeChecked()
  expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute("href", routes.checkout)
})

it("selects saved summaries by keyboard and preserves the selection across screen remounts", async () => {
  const user = renderFlow("payment")
  const first = screen.getByRole("radio", { name: "MasterCard ending in 4242" })
  first.focus()
  await user.keyboard(" ")
  expect(first).toBeChecked()
  await user.keyboard("{ArrowDown}")
  expect(screen.getByRole("radio", { name: "VISA ending in 2894" })).toBeChecked()
  expect(readDraft().paymentMethod).toMatchObject({ id: "demo-saved-visa", last4: "2894", isDefault: false, isDemo: true })
  await user.click(screen.getByRole("button", { name: "Open address" }))
  await user.click(screen.getByRole("button", { name: "Open payment" }))
  expect(screen.getByRole("radio", { name: "VISA ending in 2894" })).toBeChecked()
})

it("validates new cards, stores only a demo summary, clears sensitive fields, and retains both draft steps", async () => {
  const user = renderFlow()
  await user.click(screen.getByRole("button", { name: "Add Address" }))
  await user.click(screen.getByRole("button", { name: "Open payment" }))
  push.mockClear()
  await user.click(screen.getByRole("button", { name: "Add Payment Method" }))
  expect(await screen.findByText("Enter a card number.")).toBeInTheDocument()
  expect(screen.getByLabelText("Cardholder Name")).toHaveValue("Jordan Maker")
  expect(push).not.toHaveBeenCalled()
  // Construct a fictional test value at runtime; fixtures contain summaries only.
  const testNumber = Array(4).fill("4242").join("")
  await user.type(screen.getByLabelText("Card Number"), testNumber)
  expect(screen.getByLabelText("Card Number")).toHaveValue(Array(4).fill("4242").join(" "))
  await user.type(screen.getByLabelText("Expiry Date"), "122099")
  await user.type(screen.getByLabelText("CVC"), "1".repeat(3))
  await user.click(screen.getByRole("checkbox"))
  await user.click(screen.getByRole("button", { name: "Add Payment Method" }))
  await waitFor(() => expect(push).toHaveBeenCalledWith(routes.checkout))
  const method = readDraft().paymentMethod
  expect(Object.keys(method).sort()).toEqual(["brand", "expiryMonth", "expiryYear", "id", "isDefault", "isDemo", "last4"])
  expect(method).toMatchObject({ brand: "VISA", last4: "4242", expiryMonth: 12, expiryYear: 2099, isDefault: false, isDemo: true })
  expect(method.id).toMatch(/^demo-/)
  expect(screen.getByLabelText("Card Number")).toHaveValue("")
  expect(screen.getByLabelText("CVC")).toHaveValue("")
  expect(readDraft().shippingAddress).not.toBeNull()
  await user.click(screen.getByRole("button", { name: "Open address" }))
  await user.click(screen.getByRole("button", { name: "Open payment" }))
  expect(screen.getByRole("radio", { name: "VISA ending in 4242" })).toBeChecked()
  expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute("href", routes.checkout)
})

it("rejects invalid months, expired dates, unsupported cards, and the wrong CVC length", () => {
  const valid = {
    cardholderName: "Demo Person",
    cardNumber: Array(4).fill("4242").join(""),
    expiry: "12 / 2099",
    cvc: "1".repeat(3),
    isDefault: true,
  }
  for (const override of [
    { expiry: "00 / 2099" },
    { expiry: "13 / 2099" },
    { expiry: "01 / 2020" },
    { expiry: "12 / 209" },
    { cardNumber: "9".repeat(16) },
    { cardNumber: `${valid.cardNumber.slice(0, -1)}3` },
    { cvc: "1".repeat(4) },
    { cardholderName: " " },
  ]) {
    expect(checkoutPaymentSchema.safeParse({ ...valid, ...override }).success).toBe(false)
  }
  expect(checkoutPaymentSchema.safeParse(valid).success).toBe(true)
})
