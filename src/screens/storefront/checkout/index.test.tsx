import type { ComponentProps } from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { routes } from "@/config/routes"
import { useCheckoutDraft } from "@/hooks/storefront/use-checkout-draft"
import { demoBagReviewItems } from "@/mocks/storefront/bag"
import { demoCheckoutAddress } from "@/mocks/storefront/checkout-address-demo"
import { demoCheckoutPaymentMethods } from "@/mocks/storefront/checkout-payment-demo"
import { BagProvider } from "@/providers/bag-provider"
import { CheckoutDraftProvider } from "@/providers/checkout-draft-provider"
import { CheckoutScreen } from "@/screens/storefront/checkout"
import type { BagItem } from "@/types/storefront/bag.types"

vi.mock("next/link", () => ({
  default: ({ onClick, ...props }: ComponentProps<"a">) => (
    <a {...props} onClick={(event) => {
      event.preventDefault()
      onClick?.(event)
    }} />
  ),
}))

function DraftControls() {
  const { draft, setShippingAddress, setPaymentMethod } = useCheckoutDraft()
  return (
    <>
      <button onClick={() => {
        setShippingAddress({ ...demoCheckoutAddress, shippingName: "Taylor Demo", city: "Demo City" })
        setPaymentMethod(demoCheckoutPaymentMethods[1])
      }}>Use edited draft</button>
      <output data-testid="checkout-draft">{JSON.stringify(draft)}</output>
    </>
  )
}

function renderCheckout(items: BagItem[] = demoBagReviewItems) {
  render(
    <BagProvider initialItems={items}>
      <CheckoutDraftProvider>
        <CheckoutScreen />
        <DraftControls />
      </CheckoutDraftProvider>
    </BagProvider>
  )
  return userEvent.setup()
}

const orderSummary = () => within(screen.getByRole("complementary", { name: "Order Summary" }))

it("shows the reference sections, demo defaults, current bag, and consistent charges", () => {
  renderCheckout()
  for (const heading of ["Shipping address", "Payment method", "Review your bag", "Order Summary"]) {
    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument()
  }
  expect(screen.getByText("Jordan Maker")).toBeInTheDocument()
  expect(screen.getByText("ending in 4242")).toBeInTheDocument()
  expect(screen.getByText(/gift card balance/)).toBeInTheDocument()
  expect(screen.getByRole("heading", { name: "Dell XPS 13" })).toBeInTheDocument()
  for (const charge of ["$ 5849.93", "$ 6.99", "$ 760.49", "$ 0.00", "$ 6617.41"]) {
    expect(orderSummary().getByText(charge, { exact: true })).toBeInTheDocument()
  }
  expect(screen.getByRole("checkbox")).toBeChecked()
  expect(screen.queryByRole("navigation")).not.toBeInTheDocument()
})

it("updates the subtotal, estimated GST, and total with bag quantity changes", async () => {
  const user = renderCheckout()
  await user.click(screen.getByRole("button", { name: "Increase quantity of Dell XPS 13, White" }))
  expect(orderSummary().getByText("$ 7649.92")).toBeInTheDocument()
  expect(orderSummary().getByText("$ 994.49")).toBeInTheDocument()
  expect(orderSummary().getByText("$ 8651.40")).toBeInTheDocument()
  await user.click(screen.getByRole("button", { name: "Decrease quantity of Dell XPS 13, White" }))
  expect(orderSummary().getByText("$ 6617.41")).toBeInTheDocument()
  await user.click(screen.getByRole("button", { name: "Remove Dell XPS 13, White from bag" }))
  expect(screen.queryByRole("heading", { name: "Dell XPS 13" })).not.toBeInTheDocument()
  expect(orderSummary().getByText("$ 4583.42")).toBeInTheDocument()
})

it("uses updated draft values and routes changes to the existing forms", async () => {
  const user = renderCheckout()
  await user.click(screen.getByRole("button", { name: "Use edited draft" }))
  expect(screen.getByText("Taylor Demo")).toBeInTheDocument()
  expect(screen.getByText("Demo City, California")).toBeInTheDocument()
  expect(screen.getByText("ending in 2894")).toBeInTheDocument()
  expect(screen.getByRole("link", { name: "Change shipping address" })).toHaveAttribute("href", routes.checkoutAddress)
  expect(screen.getByRole("link", { name: "Change payment method" })).toHaveAttribute("href", routes.checkoutPayment)
  expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute("href", routes.bag)
})

it("seeds the displayed default card into the draft before opening its selector", async () => {
  const user = renderCheckout()
  await user.click(screen.getByRole("link", { name: "Change payment method" }))
  const draft = JSON.parse(screen.getByTestId("checkout-draft").textContent ?? "{}")
  expect(draft.paymentMethod).toEqual(demoCheckoutPaymentMethods[0])
  expect(draft.paymentMethod).not.toHaveProperty("cardNumber")
  expect(draft.paymentMethod).not.toHaveProperty("cvc")
})

it("offers a local demo completion, invalidates it when quantities or billing preference change", async () => {
  const user = renderCheckout()
  await user.click(screen.getByRole("button", { name: "Place your order" }))
  expect(screen.getByText("No order was sent and no payment was taken.")).toBeInTheDocument()
  expect(screen.getByRole("button", { name: "Demo checkout complete" })).toBeDisabled()
  const draft = JSON.parse(screen.getByTestId("checkout-draft").textContent ?? "{}")
  expect(draft.shippingAddress).toEqual(demoCheckoutAddress)
  expect(draft.paymentMethod).toEqual(demoCheckoutPaymentMethods[0])
  await user.click(screen.getByRole("button", { name: "Increase quantity of Dell XPS 13, White" }))
  expect(screen.getByRole("button", { name: "Place your order" })).toBeEnabled()
  expect(screen.queryByText("No order was sent and no payment was taken.")).not.toBeInTheDocument()
  await user.click(screen.getByRole("button", { name: "Place your order" }))
  await user.click(screen.getByRole("checkbox"))
  expect(screen.getByRole("checkbox")).not.toBeChecked()
  expect(screen.getByRole("button", { name: "Place your order" })).toBeEnabled()
})

it("handles an empty bag with zero charges and disables order placement", () => {
  renderCheckout([])
  expect(screen.getByText("Your bag is empty.")).toBeInTheDocument()
  expect(screen.getByRole("link", { name: "Continue shopping" })).toHaveAttribute("href", routes.shop)
  expect(screen.getByRole("button", { name: "Place your order" })).toBeDisabled()
  expect(orderSummary().getAllByText("Rs 0.00")).toHaveLength(5)
})
