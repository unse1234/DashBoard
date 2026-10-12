import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"

import { useAuth } from "@/hooks/use-auth"
import { ApiError } from "@/lib/api/api-error"
import { listOrders } from "@/services/orders/order.api";
import { type OrderPage } from "@/types/order.types";
import { OrdersList } from "@/screens/orders/components/orders-list"
import { OrdersTotal } from "@/screens/orders/components/orders-total"
import { createAuthUser } from "@/test-utils/auth-fixtures"
import {
  createOrderCustomer,
  createOrderListItem,
} from "@/test-utils/order-fixtures"
import { renderWithQuery } from "@/test-utils/render"

vi.mock("@/services/orders/order.api")
vi.mock("@/hooks/use-auth")

const daniel = createOrderListItem({
  id: "ORD-31620",
  customer: createOrderCustomer({
    id: "CUS-1002",
    name: "Daniel Reyes",
    email: "daniel.reyes@gmail.com",
  }),
  status: "shipped",
  paymentStatus: "paid",
  itemCount: 2,
  total: 189.9,
  createdAt: "2026-09-29T08:40:00Z",
})
const bottles = createOrderListItem({
  id: "ORD-31624",
  status: "delivered",
  paymentStatus: "paid",
  // Two bottles and a coffee dripper: units, not lines.
  itemCount: 3,
  total: 94.5,
})
const processing = createOrderListItem({
  id: "ORD-31656",
  status: "processing",
  paymentStatus: "paid",
  itemCount: 1,
  total: 61.75,
})
const unpaid = createOrderListItem({
  id: "ORD-31640",
  status: "pending",
  paymentStatus: "pending",
  itemCount: 1,
  total: 20,
})
const allOrders = [daniel, bottles, processing, unpaid]

function page(orders = allOrders, totalRecords = 248): OrderPage {
  return { orders, totalRecords }
}

async function renderList() {
  renderWithQuery(<OrdersList />)
  await screen.findByRole("link", { name: "ORD-31620" })
  return userEvent.setup()
}

function lastQuery() {
  return vi.mocked(listOrders).mock.lastCall?.[0]
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

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(listOrders).mockResolvedValue(page())
  vi.mocked(useAuth).mockReturnValue({
    status: "authenticated",
    user: createAuthUser({ role: "STAFF" }),
  })
})

describe("OrdersList loading", () => {
  it("shows placeholder rows until the first page arrives", async () => {
    let resolve: (value: OrderPage) => void = () => {}
    vi.mocked(listOrders).mockReturnValue(new Promise((res) => (resolve = res)))
    renderWithQuery(<OrdersList />)

    expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true")
    expect(screen.queryByText("No orders found")).not.toBeInTheDocument()

    resolve(page())
    expect(
      await screen.findByRole("link", { name: "ORD-31620" })
    ).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "false")
    )
  })

  it("requests the first page of ten, unsorted and unfiltered", async () => {
    await renderList()

    expect(listOrders).toHaveBeenCalledWith(
      {
        search: "",
        status: "all",
        paymentStatus: "all",
        sort: null,
        page: 1,
        pageSize: 10,
      },
      expect.any(AbortSignal)
    )
  })

  it("explains a failed load and retries on request", async () => {
    vi.mocked(listOrders).mockRejectedValueOnce(
      new ApiError(500, ["internal detail"])
    )
    renderWithQuery(<OrdersList />)

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent("Couldn't load orders")
    expect(alert).not.toHaveTextContent("internal detail")

    await userEvent.click(screen.getByRole("button", { name: "Try again" }))

    expect(
      await screen.findByRole("link", { name: "ORD-31620" })
    ).toBeInTheDocument()
    expect(listOrders).toHaveBeenCalledTimes(2)
  })
})

