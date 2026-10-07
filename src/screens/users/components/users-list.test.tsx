import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { mockTotalUsers, mockUsers } from "@/lib/users/user.mock-data"
import { UsersList } from "@/screens/users/components/users-list"

function renderList(users = mockUsers) {
  return render(<UsersList users={users} totalRecords={mockTotalUsers} />)
}

function getHeader(name: string) {
  return screen.getByRole("columnheader", { name })
}

describe("UsersList table", () => {
  it("renders a row per user and a non-sortable Actions column", () => {
    renderList()

    expect(screen.getAllByRole("row")).toHaveLength(mockUsers.length + 1)
    expect(getHeader("Actions")).not.toHaveAttribute("aria-sort")
    // Two mock users have never logged in.
    expect(screen.getAllByText("Never")).toHaveLength(2)
  })

  it("shows the empty state when there are no users", () => {
    renderList([])

    expect(screen.getByText("No users found")).toBeInTheDocument()
  })

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
})

describe("UsersList row actions", () => {
  it("offers Disable for an active user and links View to the details page", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(
      screen.getByRole("button", { name: "Actions for Priya Raman" })
    )

    expect(
      await screen.findByRole("menuitem", { name: "Disable" })
    ).toBeInTheDocument()
    expect(screen.queryByRole("menuitem", { name: "Enable" })).toBeNull()
    expect(screen.getByRole("menuitem", { name: "View" })).toHaveAttribute(
      "href",
      "/dashboard/users/USR-10482"
    )
  })

  it("opens the edit dialog for the chosen user", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(
      screen.getByRole("button", { name: "Actions for Mei Lin Tan" })
    )
    await user.click(await screen.findByRole("menuitem", { name: "Edit" }))

    expect(
      await screen.findByRole("dialog", { name: "Edit user" })
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Name")).toHaveValue("Mei Lin Tan")
    expect(screen.getByRole("switch", { name: "Status" })).not.toBeChecked()
  })

  it("offers Enable for an inactive user", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: "Actions for Mei Lin Tan" }))

    expect(
      await screen.findByRole("menuitem", { name: "Enable" })
    ).toBeInTheDocument()
    expect(screen.queryByRole("menuitem", { name: "Disable" })).toBeNull()
  })
})

describe("UsersList pagination", () => {
  it("reports the visible range and total", () => {
    renderList()

    expect(screen.getByText("1–10")).toBeInTheDocument()
    expect(screen.getByText("248")).toBeInTheDocument()
  })

  it("moves between pages and disables the unavailable direction", async () => {
    renderList()
    const user = userEvent.setup()
    const previous = screen.getByRole("button", { name: "Go to previous page" })

    expect(previous).toBeDisabled()
    expect(screen.getByRole("button", { name: "Go to page 1" })).toHaveAttribute(
      "aria-current",
      "page"
    )

    await user.click(screen.getByRole("button", { name: "Go to next page" }))

    expect(screen.getByText("11–20")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Go to page 2" })).toHaveAttribute(
      "aria-current",
      "page"
    )
    expect(previous).toBeEnabled()
  })

  it("jumps to a numbered page", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: "Go to page 3" }))

    expect(screen.getByText("21–30")).toBeInTheDocument()
  })

  it("returns to the first page when the sort changes", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: "Go to page 3" }))
    await user.click(within(getHeader("Name")).getByRole("button"))

    expect(screen.getByText("1–10")).toBeInTheDocument()
  })
})

describe("UsersList toolbar", () => {
  it("keeps the typed search text", async () => {
    renderList()
    const user = userEvent.setup()

    await user.type(screen.getByRole("searchbox", { name: "Search users" }), "priya")

    expect(screen.getByRole("searchbox", { name: "Search users" })).toHaveValue(
      "priya"
    )
  })

  it("lets the status filter be changed", async () => {
    renderList()
    const user = userEvent.setup()

    await user.click(screen.getByRole("combobox", { name: "Filter by status" }))
    await user.click(await screen.findByRole("option", { name: "Inactive" }))

    expect(screen.getByRole("combobox", { name: "Filter by status" })).toHaveTextContent(
      "Inactive"
    )
  })
})
