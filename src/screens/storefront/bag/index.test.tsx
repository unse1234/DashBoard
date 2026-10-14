import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"

import { BagProvider } from "@/providers/bag-provider"
import { BagScreen } from "@/screens/storefront/bag"
import { mockApi, networkError, type MockReply } from "@/test-utils/mock-api"
import { createBagServer } from "@/test-utils/storefront-bag-server"
import { createStorefrontProduct } from "@/test-utils/storefront-fixtures"
import type { BagDraftLine } from "@/types/storefront/bag.types"

vi.mock("next/navigation", () => ({ usePathname: () => "/bag" }))
// next/font only works inside the Next.js compiler.
vi.mock("next/font/google", () => ({
  Cabin: () => ({ variable: "font-cabin" }),
}))

beforeAll(() => {
  // jsdom has no matchMedia; the navigation's menu reads it to choose its side.
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia
})

const dell = createStorefrontProduct({
  id: "PRD-3001",
  name: "Dell XPS 13",
  subtitle: "White",
  price: 1799.99,
})
const navy = createStorefrontProduct({
  id: "PRD-3002",
  name: "iPhone 11",
  subtitle: "Navy Blue",
  price: 729.99,
})
const white = createStorefrontProduct({
  id: "PRD-3003",
  name: "iPhone 11",
  subtitle: "Milky White",
  price: 619.99,
})
const black = createStorefrontProduct({
  id: "PRD-3004",
  name: "iPhone 11",
  subtitle: "Serious Black",
  price: 619.99,
})
const catalog = [dell, navy, white, black]

// Four lines, seven units: Rs 5,849.93.
const reviewDraft: BagDraftLine[] = [
  { productId: dell.id, quantity: 1 },
  { productId: navy.id, quantity: 3 },
  { productId: white.id, quantity: 1 },
  { productId: black.id, quantity: 2 },
]

let api: ReturnType<typeof mockApi> | undefined

afterEach(() => {
  api?.restore()
  api = undefined
})

/** Opens the bag with `draft`, priced by a fake server with `stock` per product. */
async function renderBag(
  draft: BagDraftLine[] = reviewDraft,
  stock: Record<string, number> = {}
) {
  const server = createBagServer(catalog, stock)
  api = mockApi(server.handle)
  render(
    <BagProvider persist={false} initialDraft={draft}>
      <BagScreen />
    </BagProvider>
  )
  if (draft.length > 0) await screen.findAllByRole("article")
  return api
}

const lines = () => screen.getAllByRole("article").map((line) => within(line))
const preview = () => within(screen.getByRole("complementary", { name: "Bag" }))
const lineFor = (name: string, subtitle: string) =>
  within(
    screen
      .getAllByRole("article")
      .find(
        (line) =>
          within(line).queryByRole("heading", { name }) &&
          within(line).queryByText(subtitle)
      )!
  )

// The quantity is also written in the price text ("Rs 729.99 x 3"), so read the
// stepper's own.
const stepperQuantity = (line: ReturnType<typeof lineFor>, label: string) =>
  within(line.getByRole("group", { name: `Quantity of ${label}` })).getByText(
    /^\d+$/
  ).textContent