describe("OrdersList table", () => {
  it("shows the columns in order, with one row per order returned", async () => {
    await renderList()

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
    expect(screen.getAllByRole("row")).toHaveLength(allOrders.length + 1)
  })

  it("links each order ID to the order's details page", async () => {
    await renderList()

    expect(screen.getByRole("link", { name: "ORD-31620" })).toHaveAttribute(
      "href",
      "/dashboard/orders/ORD-31620"
    )
  })

  it("shows the customer, date, item count and total", async () => {
    await renderList()
    const row = within(getRow("ORD-31620"))

    expect(row.getByText("Daniel Reyes")).toBeInTheDocument()
    expect(row.getByText("daniel.reyes@gmail.com")).toBeInTheDocument()
    expect(row.getByText("Sep 29, 2026")).toBeInTheDocument()
    expect(row.getByText("2")).toBeInTheDocument()
    expect(row.getByText("$189.90")).toBeInTheDocument()
  })

  it("shows the units the API counted in the Items column", async () => {
    await renderList()

    expect(within(getRow("ORD-31624")).getByText("3")).toBeInTheDocument()
  })

  it("shows the order and payment status as text", async () => {
    await renderList()

    const shipped = within(getRow("ORD-31656"))
    expect(shipped.getByText("Processing")).toBeInTheDocument()
    expect(shipped.getByText("Paid")).toBeInTheDocument()

    const pending = within(getRow("ORD-31640"))
    expect(pending.getAllByText("Pending")).toHaveLength(2)
  })

  it("shows the empty state when nothing matches", async () => {
    vi.mocked(listOrders).mockResolvedValue(page([], 0))
    renderWithQuery(<OrdersList />)

    expect(await screen.findByText("No orders found")).toBeInTheDocument()
  })

  it("right-aligns the numeric columns and leaves Actions unsortable", async () => {
    await renderList()

    expect(getHeader("Items")).toHaveClass("text-right")
    expect(getHeader("Total")).toHaveClass("text-right")
    expect(getHeader("Actions")).not.toHaveAttribute("aria-sort")
    expect(getHeader("Order ID")).toHaveAttribute("aria-sort", "none")
  })
})

describe("OrdersList sorting", () => {
  it("cycles one column through ascending, descending and unsorted, asking the API each time", async () => {
    const user = await renderList()

    await user.click(within(getHeader("Total")).getByRole("button"))
    expect(getHeader("Total")).toHaveAttribute("aria-sort", "ascending")
    await waitFor(() =>
      expect(lastQuery()?.sort).toEqual({ column: "total", direction: "asc" })
    )

    await user.click(within(getHeader("Total")).getByRole("button"))
    expect(getHeader("Total")).toHaveAttribute("aria-sort", "descending")
    await waitFor(() =>
      expect(lastQuery()?.sort).toEqual({ column: "total", direction: "desc" })
    )

    await user.click(within(getHeader("Total")).getByRole("button"))
    expect(getHeader("Total")).toHaveAttribute("aria-sort", "none")
    // Unsorted is the page that was loaded first, still fresh in the cache.
    expect(listOrders).toHaveBeenCalledTimes(3)
    expect(screen.getByRole("link", { name: "ORD-31620" })).toBeInTheDocument()
  })

  it("only ever marks one column as sorted", async () => {
    const user = await renderList()

    await user.click(within(getHeader("Order ID")).getByRole("button"))
    await user.click(within(getHeader("Customer")).getByRole("button"))

    expect(getHeader("Order ID")).toHaveAttribute("aria-sort", "none")
    expect(getHeader("Customer")).toHaveAttribute("aria-sort", "ascending")
  })

  it("shows the rows in the order the API returns them", async () => {
    const user = await renderList()
    vi.mocked(listOrders).mockResolvedValue(
      page([unpaid, processing, bottles, daniel])
    )

    await user.click(within(getHeader("Total")).getByRole("button"))

    await waitFor(() =>
      expect(getListedIds()).toEqual([
        "ORD-31640",
        "ORD-31656",
        "ORD-31624",
        "ORD-31620",
      ])
    )
  })

  it("returns to the first page when the sort changes", async () => {
    const user = await renderList()

    await user.click(screen.getByRole("button", { name: "Go to page 3" }))
    await waitFor(() => expect(lastQuery()).toMatchObject({ page: 3 }))
    await user.click(within(getHeader("Total")).getByRole("button"))

    await waitFor(() =>
      expect(lastQuery()).toMatchObject({
        page: 1,
        sort: { column: "total", direction: "asc" },
      })
    )
    expect(screen.getByText("1–10")).toBeInTheDocument()
  })
})

describe("OrdersList search and filters", () => {
  it("searches after typing pauses and returns to page one", async () => {
    const user = await renderList()
    await user.click(screen.getByRole("button", { name: "Go to page 3" }))
    await waitFor(() => expect(lastQuery()).toMatchObject({ page: 3 }))

    await user.type(getSearchBox(), "daniel")

    expect(getSearchBox()).toHaveValue("daniel")
    await waitFor(() =>
      expect(lastQuery()).toMatchObject({ search: "daniel", page: 1 })
    )
    // Not one request per keystroke.
    const searches = vi
      .mocked(listOrders)
      .mock.calls.filter(([query]) => query.search !== "")
    expect(searches).toHaveLength(1)
  })

  it("defaults both filters to All", async () => {
    await renderList()

    expect(
      screen.getByRole("combobox", { name: "Filter by order status" })
    ).toHaveTextContent("All")
    expect(
      screen.getByRole("combobox", { name: "Filter by payment status" })
    ).toHaveTextContent("All")
  })

  it("asks the API for the statuses chosen, from page one", async () => {
    const user = await renderList()
    await user.click(screen.getByRole("button", { name: "Go to page 2" }))
    await waitFor(() => expect(lastQuery()).toMatchObject({ page: 2 }))

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
    await waitFor(() =>
      expect(lastQuery()).toMatchObject({
        status: "shipped",
        paymentStatus: "refunded",
        page: 1,
      })
    )
  })
})

