import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"

import { StorefrontNav } from "@/components/storefront/layout/storefront-nav"
import { BagProvider } from "@/providers/bag-provider"
import { mockApi } from "@/test-utils/mock-api"
import { createBagServer } from "@/test-utils/storefront-bag-server"
import { createStorefrontProduct } from "@/test-utils/storefront-fixtures"
import type { BagDraftLine } from "@/types/storefront/bag.types"

const navigation = vi.hoisted(() => ({ pathname: "/shop" }))

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}))
// next/font only works inside the Next.js compiler.
vi.mock("next/font/google", () => ({
  Cabin: () => ({ variable: "font-cabin" }),
}))

beforeAll(() => {
  // jsdom has no matchMedia; the menu reads it to choose its side.
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia
})

const kettle = createStorefrontProduct({ id: "PRD-4001", name: "Kettle" })
const mug = createStorefrontProduct({ id: "PRD-4002", name: "Mug" })

let api: ReturnType<typeof mockApi> | undefined

afterEach(() => {
  api?.restore()
  api = undefined
})

function renderNav(pathname = "/shop", initialDraft?: BagDraftLine[]) {
  navigation.pathname = pathname
  if (initialDraft) api = mockApi(createBagServer([kettle, mug]).handle)
  return render(
    <BagProvider persist={false} initialDraft={initialDraft}>
      <StorefrontNav />
    </BagProvider>
  )
}

describe("StorefrontNav", () => {
  it("links the shop and bag icons to their routes and names the bag count", async () => {
    renderNav("/shop", [
      { productId: kettle.id, quantity: 3 },
      { productId: mug.id, quantity: 1 },
    ])

    expect(screen.getByRole("link", { name: "Shop" })).toHaveAttribute(
      "href",
      "/shop"
    )
    // The count is the server's: units across the lines, once it has answered.
    expect(
      await screen.findByRole("link", { name: "Bag, 4 items" })
    ).toHaveAttribute("href", "/bag")
  })

  it("says a bag of one is one item, and an empty bag is none", async () => {
    const { unmount } = renderNav("/shop")
    expect(screen.getByRole("link", { name: "Bag, 0 items" })).toBeVisible()
    unmount()

    renderNav("/shop", [{ productId: kettle.id, quantity: 1 }])
    expect(
      await screen.findByRole("link", { name: "Bag, 1 item" })
    ).toBeVisible()
  })

  it("marks the current section, on the shop and below it", () => {
    const { unmount } = renderNav("/shop")
    expect(screen.getByRole("link", { name: "Shop" })).toHaveAttribute(
      "aria-current",
      "page"
    )
    unmount()

    renderNav("/shop/iphone-11-product-red")
    expect(screen.getByRole("link", { name: "Shop" })).toHaveAttribute(
      "aria-current",
      "page"
    )
    expect(screen.getByRole("link", { name: /^Bag/ })).not.toHaveAttribute(
      "aria-current"
    )
  })

  it("marks the bag as current on /bag, and not the shop", () => {
    renderNav("/bag")

    expect(screen.getByRole("link", { name: /^Bag/ })).toHaveAttribute(
      "aria-current",
      "page"
    )
    expect(screen.getByRole("link", { name: "Shop" })).not.toHaveAttribute(
      "aria-current"
    )
  })

  it("keeps sign-out unavailable, with an explanation a screen reader can reach", async () => {
    renderNav()
    const signOut = screen.getByRole("button", { name: "Sign out" })

    expect(signOut).toHaveAttribute("aria-disabled", "true")
    expect(signOut).toHaveAccessibleDescription(
      "Sign out is not available yet in the storefront."
    )
    // Not natively disabled, so keyboard users can focus it and hear why.
    signOut.focus()
    expect(signOut).toHaveFocus()
  })

  it("opens a menu of the storefront destinations from the keyboard", async () => {
    renderNav()
    const trigger = screen.getByRole("button", { name: "Menu" })

    trigger.focus()
    await userEvent.keyboard("{Enter}")

    const items = await screen.findAllByRole("menuitem")
    expect(items.map((item) => item.textContent)).toEqual([
      "Shop",
      "Bag",
      "Checkout",
    ])
    expect(items.map((item) => item.getAttribute("href"))).toEqual([
      "/shop",
      "/bag",
      "/checkout",
    ])
    expect(items[0]).toHaveAttribute("aria-current", "page")

    await userEvent.keyboard("{Escape}")

    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull())
    expect(trigger).toHaveFocus()
  })
})
