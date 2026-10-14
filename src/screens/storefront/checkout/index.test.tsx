import type { ComponentProps } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"

import { routes } from "@/config/routes"
import { useCheckoutDraft } from "@/hooks/storefront/use-checkout-draft"
import { BagProvider } from "@/providers/bag-provider"
import { CheckoutDraftProvider } from "@/providers/checkout-draft-provider"
import { CheckoutScreen } from "@/screens/storefront/checkout"
import { mockApi, networkError, type MockReply } from "@/test-utils/mock-api"
import { createTestQueryClient } from "@/test-utils/render"
import { createCheckoutServer } from "@/test-utils/storefront-checkout-server"
import { createStorefrontProduct } from "@/test-utils/storefront-fixtures"
import type { BagDraftLine } from "@/types/storefront/bag.types"
import type { CheckoutDetails } from "@/types/storefront/checkout.types"
import {
  ATTEMPT_STORAGE_KEY,
  CONFIRMATION_STORAGE_KEY,
} from "@/utils/storefront/order-session"

const { push } = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))
vi.mock("next/link", () => ({
  default: ({ onClick, ...props }: ComponentProps<"a">) => (
    <a
      {...props}
      onClick={(event) => {
        event.preventDefault()
        onClick?.(event)
      }}
    />
  ),
}))

const dell = createStorefrontProduct({
  id: "PRD-5001",
  name: "Dell XPS 13",
  subtitle: "White",
  price: 1799.99,
})
const navy = createStorefrontProduct({
  id: "PRD-5002",
  name: "iPhone 11",
  subtitle: "Navy Blue",
  price: 729.99,
})
const catalog = [dell, navy]

// Rs 1,799.99 + 2 x Rs 729.99 = Rs 3,259.97.
const reviewDraft: BagDraftLine[] = [
  { productId: dell.id, quantity: 1 },
  { productId: navy.id, quantity: 2 },
]

const details: CheckoutDetails = {
  contact: {
    name: "Ayesha Khan",
    email: "ayesha@example.com",
    phone: "0300 1234567",
  },
  shippingAddress: {
    recipientName: "Ayesha Khan",
    addressLine1: "House 12, Street 4, F-7/2",
    addressLine2: "",
    city: "Islamabad",
    region: "Islamabad Capital Territory",
    postalCode: "44000",
  },
}

let api: ReturnType<typeof mockApi> | undefined

beforeEach(() => push.mockClear())
afterEach(() => {
  api?.restore()
  api = undefined
  window.sessionStorage.clear()
})

/** Gives the screen the details a shopper would have typed on the form. */
function Details({ value }: { value: CheckoutDetails | null }) {
  const { setDetails, draft } = useCheckoutDraft()
  return (
    <>
      <button type="button" onClick={() => value && setDetails(value)}>
        Fill in details
      </button>
      <output data-testid="draft">{JSON.stringify(draft)}</output>
    </>
  )
}

type Options = {
  draft?: BagDraftLine[]
  withDetails?: boolean
  server?: ReturnType<typeof createCheckoutServer>
  handler?: (
    fake: ReturnType<typeof createCheckoutServer>
  ) => (
    request: Parameters<ReturnType<typeof createCheckoutServer>["handle"]>[0]
  ) => MockReply | Promise<MockReply>
}

async function renderCheckout({
  draft = reviewDraft,
  withDetails = true,
  server = createCheckoutServer(catalog),
  handler,
}: Options = {}) {
  api = mockApi(handler ? handler(server) : server.handle)
  const user = userEvent.setup()
  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <BagProvider persist={false} initialDraft={draft}>
        <CheckoutDraftProvider>
          <CheckoutScreen />
          <Details value={details} />
        </CheckoutDraftProvider>
      </BagProvider>
    </QueryClientProvider>
  )
  if (draft.length > 0) {
    await screen.findByRole("heading", { name: "Dell XPS 13" })
  }
  if (withDetails) {
    await user.click(screen.getByRole("button", { name: "Fill in details" }))
  }
  return { user, server }
}

const orderSummary = () =>
  within(screen.getByRole("complementary", { name: "Order Summary" }))
const placeButton = () =>
  screen.getByRole("button", { name: /Place your order|Placing your order/ })

const readyToPlace = async () => {
  await waitFor(() => expect(placeButton()).toBeEnabled())
}

