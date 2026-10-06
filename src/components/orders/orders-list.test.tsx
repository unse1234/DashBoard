import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { OrdersList } from "@/components/orders/orders-list"
import { mockOrders } from "@/lib/orders/order.mock-data"

type User = ReturnType<typeof userEvent.setup>

function renderList(orders = mockOrders) {
  return render(<OrdersList orders={orders} />)
}

function getHeader(name: string) {
  return screen.getByRole("columnheader", { name })
}

function getRow(orderId: string) {
  return screen.getByRole("row", { name: new RegExp(orderId) })
}

/** The order IDs in the table body, top to bottom. */
function getListedIds() {
  return screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[0]?.textContent)
}

function getSearchBox() {
  return screen.getByRole("searchbox", {
    name: "Search orders by order ID, customer name or email",
  })
}

function getSummary() {
  return screen.getByText(/^Showing/)
}

// Pastes rather than types: one change per search keeps the longer tests fast.
async function search(user: User, term: string) {
  await user.clear(getSearchBox())
  await user.paste(term)
}

async function choose(user: User, filter: string, option: string) {
  await user.click(screen.getByRole("combobox", { name: filter }))
  await user.click(await screen.findByRole("option", { name: option }))
}

describe("OrdersList table", () => {
  it("shows the columns in order, with one row per order on the first page", () => {
    renderList()

    expect(
      screen
        .getAllByRole("columnheader")
        .map((header) => header.textContent?.trim())
    ).toEqual([
      "Order ID",
      "Customer",
      "Date",
      "Items",
      "Total",
      "Payment",
      "Status",
      "Actions",
    ])
    expect(screen.getAllByRole("row")).toHaveLength(10 + 1)
    expect(getListedIds()[0]).toBe("ORD-31656")
  })

  it("links each order ID to the order's details page", () => {
    renderList()

    expect(screen.getByRole("link", { name: "ORD-31620" })).toHaveAttribute(
      "href",
      "/dashboard/orders/ORD-31620"
    )
  })

  it("shows the customer, date, item count and total", () => {
    renderList()
    const row = within(getRow("ORD-31620"))

    expect(row.getByText("Daniel Reyes")).toBeInTheDocument()
    expect(row.getByText("daniel.reyes@gmail.com")).toBeInTheDocument()
    expect(row.getByText("Sep 29, 2026")).toBeInTheDocument()
    expect(row.getByText("2")).toBeInTheDocument()
    expect(row.getByText("$189.90")).toBeInTheDocument()
  })

  it("counts units, not lines, in the Items column", () => {
    renderList()

    // Two bottles and a coffee dripper.
    expect(within(getRow("ORD-31624")).getByText("3")).toBeInTheDocument()
  })

  it("shows the order and payment status as text", () => {
    renderList()

    const processing = within(getRow("ORD-31656"))
    expect(processing.getByText("Processing")).toBeInTheDocument()
    expect(processing.getByText("Paid")).toBeInTheDocument()

    const pending = within(getRow("ORD-31640"))
    expect(pending.getAllByText("Pending")).toHaveLength(2)
  })

  it("right-aligns the numeric columns and leaves Actions unsortable", () => {
    renderList()

    expect(getHeader("Items")).toHaveClass("text-right")
    expect(getHeader("Total")).toHaveClass("text-right")
    expect(getHeader("Actions")).not.toHaveAttribute("aria-sort")
    expect(getHeader("Order ID")).toHaveAttribute("aria-sort", "none")
  })
})

