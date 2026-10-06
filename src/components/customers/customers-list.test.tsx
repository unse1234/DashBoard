import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"

import { CustomersList } from "@/components/customers/customers-list"
import { mockCustomers } from "@/lib/customers/customer.mock-data"

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }))

function renderList(customers = mockCustomers) {
  return render(<CustomersList customers={customers} />)
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

function getSummary() {
  return screen.getByText(/^Showing/)
}

async function chooseStatus(user: ReturnType<typeof userEvent.setup>, label: string) {
  await user.click(screen.getByRole("combobox", { name: "Filter by status" }))
  await user.click(await screen.findByRole("option", { name: label }))
}

afterEach(() => {
  vi.clearAllMocks()
})

describe("CustomersList table", () => {
  it("shows the columns in order, with one row per customer on the first page", () => {
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
      "Status",
      "Joined",
      "Actions",
    ])
    expect(screen.getAllByRole("row")).toHaveLength(10 + 1)
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

  it("shows a customer's status and marks a missing phone number", () => {
    renderList()

    expect(within(getRow("Daniel Reyes")).getByText("Active")).toBeInTheDocument()
    expect(within(getRow("Lucas Ferreira")).getByText("Inactive")).toBeInTheDocument()
    expect(
      within(getRow("Lucas Ferreira")).getByText("Not provided")
    ).toBeInTheDocument()
  })

  it("right-aligns the numeric columns and leaves Phone and Actions unsortable", () => {
    renderList()

    expect(getHeader("Orders")).toHaveClass("text-right")
    expect(getHeader("Total Spent")).toHaveClass("text-right")
    expect(getHeader("Phone")).not.toHaveAttribute("aria-sort")
    expect(getHeader("Actions")).not.toHaveAttribute("aria-sort")
    expect(getHeader("Name")).toHaveAttribute("aria-sort", "none")
  })
})

describe("CustomersList sorting", () => {
  it("cycles one column through ascending, descending and unsorted", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(within(getHeader("Name")).getByRole("button"))
    expect(getHeader("Name")).toHaveAttribute("aria-sort", "ascending")
    expect(getListedNames()[0]).toBe("Aiko Tanabe")

    await user.click(within(getHeader("Name")).getByRole("button"))
    expect(getHeader("Name")).toHaveAttribute("aria-sort", "descending")
    expect(getListedNames()[0]).toBe("Yuki Nakamura")

    await user.click(within(getHeader("Name")).getByRole("button"))
    expect(getHeader("Name")).toHaveAttribute("aria-sort", "none")
    expect(getListedNames()[0]).toBe("Margaret Okafor-Williams")
  })

  it("only ever marks one column as sorted", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(within(getHeader("Name")).getByRole("button"))
    await user.click(within(getHeader("Email")).getByRole("button"))

    expect(getHeader("Name")).toHaveAttribute("aria-sort", "none")
    expect(getHeader("Email")).toHaveAttribute("aria-sort", "ascending")
  })

  it("sorts the amounts by value", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(within(getHeader("Total Spent")).getByRole("button"))
    await user.click(within(getHeader("Total Spent")).getByRole("button"))

    expect(getListedNames().slice(0, 3)).toEqual([
      "Margaret Okafor-Williams",
      "Daniel Reyes",
      "Omar Haddad",
    ])
  })

  it("sorts across every page, not just the visible one", async () => {
    renderList()
    const user = userEvent.setup()

    // Yuki Nakamura is on the second page until the names are sorted.
    expect(getListedNames()).not.toContain("Yuki Nakamura")
    await user.click(within(getHeader("Name")).getByRole("button"))
    await user.click(within(getHeader("Name")).getByRole("button"))

    expect(getListedNames().slice(0, 2)).toEqual(["Yuki Nakamura", "Wei Chen"])
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
  it("narrows the list as the search is typed", async () => {
    renderList()
    const user = userEvent.setup()

    await user.type(getSearchBox(), "reyes")

    expect(getSearchBox()).toHaveValue("reyes")
    expect(getListedNames()).toEqual(["Daniel Reyes"])
    expect(getSummary()).toHaveTextContent("Showing 1–1 of 1 customers")
  })

  it("finds customers by ID, email and phone", async () => {
    renderList()
    const user = userEvent.setup()

    await user.type(getSearchBox(), "cus-1063")
    expect(getListedNames()).toEqual(["Chloe Bennett"])

    await user.clear(getSearchBox())
    await user.type(getSearchBox(), "sakuramail")
    expect(getListedNames()).toEqual(["Aiko Tanabe"])

    await user.clear(getSearchBox())
    await user.type(getSearchBox(), "415-555")
    expect(getListedNames()).toEqual(["Daniel Reyes"])
  })

  it("shows the empty state when nothing matches", async () => {
    renderList()
    const user = userEvent.setup()

    await user.type(getSearchBox(), "no such customer")

    expect(screen.getByText("No customers found")).toBeInTheDocument()
    expect(
      screen.getByText("Try adjusting your search or filters.")
    ).toBeInTheDocument()
    expect(getSummary()).toHaveTextContent("Showing 0–0 of 0 customers")
  })

  it("starts again from the first page", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: "Go to page 2" }))
    await user.type(getSearchBox(), "a")

    expect(getSummary()).toHaveTextContent("Showing 1–10")
  })
})

