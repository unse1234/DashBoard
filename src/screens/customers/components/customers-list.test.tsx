import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"

import { useAuth } from "@/hooks/use-auth"
import { ApiError } from "@/lib/api/api-error"
import { listCustomers } from "@/lib/customers/customer.api";
import { type CustomerPage } from "@/types/customer.types";
import { CustomersList } from "@/screens/customers/components/customers-list"
import { CustomersTotal } from "@/screens/customers/components/customers-total"
import { createAuthUser } from "@/test-utils/auth-fixtures"
import { createCustomer } from "@/test-utils/customer-fixtures"
import { renderWithQuery } from "@/test-utils/render"

vi.mock("@/lib/customers/customer.api")
vi.mock("@/hooks/use-auth")

const olivia = createCustomer({ id: "CUS-1001", name: "Olivia Martin" })
const daniel = createCustomer({
  id: "CUS-1002",
  name: "Daniel Reyes",
  email: "daniel.reyes@example.com",
  totalOrders: 23,
  totalSpent: 6212.4,
  joinedAt: "2022-05-19T14:02:00Z",
})
const lucas = createCustomer({
  id: "CUS-1003",
  name: "Lucas Ferreira",
  email: "lucas@example.com",
  phone: null,
})
const aiko = createCustomer({
  id: "CUS-1004",
  name: "Aiko Tanabe",
  email: "aiko@example.com",
})

function page(
  customers = [olivia, daniel, lucas, aiko],
  totalRecords = 248
): CustomerPage {
  return { customers, totalRecords }
}

async function renderList() {
  renderWithQuery(<CustomersList />)
  await screen.findByText("Daniel Reyes")
  return userEvent.setup()
}

function lastQuery() {
  return vi.mocked(listCustomers).mock.lastCall?.[0]
}

function getHeader(name: string) {
  return screen.getByRole("columnheader", { name })
}

function getRow(name: string) {
  return screen.getByRole("row", { name: new RegExp(name) })
}

function getSearchBox() {
  return screen.getByRole("searchbox", {
    name: "Search customers by ID, name, email or phone",
  })
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(listCustomers).mockResolvedValue(page())
  vi.mocked(useAuth).mockReturnValue({
    status: "authenticated",
    user: createAuthUser({ role: "STAFF" }),
  })
})

describe("CustomersList loading", () => {
  it("shows placeholder rows until the first page arrives", async () => {
    let resolve: (value: CustomerPage) => void = () => {}
    vi.mocked(listCustomers).mockReturnValue(
      new Promise((res) => (resolve = res))
    )
    renderWithQuery(<CustomersList />)

    expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true")
    expect(screen.queryByText("No customers found")).not.toBeInTheDocument()

    resolve(page())
    expect(await screen.findByText("Daniel Reyes")).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "false")
    )
  })

  it("requests the first page of ten, unsorted and unfiltered", async () => {
    await renderList()

    expect(listCustomers).toHaveBeenCalledWith(
      { search: "", sort: null, page: 1, pageSize: 10 },
      expect.any(AbortSignal)
    )
  })

  it("explains a failed load and retries on request", async () => {
    vi.mocked(listCustomers).mockRejectedValueOnce(
      new ApiError(500, ["internal detail"])
    )
    renderWithQuery(<CustomersList />)

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent("Couldn't load customers")
    expect(alert).not.toHaveTextContent("internal detail")

    await userEvent.click(screen.getByRole("button", { name: "Try again" }))

    expect(await screen.findByText("Daniel Reyes")).toBeInTheDocument()
    expect(listCustomers).toHaveBeenCalledTimes(2)
  })
})

describe("CustomersList table", () => {
  it("shows the columns in order, with one row per customer returned", async () => {
    await renderList()

    expect(
      screen
        .getAllByRole("columnheader")
        .map((header) => header.textContent?.trim())
    ).toEqual([
      "Customer ID",
      "Name",
      "Email",
      "Phone",
      "Orders",
      "Total Spent",
      "Joined",
      "Actions",
    ])
    expect(screen.getAllByRole("row")).toHaveLength(5)
  })

  it("has no status column or status filter", async () => {
    await renderList()

    expect(screen.queryByRole("columnheader", { name: "Status" })).toBeNull()
    expect(screen.queryByRole("combobox", { name: /status/i })).toBeNull()
    expect(screen.queryByText("Active")).toBeNull()
    expect(screen.queryByText("Inactive")).toBeNull()
  })

  it("links each name to the customer's details page", async () => {
    await renderList()

    expect(screen.getByRole("link", { name: "Daniel Reyes" })).toHaveAttribute(
      "href",
      "/dashboard/customers/CUS-1002"
    )
  })

  it("formats the order count, total spent and join date", async () => {
    await renderList()
    const row = within(getRow("Daniel Reyes"))

    expect(row.getByText("CUS-1002")).toBeInTheDocument()
    expect(row.getByText("23")).toBeInTheDocument()
    expect(row.getByText("$6,212.40")).toBeInTheDocument()
    expect(row.getByText("May 19, 2022")).toBeInTheDocument()
  })

  it("marks a missing phone number, and only shows Phone on wide tables", async () => {
    await renderList()

    expect(
      within(getRow("Lucas Ferreira")).getByText("Not provided")
    ).toBeInTheDocument()
    expect(getHeader("Phone")).toHaveClass("hidden", "@6xl:table-cell")
  })

  it("shows the empty state when nothing matches", async () => {
    vi.mocked(listCustomers).mockResolvedValue(page([], 0))
    renderWithQuery(<CustomersList />)

    expect(await screen.findByText("No customers found")).toBeInTheDocument()
  })

  it("right-aligns the numeric columns and leaves Phone and Actions unsortable", async () => {
    await renderList()

    expect(getHeader("Orders")).toHaveClass("text-right")
    expect(getHeader("Total Spent")).toHaveClass("text-right")
    expect(getHeader("Phone")).not.toHaveAttribute("aria-sort")
    expect(getHeader("Actions")).not.toHaveAttribute("aria-sort")
  })
})