describe("OrdersList sorting", () => {
  it("cycles one column through ascending, descending and unsorted", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(within(getHeader("Order ID")).getByRole("button"))
    expect(getHeader("Order ID")).toHaveAttribute("aria-sort", "ascending")
    expect(getListedIds()[0]).toBe("ORD-31224")

    await user.click(within(getHeader("Order ID")).getByRole("button"))
    expect(getHeader("Order ID")).toHaveAttribute("aria-sort", "descending")
    expect(getListedIds()[0]).toBe("ORD-31656")

    await user.click(within(getHeader("Order ID")).getByRole("button"))
    expect(getHeader("Order ID")).toHaveAttribute("aria-sort", "none")
    expect(getListedIds()[0]).toBe("ORD-31656")
  })

  it("only ever marks one column as sorted", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(within(getHeader("Order ID")).getByRole("button"))
    await user.click(within(getHeader("Customer")).getByRole("button"))

    expect(getHeader("Order ID")).toHaveAttribute("aria-sort", "none")
    expect(getHeader("Customer")).toHaveAttribute("aria-sort", "ascending")
  })

  it("sorts by customer name", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(within(getHeader("Customer")).getByRole("button"))

    // Aiko Tanabe, then Chloe Bennett.
    expect(getListedIds().slice(0, 2)).toEqual(["ORD-31588", "ORD-31416"])
  })

  it("sorts the totals by value, across every page", async () => {
    renderList()
    const user = userEvent.setup()

    // ORD-31344 is on the second page until the totals are sorted.
    expect(getListedIds()).not.toContain("ORD-31344")
    await user.click(within(getHeader("Total")).getByRole("button"))
    await user.click(within(getHeader("Total")).getByRole("button"))

    expect(getListedIds().slice(0, 3)).toEqual([
      "ORD-31604",
      "ORD-31640",
      "ORD-31344",
    ])
  })

  it("sorts by date, oldest first when ascending", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(within(getHeader("Date")).getByRole("button"))

    expect(getListedIds()[0]).toBe("ORD-31224")
  })

  it("sorts by the number of items", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(within(getHeader("Items")).getByRole("button"))
    await user.click(within(getHeader("Items")).getByRole("button"))

    // Three orders have three items; ties keep the newest first.
    expect(getListedIds()[0]).toBe("ORD-31624")
  })

  it("sorts statuses by how far along the orders are", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(within(getHeader("Status")).getByRole("button"))

    expect(getListedIds().slice(0, 2)).toEqual(["ORD-31640", "ORD-31656"])

    await user.click(within(getHeader("Status")).getByRole("button"))

    expect(getListedIds()[0]).toBe("ORD-31224")
  })

  it("sorts payment statuses as pending, paid, refunded", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(within(getHeader("Payment")).getByRole("button"))
    expect(getListedIds()[0]).toBe("ORD-31640")

    await user.click(within(getHeader("Payment")).getByRole("button"))
    expect(getListedIds()[0]).toBe("ORD-31224")
  })

  it("returns to the first page when the sort changes", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: "Go to page 2" }))
    await user.click(within(getHeader("Total")).getByRole("button"))

    expect(getSummary()).toHaveTextContent("Showing 1–10")
  })
})

describe("OrdersList search", () => {
  it("narrows the list as the search is typed", async () => {
    renderList()
    const user = userEvent.setup()

    await user.type(getSearchBox(), "rey")

    expect(getSearchBox()).toHaveValue("rey")
    expect(getListedIds()).toEqual(["ORD-31620", "ORD-31516"])
    expect(getSummary()).toHaveTextContent("Showing 1–2 of 2 orders")
  })

  it("finds orders by order ID, customer name and email", async () => {
    renderList()
    const user = userEvent.setup()

    await search(user, "ord-31588")
    expect(getListedIds()).toEqual(["ORD-31588"])

    await search(user, "31588")
    expect(getListedIds()).toEqual(["ORD-31588"])

    await search(user, "Aiko Tanabe")
    expect(getListedIds()).toEqual(["ORD-31588"])

    await search(user, "sakuramail")
    expect(getListedIds()).toEqual(["ORD-31588"])
  })

  it("shows the empty state when nothing matches", async () => {
    renderList()
    const user = userEvent.setup()

    await search(user, "no such order")

    expect(screen.getByText("No orders found")).toBeInTheDocument()
    expect(
      screen.getByText("Try adjusting your search or filters.")
    ).toBeInTheDocument()
    expect(getSummary()).toHaveTextContent("Showing 0–0 of 0 orders")
  })

  it("starts again from the first page", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: "Go to page 2" }))
    await search(user, "a")

    expect(getSummary()).toHaveTextContent("Showing 1–10")
  })
})

