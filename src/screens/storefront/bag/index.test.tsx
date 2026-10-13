import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"

import { demoBagReviewItems } from "@/mocks/storefront/bag"
import { BagProvider } from "@/providers/bag-provider"
import { BagScreen } from "@/screens/storefront/bag"

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

function renderBag() {
  return render(
    <BagProvider initialItems={demoBagReviewItems}>
      <BagScreen />
    </BagProvider>
  )
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

// The quantity is also written in the price text ("$ 729.99 x 3"), so read the
// stepper's own.
const stepperQuantity = (line: ReturnType<typeof lineFor>, label: string) =>
  within(line.getByRole("group", { name: `Quantity of ${label}` })).getByText(
    /^\d+$/
  ).textContent

describe("BagScreen", () => {
  it("lists every line with its unit price and quantity", () => {
    renderBag()

    expect(
      screen.getByRole("heading", { level: 1, name: "Check your Bag Items" })
    ).toBeInTheDocument()
    expect(lines()).toHaveLength(4)

    const dell = lineFor("Dell XPS 13", "White")
    expect(dell.getByText("$ 1799.99")).toBeInTheDocument()
    expect(stepperQuantity(dell, "Dell XPS 13, White")).toBe("1")

    const navy = lineFor("iPhone 11", "Navy Blue")
    expect(navy.getByText("$ 729.99")).toBeInTheDocument()
    expect(stepperQuantity(navy, "iPhone 11, Navy Blue")).toBe("3")
  })

  it("shows the bag total beside the thumbnails and offers checkout", () => {
    renderBag()

    expect(preview().getByText("$ 5,849.93")).toBeInTheDocument()
    expect(preview().getAllByRole("listitem")).toHaveLength(4)
    expect(preview().getByRole("link", { name: "Checkout" })).toHaveAttribute(
      "href",
      "/checkout"
    )
  })

  it("raises a quantity and the total, and announces it", async () => {
    renderBag()
    const dell = lineFor("Dell XPS 13", "White")

    await userEvent.click(
      dell.getByRole("button", {
        name: "Increase quantity of Dell XPS 13, White",
      })
    )

    expect(stepperQuantity(dell, "Dell XPS 13, White")).toBe("2")
    expect(preview().getByText("$ 7,649.92")).toBeInTheDocument()
    expect(
      screen.getByText("Dell XPS 13, White, quantity 2.")
    ).toBeInTheDocument()
  })

  it("lowers a quantity without removing the line", async () => {
    renderBag()
    const navy = lineFor("iPhone 11", "Navy Blue")

    await userEvent.click(
      navy.getByRole("button", {
        name: "Decrease quantity of iPhone 11, Navy Blue",
      })
    )

    expect(stepperQuantity(navy, "iPhone 11, Navy Blue")).toBe("2")
    expect(preview().getByText("$ 5,119.94")).toBeInTheDocument()
    expect(lines()).toHaveLength(4)
  })

  it("names the minus as a removal at one unit, and removes the line", async () => {
    renderBag()
    const white = lineFor("iPhone 11", "Milky White")

    await userEvent.click(
      white.getByRole("button", {
        name: "Remove iPhone 11, Milky White from bag",
      })
    )

    expect(lines()).toHaveLength(3)
    expect(screen.queryByText("Milky White")).toBeNull()
    expect(preview().getAllByRole("listitem")).toHaveLength(3)
    expect(preview().getByText("$ 5,229.94")).toBeInTheDocument()
    expect(
      screen.getByText("iPhone 11, Milky White, removed from bag.")
    ).toBeInTheDocument()
  })

  it("shows an empty state, a zero total, and no checkout once the bag is empty", async () => {
    render(
      <BagProvider initialItems={[demoBagReviewItems[2]]}>
        <BagScreen />
      </BagProvider>
    )

    await userEvent.click(
      screen.getByRole("button", {
        name: "Remove iPhone 11, Milky White from bag",
      })
    )

    expect(screen.getAllByText("Your bag is empty.").length).toBeGreaterThan(0)
    expect(
      screen.getByRole("link", { name: "Continue shopping" })
    ).toHaveAttribute("href", "/shop")
    expect(preview().getByText("$ 0.00")).toBeInTheDocument()
    expect(preview().queryByRole("link", { name: "Checkout" })).toBeNull()
  })

  it("keeps each stepper's controls in a labelled group", () => {
    renderBag()

    expect(
      screen.getByRole("group", { name: "Quantity of Dell XPS 13, White" })
    ).toBeInTheDocument()
  })
})