describe("CustomersList status filter", () => {
  it("defaults to every status", () => {
    renderList()

    expect(
      screen.getByRole("combobox", { name: "Filter by status" })
    ).toHaveTextContent("All")
  })

  it("lists only the customers with the chosen status", async () => {
    renderList()
    const user = userEvent.setup()

    await chooseStatus(user, "Inactive")

    expect(getListedNames()).toEqual([
      "Lucas Ferreira",
      "Amara Nwosu",
      "Ethan Brooks",
      "Kwame Mensah",
      "Noah Fischer",
    ])
    expect(getSummary()).toHaveTextContent("Showing 1–5 of 5 customers")

    await chooseStatus(user, "Active")

    expect(getSummary()).toHaveTextContent("of 17 customers")
    expect(within(screen.getByRole("table")).queryByText("Inactive")).toBeNull()
  })

  it("works together with the search", async () => {
    renderList()
    const user = userEvent.setup()

    await chooseStatus(user, "Inactive")
    await user.type(getSearchBox(), "brooks")

    expect(getListedNames()).toEqual(["Ethan Brooks"])
  })
})

describe("CustomersList pagination", () => {
  it("reports the visible range and total", () => {
    renderList()

    expect(getSummary()).toHaveTextContent(
      `Showing 1–10 of ${mockCustomers.length} customers`
    )
    expect(
      screen.getByRole("navigation", { name: "customers pagination" })
    ).toBeInTheDocument()
  })

  it("moves between pages and shows the short last page", async () => {
    renderList()
    const user = userEvent.setup()
    const previous = screen.getByRole("button", { name: "Go to previous page" })

    expect(previous).toBeDisabled()

    await user.click(screen.getByRole("button", { name: "Go to next page" }))
    expect(screen.getByText("11–20")).toBeInTheDocument()
    expect(previous).toBeEnabled()

    await user.click(screen.getByRole("button", { name: "Go to page 3" }))
    expect(getSummary()).toHaveTextContent(
      `Showing 21–${mockCustomers.length} of ${mockCustomers.length} customers`
    )
    expect(getListedNames()).toEqual(["Chloe Bennett", "Liam O'Sullivan"])
    expect(screen.getByRole("button", { name: "Go to next page" })).toBeDisabled()
  })

  it("shows more rows when the page size grows", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(screen.getByRole("combobox", { name: "Rows per page" }))
    await user.click(await screen.findByRole("option", { name: "20" }))

    expect(screen.getAllByRole("row")).toHaveLength(20 + 1)
    expect(getSummary()).toHaveTextContent("Showing 1–20")
  })
})

describe("CustomersList row actions", () => {
  it("links View to the customer's details page", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(
      screen.getByRole("button", { name: "Actions for Aiko Tanabe" })
    )

    expect(await screen.findByRole("menuitem", { name: "View" })).toHaveAttribute(
      "href",
      "/dashboard/customers/CUS-1004"
    )
  })

  it("offers Disable for an active customer", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(
      screen.getByRole("button", { name: "Actions for Daniel Reyes" })
    )

    expect(
      await screen.findByRole("menuitem", { name: "Disable" })
    ).toBeInTheDocument()
    expect(screen.queryByRole("menuitem", { name: "Enable" })).toBeNull()
  })

  it("offers Enable for an inactive customer", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(
      screen.getByRole("button", { name: "Actions for Lucas Ferreira" })
    )

    expect(
      await screen.findByRole("menuitem", { name: "Enable" })
    ).toBeInTheDocument()
    expect(screen.queryByRole("menuitem", { name: "Disable" })).toBeNull()
  })

  it("disables a customer, shows it and says so", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(
      screen.getByRole("button", { name: "Actions for Daniel Reyes" })
    )
    await user.click(await screen.findByRole("menuitem", { name: "Disable" }))

    expect(within(getRow("Daniel Reyes")).getByText("Inactive")).toBeInTheDocument()
    expect(toast.success).toHaveBeenCalledWith("Daniel Reyes is now inactive.")

    await user.click(
      screen.getByRole("button", { name: "Actions for Daniel Reyes" })
    )
    expect(
      await screen.findByRole("menuitem", { name: "Enable" })
    ).toBeInTheDocument()
  })

  it("enables a customer again", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(
      screen.getByRole("button", { name: "Actions for Lucas Ferreira" })
    )
    await user.click(await screen.findByRole("menuitem", { name: "Enable" }))

    expect(within(getRow("Lucas Ferreira")).getByText("Active")).toBeInTheDocument()
    expect(toast.success).toHaveBeenCalledWith("Lucas Ferreira is now active.")
  })

  // Opens a select and then a menu, which is slow in jsdom when the whole suite
  // runs in parallel, so it gets more than the default five seconds.
  it("drops a disabled customer from a list filtered to active ones", async () => {
    renderList()
    const user = userEvent.setup()

    await chooseStatus(user, "Active")
    expect(getSummary()).toHaveTextContent("of 17 customers")

    await user.click(
      screen.getByRole("button", { name: "Actions for Daniel Reyes" })
    )
    await user.click(await screen.findByRole("menuitem", { name: "Disable" }))

    expect(screen.queryByRole("row", { name: /Daniel Reyes/ })).toBeNull()
    expect(getSummary()).toHaveTextContent("of 16 customers")
  }, 20_000)
})

describe("CustomersList without customers", () => {
  it("shows the empty state", () => {
    renderList([])

    expect(screen.getByText("No customers found")).toBeInTheDocument()
    expect(getSummary()).toHaveTextContent("Showing 0–0 of 0 customers")
  })
})