describe("OrdersList filters", () => {
  it("defaults to every order and payment status", () => {
    renderList()

    expect(
      screen.getByRole("combobox", { name: "Filter by order status" })
    ).toHaveTextContent("All")
    expect(
      screen.getByRole("combobox", { name: "Filter by payment status" })
    ).toHaveTextContent("All")
  })

  it("lists only the orders with the chosen order status", async () => {
    renderList()
    const user = userEvent.setup()

    await choose(user, "Filter by order status", "Shipped")

    expect(getListedIds()).toEqual(["ORD-31624", "ORD-31620"])
    expect(getSummary()).toHaveTextContent("Showing 1–2 of 2 orders")

    await choose(user, "Filter by order status", "Cancelled")
    expect(getListedIds()).toEqual(["ORD-31224"])

    await choose(user, "Filter by order status", "All")
    expect(getSummary()).toHaveTextContent(`of ${mockOrders.length} orders`)
  })

  it("lists only the orders with the chosen payment status", async () => {
    renderList()
    const user = userEvent.setup()

    await choose(user, "Filter by payment status", "Refunded")
    expect(getListedIds()).toEqual(["ORD-31224"])

    await choose(user, "Filter by payment status", "Pending")
    expect(getListedIds()).toEqual(["ORD-31640"])

    await choose(user, "Filter by payment status", "Paid")
    expect(getSummary()).toHaveTextContent("of 14 orders")
  })

  it("combines both filters with the search", async () => {
    renderList()
    const user = userEvent.setup()

    await choose(user, "Filter by order status", "Delivered")
    expect(getSummary()).toHaveTextContent("of 11 orders")

    await choose(user, "Filter by payment status", "Refunded")
    expect(screen.getByText("No orders found")).toBeInTheDocument()

    await choose(user, "Filter by payment status", "Paid")
    await search(user, "tobias")
    expect(getListedIds()).toEqual(["ORD-31396"])
  })

  it("starts again from the first page", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: "Go to page 2" }))
    await choose(user, "Filter by order status", "Delivered")

    expect(getSummary()).toHaveTextContent("Showing 1–10 of 11 orders")
  })
})

describe("OrdersList pagination", () => {
  it("reports the visible range and total", () => {
    renderList()

    expect(getSummary()).toHaveTextContent(
      `Showing 1–10 of ${mockOrders.length} orders`
    )
    expect(
      screen.getByRole("navigation", { name: "orders pagination" })
    ).toBeInTheDocument()
  })

  it("moves between pages and shows the short last page", async () => {
    renderList()
    const user = userEvent.setup()
    const previous = screen.getByRole("button", { name: "Go to previous page" })
    const next = screen.getByRole("button", { name: "Go to next page" })

    expect(previous).toBeDisabled()

    await user.click(next)
    expect(getSummary()).toHaveTextContent(
      `Showing 11–${mockOrders.length} of ${mockOrders.length} orders`
    )
    expect(getListedIds()).toHaveLength(mockOrders.length - 10)
    expect(previous).toBeEnabled()
    expect(next).toBeDisabled()

    await user.click(screen.getByRole("button", { name: "Go to page 1" }))
    expect(getListedIds()[0]).toBe("ORD-31656")
  })

  it("shows more rows when the page size grows", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(screen.getByRole("combobox", { name: "Rows per page" }))
    await user.click(await screen.findByRole("option", { name: "20" }))

    expect(screen.getAllByRole("row")).toHaveLength(mockOrders.length + 1)
    expect(getSummary()).toHaveTextContent(`Showing 1–${mockOrders.length}`)
  })
})

describe("OrdersList row actions", () => {
  it("links View to the order's details page", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(
      screen.getByRole("button", { name: "Actions for order ORD-31588" })
    )

    expect(await screen.findByRole("menuitem", { name: "View" })).toHaveAttribute(
      "href",
      "/dashboard/orders/ORD-31588"
    )
  })

  it("offers nothing that changes the order", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(
      screen.getByRole("button", { name: "Actions for order ORD-31588" })
    )

    expect(await screen.findAllByRole("menuitem")).toHaveLength(1)
  })
})

describe("OrdersList without orders", () => {
  it("shows the empty state", () => {
    renderList([])

    expect(screen.getByText("No orders found")).toBeInTheDocument()
    expect(getSummary()).toHaveTextContent("Showing 0–0 of 0 orders")
  })
})
