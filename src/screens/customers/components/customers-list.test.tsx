import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import {
  mockCustomers,
  mockTotalCustomers,
} from "@/lib/customers/customer.mock-data"
import { CustomersList } from "@/screens/customers/components/customers-list"

function renderList(customers = mockCustomers) {
  return render(
    <CustomersList customers={customers} totalRecords={mockTotalCustomers} />
  )
}

function getHeader(name: string) {
  return screen.getByRole("columnheader", { name })
}

function getRow(name: string) {
  return screen.getByRole("row", { name: new RegExp(name) })
}

/** The names in the table body, top to bottom. */
function getListedNames() {
  return screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[1]?.textContent)
}

function getSearchBox() {
  return screen.getByRole("searchbox", {
    name: "Search customers by ID, name, email or phone",
  })
}

describe("CustomersList table", () => {
  it("shows the columns in order, with one row per customer it is given", () => {
    renderList()

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
    expect(screen.getAllByRole("row")).toHaveLength(mockCustomers.length + 1)
  })

  it("has no status column or status filter", () => {
    renderList()

    expect(screen.queryByRole("columnheader", { name: "Status" })).toBeNull()
    expect(screen.queryByRole("combobox", { name: /status/i })).toBeNull()
    expect(screen.queryByText("Active")).toBeNull()
    expect(screen.queryByText("Inactive")).toBeNull()
  })

  it("links each name to the customer's details page", () => {
    renderList()

    expect(screen.getByRole("link", { name: "Daniel Reyes" })).toHaveAttribute(
      "href",
      "/dashboard/customers/CUS-1002"
    )
  })

  it("formats the order count, total spent and join date", () => {
    renderList()
    const row = within(getRow("Daniel Reyes"))

    expect(row.getByText("CUS-1002")).toBeInTheDocument()
    expect(row.getByText("23")).toBeInTheDocument()
    expect(row.getByText("$6,212.40")).toBeInTheDocument()
    expect(row.getByText("May 19, 2022")).toBeInTheDocument()
  })

  it("marks a missing phone number", () => {
    renderList()

    expect(
      within(getRow("Lucas Ferreira")).getByText("Not provided")
    ).toBeInTheDocument()
  })

  it("shows the empty state when there are no customers", () => {
    renderList([])

    expect(screen.getByText("No customers found")).toBeInTheDocument()
  })

  it("right-aligns the numeric columns and leaves Phone and Actions unsortable", () => {
    renderList()

    expect(getHeader("Orders")).toHaveClass("text-right")
    expect(getHeader("Total Spent")).toHaveClass("text-right")
    expect(getHeader("Phone")).not.toHaveAttribute("aria-sort")
    expect(getHeader("Actions")).not.toHaveAttribute("aria-sort")
  })
})

describe("CustomersList sorting", () => {
  it("cycles one column through ascending, descending and unsorted", async () => {
    renderList()
    const user = userEvent.setup()

    expect(getHeader("Name")).toHaveAttribute("aria-sort", "none")

    await user.click(within(getHeader("Name")).getByRole("button"))
    expect(getHeader("Name")).toHaveAttribute("aria-sort", "ascending")

    await user.click(within(getHeader("Name")).getByRole("button"))
    expect(getHeader("Name")).toHaveAttribute("aria-sort", "descending")

    await user.click(within(getHeader("Name")).getByRole("button"))
    expect(getHeader("Name")).toHaveAttribute("aria-sort", "none")
  })

  it("only ever marks one column as sorted", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(within(getHeader("Name")).getByRole("button"))
    await user.click(within(getHeader("Email")).getByRole("button"))

    expect(getHeader("Name")).toHaveAttribute("aria-sort", "none")
    expect(getHeader("Email")).toHaveAttribute("aria-sort", "ascending")
  })

  it("does not reorder the rows it was given", async () => {
    renderList()
    const user = userEvent.setup()
    const before = getListedNames()

    await user.click(within(getHeader("Name")).getByRole("button"))
    await user.click(within(getHeader("Total Spent")).getByRole("button"))

    expect(getListedNames()).toEqual(before)
  })

  it("returns to the first page when the sort changes", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: "Go to page 3" }))
    await user.click(within(getHeader("Name")).getByRole("button"))

    expect(screen.getByText("1–10")).toBeInTheDocument()
  })
})

describe("CustomersList search", () => {
  it("keeps the typed search text without filtering the rows", async () => {
    renderList()
    const user = userEvent.setup()
    const before = getListedNames()

    await user.type(getSearchBox(), "no such customer")

    expect(getSearchBox()).toHaveValue("no such customer")
    expect(getListedNames()).toEqual(before)
  })
})

describe("CustomersList pagination", () => {
  it("reports the visible range and the total it is given", () => {
    renderList()

    expect(screen.getByText("1–10")).toBeInTheDocument()
    expect(screen.getByText(String(mockTotalCustomers))).toBeInTheDocument()
    expect(
      screen.getByRole("navigation", { name: "customers pagination" })
    ).toBeInTheDocument()
  })

  it("moves between pages without changing the rows", async () => {
    renderList()
    const user = userEvent.setup()
    const before = getListedNames()
    const previous = screen.getByRole("button", { name: "Go to previous page" })

    expect(previous).toBeDisabled()

    await user.click(screen.getByRole("button", { name: "Go to next page" }))

    expect(screen.getByText("11–20")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Go to page 2" })).toHaveAttribute(
      "aria-current",
      "page"
    )
    expect(previous).toBeEnabled()
    expect(getListedNames()).toEqual(before)
  })

  it("lets the page size be changed", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(screen.getByRole("combobox", { name: "Rows per page" }))
    await user.click(await screen.findByRole("option", { name: "20" }))

    expect(screen.getByText("1–20")).toBeInTheDocument()
  })
})

describe("CustomersList row actions", () => {
  it("links View to the customer's details page and offers nothing else", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(
      screen.getByRole("button", { name: "Actions for Aiko Tanabe" })
    )

    expect(await screen.findByRole("menuitem", { name: "View" })).toHaveAttribute(
      "href",
      "/dashboard/customers/CUS-1004"
    )
    expect(screen.getAllByRole("menuitem")).toHaveLength(1)
  })
})