describe("the checkout review", () => {
  describe("what it shows", () => {
    it("shows the sections, cash on delivery, the bag and no card or gift card", async () => {
      await renderCheckout()

      for (const heading of [
        "Shipping address",
        "Payment method",
        "Review your bag",
        "Order Summary",
      ]) {
        expect(
          screen.getByRole("heading", { name: heading })
        ).toBeInTheDocument()
      }
      expect(screen.getByText("Cash on delivery")).toBeInTheDocument()
      expect(
        screen.getByRole("heading", { name: "Dell XPS 13" })
      ).toBeInTheDocument()
      expect(screen.queryByText(/gift card/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/ending in/i)).not.toBeInTheDocument()
      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument()
      expect(screen.queryByRole("navigation")).not.toBeInTheDocument()
    })

    it("shows the contact and address the shopper typed, with ways to change them", async () => {
      await renderCheckout()

      expect(screen.getAllByText("Ayesha Khan").length).toBeGreaterThan(0)
      expect(screen.getByText("House 12, Street 4, F-7/2")).toBeInTheDocument()
      expect(
        screen.getByText("Islamabad, Islamabad Capital Territory 44000")
      ).toBeInTheDocument()
      expect(screen.getByText("Pakistan")).toBeInTheDocument()
      expect(screen.getByText("ayesha@example.com")).toBeInTheDocument()
      expect(screen.getByText("0300 1234567")).toBeInTheDocument()
      expect(
        screen.getByRole("link", { name: "Change shipping address" })
      ).toHaveAttribute("href", routes.checkoutAddress)
      expect(
        screen.getByRole("link", { name: "Change payment method" })
      ).toHaveAttribute("href", routes.checkoutPayment)
      expect(screen.getByRole("link", { name: "Back" })).toHaveAttribute(
        "href",
        routes.bag
      )
    })

    it("asks for the details first, and shows no total until it can", async () => {
      await renderCheckout({ withDetails: false })

      expect(screen.getByRole("link", { name: "Add details" })).toHaveAttribute(
        "href",
        routes.checkoutAddress
      )
      expect(
        screen.getByText(
          "Add your shipping address and contact details to see your total."
        )
      ).toBeInTheDocument()
      // The bag's own subtotal, and the charges are not guessed at.
      expect(orderSummary().getByText("Rs 3,259.97")).toBeInTheDocument()
      expect(orderSummary().getAllByText("—")).toHaveLength(4)
      expect(placeButton()).toBeDisabled()
    })

    it("handles an empty bag and cannot place an order", async () => {
      await renderCheckout({ draft: [] })

      expect(screen.getAllByText("Your bag is empty.").length).toBeGreaterThan(
        0
      )
      expect(
        screen.getByRole("link", { name: "Continue shopping" })
      ).toHaveAttribute("href", routes.shop)
      expect(placeButton()).toBeDisabled()
    })
  })

  describe("the quote", () => {
    it("shows the server's lines, charges and total, as quoted for the address", async () => {
      const { server } = await renderCheckout()

      await waitFor(() =>
        expect(orderSummary().getAllByText("Rs 3,259.97")).toHaveLength(2)
      )
      expect(orderSummary().getAllByText("Rs 0.00")).toHaveLength(3)
      expect(screen.getByText("Tax:")).toBeInTheDocument()
      expect(screen.getByText("Discount:")).toBeInTheDocument()

      const [sent] = server.requests.quotes
      expect(sent.body).toEqual({
        items: reviewDraft,
        shippingAddress: {
          recipientName: "Ayesha Khan",
          addressLine1: "House 12, Street 4, F-7/2",
          city: "Islamabad",
          region: "Islamabad Capital Territory",
          postalCode: "44000",
          country: "PK",
        },
      })
      expect(sent.headers.authorization).toBeUndefined()
    })

    it("asks again, and does not allow placement from the old quote, when the bag changes", async () => {
      let release: () => void = () => {}
      const { user, server } = await renderCheckout({
        handler: (fake) => (request) => {
          // Hold back the quote for the changed bag.
          const body = request.body as { items?: { quantity: number }[] }
          if (
            request.url === "/storefront/checkout/quote" &&
            body.items?.some((line) => line.quantity === 2) &&
            body.items.length === 2 &&
            body.items[0].quantity === 2
          ) {
            return new Promise<MockReply>((resolve) => {
              release = () => resolve(fake.handle(request))
            })
          }
          return fake.handle(request)
        },
      })
      await readyToPlace()

      await user.click(
        screen.getByRole("button", {
          name: "Increase quantity of Dell XPS 13, White",
        })
      )

      // The bag changed, so the quote on screen is no longer the bag's.
      await waitFor(() => expect(placeButton()).toBeDisabled())
      expect(screen.getByText("Calculating your total…")).toBeInTheDocument()

      release()
      await waitFor(() =>
        expect(orderSummary().getAllByText("Rs 5,059.96")).toHaveLength(2)
      )
      await readyToPlace()
      expect(server.requests.quotes.length).toBeGreaterThanOrEqual(2)
    })

    it("explains a bag that cannot be bought as it is, and sends the shopper to it", async () => {
      await renderCheckout({
        draft: [{ productId: dell.id, quantity: 500 }],
      })
      await waitFor(() =>
        expect(
          screen.getByText(/can’t be bought as they are/)
        ).toBeInTheDocument()
      )

      expect(
        screen.getByRole("link", { name: "Review your bag" })
      ).toHaveAttribute("href", routes.bag)
      expect(placeButton()).toBeDisabled()
    })

    it("explains a quote that could not be fetched, and fetches it again on request", async () => {
      let down = true
      const { user } = await renderCheckout({
        handler: (fake) => (request) =>
          request.url === "/storefront/checkout/quote" && down
            ? networkError()
            : fake.handle(request),
      })

      expect(
        await screen.findByText(/unable to reach the server/i)
      ).toBeInTheDocument()
      expect(placeButton()).toBeDisabled()

      down = false
      await user.click(screen.getByRole("button", { name: "Try again" }))

      await readyToPlace()
    })

    it("does not place an order with a quote that has expired", async () => {
      const server = createCheckoutServer(catalog, { quoteLifetimeMs: -1000 })
      await renderCheckout({ server })

      expect(
        await screen.findByText(/Your price quote has expired/)
      ).toBeInTheDocument()
      expect(placeButton()).toBeDisabled()
    })
  })

  describe("placing the order", () => {
    it("sends the quoted lines, the address, the contact and the token, and goes to the confirmation", async () => {
      const { user, server } = await renderCheckout()
      await readyToPlace()

      await user.click(placeButton())

      await waitFor(() =>
        expect(push).toHaveBeenCalledWith(routes.checkoutConfirmation)
      )
      const [placed] = server.requests.orders
      expect(placed.body).toMatchObject({
        contact: details.contact,
        items: reviewDraft,
        shippingAddress: { recipientName: "Ayesha Khan", country: "PK" },
      })
      expect(
        (placed.body as { quoteToken: string }).quoteToken.length
      ).toBeGreaterThan(10)
      expect(placed.headers["idempotency-key"]).toMatch(/^[0-9a-f-]{36}$/)
      expect(server.orders.size).toBe(1)

      // The receipt is kept, nothing is pending, and the typed details are gone.
      expect(
        JSON.parse(window.sessionStorage.getItem(CONFIRMATION_STORAGE_KEY)!)
          .receipt.id
      ).toBe("ORD-10001")
      expect(window.sessionStorage.getItem(ATTEMPT_STORAGE_KEY)).toBeNull()
      expect(JSON.parse(screen.getByTestId("draft").textContent!)).toEqual({
        contact: null,
        shippingAddress: null,
      })
    })

    it("cannot be pressed twice: the button is disabled while the order is on its way", async () => {
      let release: () => void = () => {}
      let sent = 0
      const { user, server } = await renderCheckout({
        handler: (fake) => (request) => {
          if (request.url !== "/storefront/orders") return fake.handle(request)
          sent += 1
          return new Promise<MockReply>((resolve) => {
            release = () => resolve(fake.handle(request))
          })
        },
      })
      await readyToPlace()

      await user.click(placeButton())

      await waitFor(() => expect(placeButton()).toBeDisabled())
      expect(placeButton()).toHaveTextContent("Placing your order…")
      await user.click(placeButton())
      expect(sent).toBe(1)

      release()
      await waitFor(() => expect(push).toHaveBeenCalled())
      expect(sent).toBe(1)
      expect(server.orders.size).toBe(1)
    })
  })

  describe("when the order is not confirmed", () => {
    it("says so, keeps the attempt, and a retry places exactly one order", async () => {
      let lost = true
      const { user, server } = await renderCheckout({
        handler: (fake) => (request) => {
          const reply = fake.handle(request)
          if (request.url === "/storefront/orders" && lost) {
            lost = false
            return networkError() // placed, but the answer never came
          }
          return reply
        },
      })
      await readyToPlace()

      await user.click(placeButton())

      const alert = await screen.findByRole("alert", {
        name: "We couldn’t confirm your order",
      })
      expect(alert).toHaveTextContent(
        "retrying will never place a second order"
      )
      expect(window.sessionStorage.getItem(ATTEMPT_STORAGE_KEY)).not.toBeNull()
      // No new order can be started meanwhile.
      expect(placeButton()).toBeDisabled()
      expect(push).not.toHaveBeenCalled()

      await user.click(screen.getByRole("button", { name: "Try again" }))

      await waitFor(() =>
        expect(push).toHaveBeenCalledWith(routes.checkoutConfirmation)
      )
      const [first, again] = server.requests.orders
      expect(again.headers["idempotency-key"]).toBe(
        first.headers["idempotency-key"]
      )
      expect(again.body).toEqual(first.body)
      expect(server.orders.size).toBe(1)
      expect(window.sessionStorage.getItem(ATTEMPT_STORAGE_KEY)).toBeNull()
    })

    it("shows the pending order again after a reload, and finishes it", async () => {
      // A previous load sent an order whose answer was lost.
      const server = createCheckoutServer(catalog)
      api = mockApi(server.handle)
      const { quoteCheckout } =
        await import("@/services/storefront/checkout.api")
      const shippingAddress = {
        recipientName: "Ayesha Khan",
        addressLine1: "House 12, Street 4, F-7/2",
        city: "Islamabad",
        region: "Islamabad Capital Territory",
        country: "PK",
      }
      const quote = await quoteCheckout({ items: reviewDraft, shippingAddress })
      window.sessionStorage.setItem(
        ATTEMPT_STORAGE_KEY,
        JSON.stringify({
          key: "pending-after-reload-01",
          request: {
            contact: details.contact,
            items: reviewDraft,
            shippingAddress,
            quoteToken: quote.quoteToken,
          },
        })
      )
      api.restore()

      const { user } = await renderCheckout({ server, withDetails: false })

      expect(
        await screen.findByRole("alert", {
          name: "We couldn’t confirm your order",
        })
      ).toBeInTheDocument()
      expect(placeButton()).toBeDisabled()

      await user.click(screen.getByRole("button", { name: "Try again" }))

      await waitFor(() =>
        expect(push).toHaveBeenCalledWith(routes.checkoutConfirmation)
      )
      expect(server.requests.orders.at(-1)?.headers["idempotency-key"]).toBe(
        "pending-after-reload-01"
      )
      expect(server.orders.size).toBe(1)
    })
  })

  describe("when the API refuses the order", () => {
    it("says what was refused, sends the shopper to the bag, and brings the bag up to date", async () => {
      const { user, server } = await renderCheckout()
      await readyToPlace()
      // Another shopper buys the last Dell after this one reviewed the order.
      server.setStock(dell.id, 0)

      await user.click(placeButton())

      const alert = await screen.findByRole("alert", {
        name: "Your order was not placed",
      })
      expect(alert).toHaveTextContent("not enough stock")
      expect(
        within(alert).getByRole("link", { name: "Review your bag" })
      ).toHaveAttribute("href", routes.bag)
      // Nothing is pending, nothing was placed, and nothing is left to retry.
      expect(window.sessionStorage.getItem(ATTEMPT_STORAGE_KEY)).toBeNull()
      expect(server.orders.size).toBe(0)
      expect(push).not.toHaveBeenCalled()
      // The bag was priced again: the line says why it cannot be bought.
      expect(
        await screen.findByText(/Lower it, or remove the item/)
      ).toBeInTheDocument()
      expect(placeButton()).toBeDisabled()
    })

    it("explains a price that moved, shows the new price, and places the order on the second try", async () => {
      const { user, server } = await renderCheckout()
      await readyToPlace()
      const original = dell.price
      dell.price = 1899.99
      try {
        await user.click(placeButton())

        const alert = await screen.findByRole("alert", {
          name: "Your order was not placed",
        })
        expect(alert).toHaveTextContent("Prices changed")
        expect(server.orders.size).toBe(0)

        // The renewed quote is what is on screen now: Rs 100 more.
        await waitFor(() =>
          expect(orderSummary().getAllByText("Rs 3,359.97")).toHaveLength(2)
        )
        await readyToPlace()

        await user.click(placeButton())

        await waitFor(() =>
          expect(push).toHaveBeenCalledWith(routes.checkoutConfirmation)
        )
        expect(server.orders.size).toBe(1)
        // Two different attempts, so two keys: the first never became an order.
        const keys = server.requests.orders.map(
          (request) => request.headers["idempotency-key"]
        )
        expect(new Set(keys).size).toBe(2)
      } finally {
        dell.price = original
      }
    })

    it("points to the details when the contact was not acceptable", async () => {
      const { user } = await renderCheckout({
        handler: (fake) => (request) =>
          request.url === "/storefront/orders"
            ? {
                status: 400,
                data: {
                  statusCode: 400,
                  message: [
                    "phone must be a Pakistani phone number such as 0300 1234567 or +92 300 1234567",
                  ],
                },
              }
            : fake.handle(request),
      })
      await readyToPlace()

      await user.click(placeButton())

      const alert = await screen.findByRole("alert", {
        name: "Your order was not placed",
      })
      expect(alert).toHaveTextContent("Please check your details")
      expect(alert).toHaveTextContent("phone must be a Pakistani phone number")
      expect(
        within(alert).getByRole("link", { name: "Edit your details" })
      ).toHaveAttribute("href", routes.checkoutAddress)

      await user.click(within(alert).getByRole("button", { name: "Dismiss" }))
      expect(
        screen.queryByRole("alert", { name: "Your order was not placed" })
      ).not.toBeInTheDocument()
    })
  })
})
