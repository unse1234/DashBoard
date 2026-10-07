import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { mockOrders, mockTotalOrders } from "@/lib/orders/order.mock-data"
import { OrdersList } from "@/screens/orders/components/orders-list"

function renderList(orders = mockOrders) {
  return render(<OrdersList orders={orders} totalRecords={mockTotalOrders} />)
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

describe("OrdersList table", () => {
  it("shows the columns in order, with one row per order it is given", () => {
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
    expect(screen.getAllByRole("row")).toHaveLength(mockOrders.length + 1)
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

  it("shows the empty state when there are no orders", () => {
    renderList([])

    expect(screen.getByText("No orders found")).toBeInTheDocument()
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

    await user.click(within(getHeader("Total")).getByRole("button"))
    expect(getHeader("Total")).toHaveAttribute("aria-sort", "ascending")

    await user.click(within(getHeader("Total")).getByRole("button"))
    expect(getHeader("Total")).toHaveAttribute("aria-sort", "descending")

    await user.click(within(getHeader("Total")).getByRole("button"))
    expect(getHeader("Total")).toHaveAttribute("aria-sort", "none")
  })

  it("only ever marks one column as sorted", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(within(getHeader("Order ID")).getByRole("button"))
    await user.click(within(getHeader("Customer")).getByRole("button"))

    expect(getHeader("Order ID")).toHaveAttribute("aria-sort", "none")
    expect(getHeader("Customer")).toHaveAttribute("aria-sort", "ascending")
  })

  it("does not reorder the rows it was given", async () => {
    renderList()
    const user = userEvent.setup()
    const before = getListedIds()

    await user.click(within(getHeader("Total")).getByRole("button"))
    await user.click(within(getHeader("Customer")).getByRole("button"))

    expect(getListedIds()).toEqual(before)
  })

  it("returns to the first page when the sort changes", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: "Go to page 2" }))
    await user.click(within(getHeader("Total")).getByRole("button"))

    expect(screen.getByText("1–10")).toBeInTheDocument()
  })
})

describe("OrdersList toolbar", () => {
  it("keeps the typed search text without filtering the rows", async () => {
    renderList()
    const user = userEvent.setup()
    const before = getListedIds()

    await user.type(getSearchBox(), "no such order")

    expect(getSearchBox()).toHaveValue("no such order")
    expect(getListedIds()).toEqual(before)
  })

  it("defaults both filters to All", () => {
    renderList()

    expect(
      screen.getByRole("combobox", { name: "Filter by order status" })
    ).toHaveTextContent("All")
    expect(
      screen.getByRole("combobox", { name: "Filter by payment status" })
    ).toHaveTextContent("All")
  })

  it("lets both filters be changed without filtering the rows", async () => {
    renderList()
    const user = userEvent.setup()
    const before = getListedIds()

    await user.click(
      screen.getByRole("combobox", { name: "Filter by order status" })
    )
    await user.click(await screen.findByRole("option", { name: "Shipped" }))
    await user.click(
      screen.getByRole("combobox", { name: "Filter by payment status" })
    )
    await user.click(await screen.findByRole("option", { name: "Refunded" }))

    expect(
      screen.getByRole("combobox", { name: "Filter by order status" })
    ).toHaveTextContent("Shipped")
    expect(
      screen.getByRole("combobox", { name: "Filter by payment status" })
    ).toHaveTextContent("Refunded")
    expect(getListedIds()).toEqual(before)
  })
})

describe("OrdersList pagination", () => {
  it("reports the visible range and the total it is given", () => {
    renderList()

    expect(screen.getByText("1–10")).toBeInTheDocument()
    expect(screen.getByText(String(mockTotalOrders))).toBeInTheDocument()
    expect(
      screen.getByRole("navigation", { name: "orders pagination" })
    ).toBeInTheDocument()
  })

  it("moves between pages without changing the rows", async () => {
    renderList()
    const user = userEvent.setup()
    const before = getListedIds()
    const previous = screen.getByRole("button", { name: "Go to previous page" })

    expect(previous).toBeDisabled()

    await user.click(screen.getByRole("button", { name: "Go to next page" }))

    expect(screen.getByRole("button", { name: "Go to page 2" })).toHaveAttribute(
      "aria-current",
      "page"
    )
    expect(previous).toBeEnabled()
    expect(getListedIds()).toEqual(before)
  })

  it("lets the page size be changed", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(screen.getByRole("combobox", { name: "Rows per page" }))
    await user.click(await screen.findByRole("option", { name: "20" }))

    expect(screen.getByText(`1–${mockTotalOrders}`)).toBeInTheDocument()
  })
})

describe("OrdersList row actions", () => {
  it("links View to the order's details page and offers nothing else", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(
      screen.getByRole("button", { name: "Actions for order ORD-31588" })
    )

    expect(await screen.findByRole("menuitem", { name: "View" })).toHaveAttribute(
      "href",
      "/dashboard/orders/ORD-31588"
    )
    expect(screen.getAllByRole("menuitem")).toHaveLength(1)
  })
})