describe("OrdersList pagination", () => {
  it("reports the visible range and the total", async () => {
    await renderList()

    expect(screen.getByText("1–10")).toBeInTheDocument()
    expect(screen.getByText("248")).toBeInTheDocument()
    expect(
      screen.getByRole("navigation", { name: "orders pagination" })
    ).toBeInTheDocument()
  })

  it("asks the API for the next page and keeps the rows until it arrives", async () => {
    const user = await renderList()
    let resolveNext: (value: OrderPage) => void = () => {}
    vi.mocked(listOrders).mockReturnValueOnce(
      new Promise((res) => (resolveNext = res))
    )
    const previous = screen.getByRole("button", { name: "Go to previous page" })
    expect(previous).toBeDisabled()

    await user.click(screen.getByRole("button", { name: "Go to next page" }))

    await waitFor(() => expect(lastQuery()).toMatchObject({ page: 2 }))
    expect(screen.getByText("11–20")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Go to page 2" })
    ).toHaveAttribute("aria-current", "page")
    expect(previous).toBeEnabled()
    // The previous page stays on screen (dimmed) instead of blanking the table.
    expect(screen.getByRole("link", { name: "ORD-31620" })).toBeInTheDocument()
    expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true")

    resolveNext(page([createOrderListItem({ id: "ORD-40000" })]))
    expect(
      await screen.findByRole("link", { name: "ORD-40000" })
    ).toBeInTheDocument()
  })

  it("lets the page size be changed", async () => {
    const user = await renderList()

    await user.click(screen.getByRole("combobox", { name: "Rows per page" }))
    await user.click(await screen.findByRole("option", { name: "20" }))

    await waitFor(() =>
      expect(lastQuery()).toMatchObject({ pageSize: 20, page: 1 })
    )
    expect(screen.getByText("1–20")).toBeInTheDocument()
  })

  it("steps back to the last page when the list has shrunk", async () => {
    const user = await renderList()
    await user.click(screen.getByRole("button", { name: "Go to page 3" }))
    await waitFor(() => expect(lastQuery()).toMatchObject({ page: 3 }))

    // Page 4 comes back empty: there are now only enough orders for two pages.
    vi.mocked(listOrders).mockResolvedValue(page([], 15))
    await user.click(screen.getByRole("button", { name: "Go to next page" }))

    await waitFor(() => expect(lastQuery()).toMatchObject({ page: 2 }))
  })
})

describe("OrdersList row actions", () => {
  it("links View to the order's details page and offers nothing else", async () => {
    const user = await renderList()

    await user.click(
      screen.getByRole("button", { name: "Actions for order ORD-31640" })
    )

    expect(
      await screen.findByRole("menuitem", { name: "View" })
    ).toHaveAttribute("href", "/dashboard/orders/ORD-31640")
    expect(screen.getAllByRole("menuitem")).toHaveLength(1)
  })
})

describe("OrdersTotal", () => {
  it("shows the overall total, sharing the list's first request", async () => {
    renderWithQuery(
      <>
        <OrdersTotal />
        <OrdersList />
      </>
    )

    expect(await screen.findByText("248 orders in total.")).toBeInTheDocument()
    expect(listOrders).toHaveBeenCalledTimes(1)
  })

  it("keeps the overall total while the list is searched", async () => {
    renderWithQuery(
      <>
        <OrdersTotal />
        <OrdersList />
      </>
    )
    await screen.findByText("248 orders in total.")
    vi.mocked(listOrders).mockResolvedValue(page([daniel], 1))

    await userEvent.type(getSearchBox(), "daniel")

    await waitFor(() => expect(lastQuery()).toMatchObject({ search: "daniel" }))
    expect(await screen.findByText("1–1")).toBeInTheDocument()
    expect(screen.getByText("248 orders in total.")).toBeInTheDocument()
  })

  it("shows nothing until the total is known", () => {
    vi.mocked(listOrders).mockReturnValue(new Promise(() => {}))
    const { container } = renderWithQuery(<OrdersTotal />)

    expect(container).toBeEmptyDOMElement()
  })
})