describe("BagScreen", () => {
  it("lists every line with the server's unit price and quantity", async () => {
    await renderBag()

    expect(
      screen.getByRole("heading", { level: 1, name: "Check your Bag Items" })
    ).toBeInTheDocument()
    expect(lines()).toHaveLength(4)

    const dellLine = lineFor("Dell XPS 13", "White")
    expect(dellLine.getByText("Rs 1,799.99")).toBeInTheDocument()
    expect(stepperQuantity(dellLine, "Dell XPS 13, White")).toBe("1")

    const navyLine = lineFor("iPhone 11", "Navy Blue")
    expect(navyLine.getByText("Rs 729.99")).toBeInTheDocument()
    expect(stepperQuantity(navyLine, "iPhone 11, Navy Blue")).toBe("3")
  })

  it("shows the server's total beside the thumbnails and offers checkout", async () => {
    await renderBag()

    expect(preview().getByText("Rs 5,849.93")).toBeInTheDocument()
    expect(preview().getAllByRole("listitem")).toHaveLength(4)
    expect(preview().getByRole("link", { name: "Checkout" })).toHaveAttribute(
      "href",
      "/checkout"
    )
  })

  it("prices the bag again when it is opened, without any action", async () => {
    const { requests } = await renderBag()

    expect(requests.length).toBeGreaterThanOrEqual(1)
    for (const request of requests) {
      expect(request.body).toEqual({ items: reviewDraft })
    }
  })

  it("asks the server to raise a quantity, and shows what comes back", async () => {
    const { requests } = await renderBag()
    const dellLine = lineFor("Dell XPS 13", "White")

    await userEvent.click(
      dellLine.getByRole("button", {
        name: "Increase quantity of Dell XPS 13, White",
      })
    )

    await waitFor(() =>
      expect(stepperQuantity(dellLine, "Dell XPS 13, White")).toBe("2")
    )
    expect(preview().getByText("Rs 7,649.92")).toBeInTheDocument()
    expect(
      screen.getByText("Dell XPS 13, White, quantity 2.")
    ).toBeInTheDocument()
    expect(requests.at(-1)?.body).toEqual({
      items: reviewDraft,
      action: { type: "increment", productId: dell.id },
    })
  })

  it("lowers a quantity without removing the line", async () => {
    await renderBag()
    const navyLine = lineFor("iPhone 11", "Navy Blue")

    await userEvent.click(
      navyLine.getByRole("button", {
        name: "Decrease quantity of iPhone 11, Navy Blue",
      })
    )

    await waitFor(() =>
      expect(stepperQuantity(navyLine, "iPhone 11, Navy Blue")).toBe("2")
    )
    expect(preview().getByText("Rs 5,119.94")).toBeInTheDocument()
    expect(lines()).toHaveLength(4)
  })

  it("names the minus as a removal at one unit, and removes the line", async () => {
    await renderBag()
    const whiteLine = lineFor("iPhone 11", "Milky White")

    await userEvent.click(
      whiteLine.getByRole("button", {
        name: "Remove iPhone 11, Milky White from bag",
      })
    )

    await waitFor(() => expect(lines()).toHaveLength(3))
    expect(screen.queryByText("Milky White")).toBeNull()
    expect(preview().getAllByRole("listitem")).toHaveLength(3)
    expect(preview().getByText("Rs 5,229.94")).toBeInTheDocument()
    expect(
      screen.getByText("iPhone 11, Milky White, removed from bag.")
    ).toBeInTheDocument()
  })

  it("shows an empty state, a zero total, and no checkout once the bag is empty", async () => {
    await renderBag([{ productId: white.id, quantity: 1 }])

    await userEvent.click(
      screen.getByRole("button", {
        name: "Remove iPhone 11, Milky White from bag",
      })
    )

    await waitFor(() =>
      expect(screen.getAllByText("Your bag is empty.").length).toBeGreaterThan(
        0
      )
    )
    expect(
      screen.getByRole("link", { name: "Continue shopping" })
    ).toHaveAttribute("href", "/shop")
    expect(preview().getByText("Rs 0.00")).toBeInTheDocument()
    expect(preview().queryByRole("link", { name: "Checkout" })).toBeNull()
  })

  it("keeps each stepper's controls in a labelled group", async () => {
    await renderBag()

    expect(
      screen.getByRole("group", { name: "Quantity of Dell XPS 13, White" })
    ).toBeInTheDocument()
  })

  describe("when the server refuses or fails", () => {
    it("explains a refused increase and leaves the quantity alone", async () => {
      await renderBag([{ productId: dell.id, quantity: 2 }], {
        [dell.id]: 2,
      })
      const dellLine = lineFor("Dell XPS 13", "White")

      await userEvent.click(
        dellLine.getByRole("button", {
          name: "Increase quantity of Dell XPS 13, White",
        })
      )

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Dell XPS 13, White: There is not enough stock for this quantity"
      )
      expect(stepperQuantity(dellLine, "Dell XPS 13, White")).toBe("2")
      expect(preview().getByText("Rs 3,599.98")).toBeInTheDocument()

      await userEvent.click(screen.getByRole("button", { name: "Dismiss" }))
      expect(screen.queryByRole("alert")).toBeNull()
    })
  })

  describe("lines that cannot be bought as they are", () => {
    it("shows the reason, blocks checkout, and still lets the shopper fix it", async () => {
      await renderBag(
        [
          { productId: dell.id, quantity: 3 },
          { productId: "PRD-9999", quantity: 1 },
        ],
        { [dell.id]: 1 }
      )

      expect(
        screen.getByText(
          "There is not enough stock for this quantity. Lower it, or remove the item."
        )
      ).toBeInTheDocument()
      expect(
        screen.getByText("This product is no longer available.")
      ).toBeInTheDocument()
      // Nothing is revealed about the unavailable product but its id.
      expect(
        screen.getByRole("heading", { name: /Unavailable product/ })
      ).toHaveTextContent("PRD-9999")
      expect(screen.getByText(/can’t be bought as they are/)).toBeVisible()
      expect(preview().queryByRole("link", { name: "Checkout" })).toBeNull()

      await userEvent.click(
        screen.getByRole("button", { name: "Remove from bag" })
      )
      await waitFor(() => expect(lines()).toHaveLength(1))

      const dellLine = lineFor("Dell XPS 13", "White")
      await userEvent.click(
        dellLine.getByRole("button", {
          name: "Decrease quantity of Dell XPS 13, White",
        })
      )
      await userEvent.click(
        dellLine.getByRole("button", {
          name: "Decrease quantity of Dell XPS 13, White",
        })
      )

      await waitFor(() =>
        expect(
          preview().getByRole("link", { name: "Checkout" })
        ).toHaveAttribute("href", "/checkout")
      )
      expect(screen.queryByText(/can’t be bought as they are/)).toBeNull()
    })
  })

  describe("loading", () => {
    it("says the bag is loading until the server answers", async () => {
      let release: () => void = () => {}
      const server = createBagServer(catalog)
      api = mockApi(
        (request) =>
          new Promise<MockReply>((resolve) => {
            release = () => resolve(server.handle(request))
          })
      )
      render(
        <BagProvider persist={false} initialDraft={reviewDraft}>
          <BagScreen />
        </BagProvider>
      )

      // The screen and the bag preview beside it both say so.
      expect(
        (await screen.findAllByText("Loading your bag…")).length
      ).toBeGreaterThan(0)
      expect(
        screen.queryByRole("link", { name: "Continue shopping" })
      ).toBeNull()

      release()
      expect(await screen.findAllByRole("article")).toHaveLength(4)
    })

    it("explains a bag that could not be loaded, and loads it on retry", async () => {
      const server = createBagServer(catalog)
      let down = true
      api = mockApi((request) =>
        down ? networkError() : server.handle(request)
      )
      render(
        <BagProvider persist={false} initialDraft={reviewDraft}>
          <BagScreen />
        </BagProvider>
      )

      expect(
        await screen.findByText("Couldn’t load your bag.")
      ).toBeInTheDocument()

      down = false
      await userEvent.click(screen.getByRole("button", { name: "Try again" }))

      expect(await screen.findAllByRole("article")).toHaveLength(4)
    })
  })
})