describe("CustomersList sorting", () => {
  it("cycles one column through ascending, descending and unsorted, asking the API each time", async () => {
    const user = await renderList()

    expect(getHeader("Name")).toHaveAttribute("aria-sort", "none")

    await user.click(within(getHeader("Name")).getByRole("button"))
    expect(getHeader("Name")).toHaveAttribute("aria-sort", "ascending")
    await waitFor(() =>
      expect(lastQuery()?.sort).toEqual({ column: "name", direction: "asc" })
    )

    await user.click(within(getHeader("Name")).getByRole("button"))
    expect(getHeader("Name")).toHaveAttribute("aria-sort", "descending")
    await waitFor(() =>
      expect(lastQuery()?.sort).toEqual({ column: "name", direction: "desc" })
    )

    await user.click(within(getHeader("Name")).getByRole("button"))
    expect(getHeader("Name")).toHaveAttribute("aria-sort", "none")
  })

  it("only ever marks one column as sorted", async () => {
    const user = await renderList()

    await user.click(within(getHeader("Name")).getByRole("button"))
    await user.click(within(getHeader("Email")).getByRole("button"))

    expect(getHeader("Name")).toHaveAttribute("aria-sort", "none")
    expect(getHeader("Email")).toHaveAttribute("aria-sort", "ascending")
  })

  it("shows the rows in the order the API returns them", async () => {
    const user = await renderList()
    vi.mocked(listCustomers).mockResolvedValue(
      page([aiko, lucas, daniel, olivia])
    )

    await user.click(within(getHeader("Total Spent")).getByRole("button"))

    await waitFor(() =>
      expect(
        screen
          .getAllByRole("link")
          .filter((link) => link.closest("td"))
          .map((link) => link.textContent)
      ).toEqual([
        "Aiko Tanabe",
        "Lucas Ferreira",
        "Daniel Reyes",
        "Olivia Martin",
      ])
    )
  })

  it("returns to the first page when the sort changes", async () => {
    const user = await renderList()

    await user.click(screen.getByRole("button", { name: "Go to page 3" }))
    await waitFor(() => expect(lastQuery()).toMatchObject({ page: 3 }))
    await user.click(within(getHeader("Name")).getByRole("button"))

    await waitFor(() =>
      expect(lastQuery()).toMatchObject({
        page: 1,
        sort: { column: "name", direction: "asc" },
      })
    )
    expect(screen.getByText("1–10")).toBeInTheDocument()
  })
})

describe("CustomersList search", () => {
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
      .mocked(listCustomers)
      .mock.calls.filter(([query]) => query.search !== "")
    expect(searches).toHaveLength(1)
  })
})

describe("CustomersList pagination", () => {
  it("reports the visible range and the total", async () => {
    await renderList()

    expect(screen.getByText("1–10")).toBeInTheDocument()
    expect(screen.getByText("248")).toBeInTheDocument()
    expect(
      screen.getByRole("navigation", { name: "customers pagination" })
    ).toBeInTheDocument()
  })

  it("asks the API for the next page and keeps the rows until it arrives", async () => {
    const user = await renderList()
    let resolveNext: (value: CustomerPage) => void = () => {}
    vi.mocked(listCustomers).mockReturnValueOnce(
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
    expect(screen.getByText("Daniel Reyes")).toBeInTheDocument()
    expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true")

    resolveNext(page([createCustomer({ id: "CUS-2000", name: "Next Person" })]))
    expect(await screen.findByText("Next Person")).toBeInTheDocument()
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

    // Page 4 comes back empty: there are now only enough customers for two pages.
    vi.mocked(listCustomers).mockResolvedValue(page([], 15))
    await user.click(screen.getByRole("button", { name: "Go to next page" }))

    await waitFor(() => expect(lastQuery()).toMatchObject({ page: 2 }))
  })
})

describe("CustomersList row actions", () => {
  it("links View to the customer's details page and offers nothing else", async () => {
    const user = await renderList()

    await user.click(
      screen.getByRole("button", { name: "Actions for Aiko Tanabe" })
    )

    expect(
      await screen.findByRole("menuitem", { name: "View" })
    ).toHaveAttribute("href", "/dashboard/customers/CUS-1004")
    expect(screen.getAllByRole("menuitem")).toHaveLength(1)
  })
})

describe("CustomersTotal", () => {
  it("shows the overall total, sharing the list's first request", async () => {
    renderWithQuery(
      <>
        <CustomersTotal />
        <CustomersList />
      </>
    )

    expect(
      await screen.findByText("248 customers in total.")
    ).toBeInTheDocument()
    expect(listCustomers).toHaveBeenCalledTimes(1)
  })

  it("keeps the overall total while the list is searched", async () => {
    renderWithQuery(
      <>
        <CustomersTotal />
        <CustomersList />
      </>
    )
    await screen.findByText("248 customers in total.")
    vi.mocked(listCustomers).mockResolvedValue(page([daniel], 1))

    await userEvent.type(getSearchBox(), "daniel")

    await waitFor(() => expect(lastQuery()).toMatchObject({ search: "daniel" }))
    expect(await screen.findByText("1–1")).toBeInTheDocument()
    expect(screen.getByText("248 customers in total.")).toBeInTheDocument()
  })

  it("shows nothing until the total is known", () => {
    vi.mocked(listCustomers).mockReturnValue(new Promise(() => {}))
    const { container } = renderWithQuery(<CustomersTotal />)

    expect(container).toBeEmptyDOMElement()
  })
})
