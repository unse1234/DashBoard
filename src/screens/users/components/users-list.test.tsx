import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import { vi } from "vitest"

import { useAuth } from "@/hooks/use-auth"
import { ApiError } from "@/lib/api/api-error"
import {
  deleteUser,
  inviteUser,
  listUsers,
  setUserActive,
  updateUser,
} from "@/lib/users/user.api"
import type { UserPage } from "@/lib/users/user.api"
import { UsersList } from "@/screens/users/components/users-list"
import { createAuthUser } from "@/test-utils/auth-fixtures"
import { renderWithQuery } from "@/test-utils/render"
import { createUser } from "@/test-utils/user-fixtures"

vi.mock("@/lib/users/user.api")
vi.mock("@/hooks/use-auth")
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}))

const priya = createUser({ uid: "u-priya", name: "Priya Raman" })
const mei = createUser({
  uid: "u-mei",
  name: "Mei Lin Tan",
  email: "meilin@orchardworks.sg",
  status: "inactive",
  lastLoginAt: null,
})
const ada = createUser({
  uid: "u-ada",
  name: "Ada Admin",
  role: "ADMIN",
  lastLoginAt: null,
})

function page(users = [priya, mei, ada], totalRecords = 248): UserPage {
  return { users, totalRecords }
}

async function renderList() {
  renderWithQuery(<UsersList />)
  await screen.findByText("Priya Raman")
  return userEvent.setup()
}

function lastQuery() {
  return vi.mocked(listUsers).mock.lastCall?.[0]
}

async function openActions(
  user: ReturnType<typeof userEvent.setup>,
  name: string
) {
  await user.click(screen.getByRole("button", { name: `Actions for ${name}` }))
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(listUsers).mockResolvedValue(page())
  // The signed-in admin is a different person from the listed users.
  vi.mocked(useAuth).mockReturnValue({
    status: "authenticated",
    user: createAuthUser({ id: "someone-else" }),
  })
})

describe("UsersList loading", () => {
  it("shows placeholder rows until the first page arrives", async () => {
    let resolve: (value: UserPage) => void = () => {}
    vi.mocked(listUsers).mockReturnValue(new Promise((res) => (resolve = res)))
    renderWithQuery(<UsersList />)

    expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true")
    expect(screen.queryByText("No users found")).not.toBeInTheDocument()

    resolve(page())
    expect(await screen.findByText("Priya Raman")).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "false")
    )
  })

  it("requests the first page of ten with no filters", async () => {
    await renderList()

    expect(listUsers).toHaveBeenCalledWith(
      { search: "", status: "all", page: 1, pageSize: 10 },
      expect.any(AbortSignal)
    )
  })

  it("explains a failed load and retries on request", async () => {
    vi.mocked(listUsers).mockRejectedValueOnce(
      new ApiError(500, ["internal detail"])
    )
    renderWithQuery(<UsersList />)

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent("Couldn't load users")
    expect(alert).not.toHaveTextContent("internal detail")

    await userEvent.click(screen.getByRole("button", { name: "Try again" }))

    expect(await screen.findByText("Priya Raman")).toBeInTheDocument()
    expect(listUsers).toHaveBeenCalledTimes(2)
  })
})

describe("UsersList table", () => {
  it("renders a row per user with role and a non-sortable header", async () => {
    await renderList()

    expect(screen.getAllByRole("row")).toHaveLength(4)
    expect(
      screen.getByRole("columnheader", { name: "Role" })
    ).not.toHaveAttribute("aria-sort")
    expect(screen.getByRole("cell", { name: "Admin" })).toBeInTheDocument()
    expect(screen.getAllByRole("cell", { name: "Staff" })).toHaveLength(2)
    // Two of the users have never logged in.
    expect(screen.getAllByText("Never")).toHaveLength(2)
  })

  it("shows the empty state when nothing matches", async () => {
    vi.mocked(listUsers).mockResolvedValue(page([], 0))
    renderWithQuery(<UsersList />)

    expect(await screen.findByText("No users found")).toBeInTheDocument()
  })
})

describe("UsersList pagination, search and filters", () => {
  it("reports the visible range and total", async () => {
    await renderList()

    expect(screen.getByText("1–10")).toBeInTheDocument()
    expect(screen.getByText("248")).toBeInTheDocument()
  })

  it("asks the API for the next page and keeps the rows until it arrives", async () => {
    const user = await renderList()
    let resolveNext: (value: UserPage) => void = () => {}
    vi.mocked(listUsers).mockReturnValueOnce(
      new Promise((res) => (resolveNext = res))
    )

    await user.click(screen.getByRole("button", { name: "Go to next page" }))

    await waitFor(() => expect(lastQuery()).toMatchObject({ page: 2 }))
    expect(screen.getByText("11–20")).toBeInTheDocument()
    // The previous page stays on screen (dimmed) instead of blanking the table.
    expect(screen.getByText("Priya Raman")).toBeInTheDocument()
    expect(screen.queryByText("No users found")).not.toBeInTheDocument()

    resolveNext(page([createUser({ uid: "u-next", name: "Next Person" })]))
    expect(await screen.findByText("Next Person")).toBeInTheDocument()
  })

  it("searches after typing pauses and returns to page one", async () => {
    const user = await renderList()
    await user.click(screen.getByRole("button", { name: "Go to page 3" }))
    await waitFor(() => expect(lastQuery()).toMatchObject({ page: 3 }))

    await user.type(
      screen.getByRole("searchbox", { name: "Search users" }),
      "priya"
    )

    await waitFor(() =>
      expect(lastQuery()).toMatchObject({ search: "priya", page: 1 })
    )
    // Not one request per keystroke.
    const searches = vi
      .mocked(listUsers)
      .mock.calls.filter(([query]) => query.search !== "")
    expect(searches).toHaveLength(1)
  })

  it("filters by status", async () => {
    const user = await renderList()

    await user.click(screen.getByRole("combobox", { name: "Filter by status" }))
    await user.click(await screen.findByRole("option", { name: "Inactive" }))

    await waitFor(() =>
      expect(lastQuery()).toMatchObject({ status: "inactive", page: 1 })
    )
  })
})

describe("UsersList row actions", () => {
  it("offers Disable for an active user and links View to the details page", async () => {
    const user = await renderList()

    await openActions(user, "Priya Raman")

    expect(
      await screen.findByRole("menuitem", { name: "Disable" })
    ).toBeInTheDocument()
    expect(screen.queryByRole("menuitem", { name: "Enable" })).toBeNull()
    expect(screen.getByRole("menuitem", { name: "View" })).toHaveAttribute(
      "href",
      "/dashboard/users/u-priya"
    )
  })

  it("asks before disabling, then disables through the status endpoint and reloads", async () => {
    vi.mocked(setUserActive).mockResolvedValue({ ...priya, status: "inactive" })
    const user = await renderList()

    await openActions(user, "Priya Raman")
    await user.click(await screen.findByRole("menuitem", { name: "Disable" }))

    const dialog = await screen.findByRole("dialog", {
      name: "Disable Priya Raman?",
    })
    expect(setUserActive).not.toHaveBeenCalled()
    await user.click(within(dialog).getByRole("button", { name: "Disable" }))

    await waitFor(() =>
      expect(setUserActive).toHaveBeenCalledWith("u-priya", false)
    )
    expect(toast.success).toHaveBeenCalledWith("Priya Raman was disabled.")
    await waitFor(() => expect(listUsers).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  })

  it("does nothing when the disable confirmation is cancelled", async () => {
    const user = await renderList()

    await openActions(user, "Priya Raman")
    await user.click(await screen.findByRole("menuitem", { name: "Disable" }))
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(setUserActive).not.toHaveBeenCalled()
    expect(listUsers).toHaveBeenCalledTimes(1)
  })

  it("keeps the confirmation open and explains why when the API refuses to disable", async () => {
    vi.mocked(setUserActive).mockRejectedValue(
      new ApiError(409, ["At least one active admin is required"])
    )
    const user = await renderList()

    await openActions(user, "Ada Admin")
    await user.click(await screen.findByRole("menuitem", { name: "Disable" }))
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Disable" }))

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "At least one active admin is required"
    )
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(toast.success).not.toHaveBeenCalled()
    expect(listUsers).toHaveBeenCalledTimes(1)
  })

  it("enables a user straight away, without a confirmation", async () => {
    vi.mocked(setUserActive).mockResolvedValue({ ...mei, status: "active" })
    const user = await renderList()

    await openActions(user, "Mei Lin Tan")
    await user.click(await screen.findByRole("menuitem", { name: "Enable" }))

    await waitFor(() =>
      expect(setUserActive).toHaveBeenCalledWith("u-mei", true)
    )
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(toast.success).toHaveBeenCalledWith("Mei Lin Tan was enabled.")
    await waitFor(() => expect(listUsers).toHaveBeenCalledTimes(2))
  })

  it("reports a failed enable without reloading", async () => {
    vi.mocked(setUserActive).mockRejectedValue(
      new ApiError(403, ["Insufficient permissions"])
    )
    const user = await renderList()

    await openActions(user, "Mei Lin Tan")
    await user.click(await screen.findByRole("menuitem", { name: "Enable" }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Insufficient permissions")
    )
    expect(listUsers).toHaveBeenCalledTimes(1)
  })

  it("does not let you disable or delete your own account", async () => {
    vi.mocked(useAuth).mockReturnValue({
      status: "authenticated",
      user: createAuthUser({ id: "u-priya" }),
    })
    const user = await renderList()

    await openActions(user, "Priya Raman")

    expect(
      await screen.findByRole("menuitem", { name: "Disable" })
    ).toHaveAttribute("aria-disabled", "true")
    expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveAttribute(
      "aria-disabled",
      "true"
    )
  })

  it("saves only the fields that changed and reloads", async () => {
    vi.mocked(updateUser).mockResolvedValue({ ...mei, role: "ADMIN" })
    const user = await renderList()

    await openActions(user, "Mei Lin Tan")
    await user.click(await screen.findByRole("menuitem", { name: "Edit" }))
    const dialog = await screen.findByRole("dialog", { name: "Edit user" })
    expect(within(dialog).getByLabelText("Name")).toHaveValue("Mei Lin Tan")
    expect(
      within(dialog).getByRole("switch", { name: "Status" })
    ).not.toBeChecked()

    await user.click(within(dialog).getByRole("combobox", { name: "Role" }))
    await user.click(await screen.findByRole("option", { name: "Admin" }))
    await user.click(
      within(dialog).getByRole("button", { name: "Save changes" })
    )

    await waitFor(() =>
      expect(updateUser).toHaveBeenCalledWith("u-mei", { role: "ADMIN" })
    )
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(toast.success).toHaveBeenCalledWith(
      "Changes to Mei Lin Tan were saved."
    )
    await waitFor(() => expect(listUsers).toHaveBeenCalledTimes(2))
  })

  it("does not call the API when the edit changed nothing", async () => {
    const user = await renderList()

    await openActions(user, "Mei Lin Tan")
    await user.click(await screen.findByRole("menuitem", { name: "Edit" }))
    const dialog = await screen.findByRole("dialog", { name: "Edit user" })
    await user.click(
      within(dialog).getByRole("button", { name: "Save changes" })
    )

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(updateUser).not.toHaveBeenCalled()
    expect(toast.success).not.toHaveBeenCalled()
  })

  it("shows the API's reason in the edit dialog and keeps it open", async () => {
    vi.mocked(updateUser).mockRejectedValue(
      new ApiError(400, ["name must be shorter than 100 characters"])
    )
    const user = await renderList()

    await openActions(user, "Mei Lin Tan")
    await user.click(await screen.findByRole("menuitem", { name: "Edit" }))
    const dialog = await screen.findByRole("dialog", { name: "Edit user" })
    await user.type(within(dialog).getByLabelText("Name"), " Jr")
    await user.click(
      within(dialog).getByRole("button", { name: "Save changes" })
    )

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "name must be shorter than 100 characters"
    )
    expect(listUsers).toHaveBeenCalledTimes(1)
  })
})

describe("UsersList deleting users", () => {
  async function startDelete(
    user: ReturnType<typeof userEvent.setup>,
    name = "Priya Raman"
  ) {
    await openActions(user, name)
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }))
    return screen.findByRole("dialog", { name: `Delete ${name}?` })
  }

  it("asks first, then deletes, confirms and reloads", async () => {
    vi.mocked(deleteUser).mockResolvedValue(undefined)
    const user = await renderList()

    const dialog = await startDelete(user)
    expect(deleteUser).not.toHaveBeenCalled()
    await user.click(
      within(dialog).getByRole("button", { name: "Delete user" })
    )

    await waitFor(() => expect(deleteUser).toHaveBeenCalledWith("u-priya"))
    expect(toast.success).toHaveBeenCalledWith("Priya Raman was deleted.")
    await waitFor(() => expect(listUsers).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  })

  it("does nothing when cancelled", async () => {
    const user = await renderList()

    const dialog = await startDelete(user)
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(deleteUser).not.toHaveBeenCalled()
  })

  it("explains why the API refused and leaves the user in the list", async () => {
    vi.mocked(deleteUser).mockRejectedValue(
      new ApiError(409, ["At least one active admin is required"])
    )
    const user = await renderList()

    const dialog = await startDelete(user, "Ada Admin")
    await user.click(
      within(dialog).getByRole("button", { name: "Delete user" })
    )

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "At least one active admin is required"
    )
    expect(screen.getByText("Ada Admin")).toBeInTheDocument()
    expect(listUsers).toHaveBeenCalledTimes(1)
    // The dialog is usable again for another attempt.
    expect(
      within(dialog).getByRole("button", { name: "Delete user" })
    ).toBeEnabled()
  })

  it("steps back a page when the last user on the last page is deleted", async () => {
    let total = 11
    vi.mocked(listUsers).mockImplementation(async (query) => ({
      users: query.page === 2 ? [priya] : [mei, ada],
      totalRecords: total,
    }))
    vi.mocked(deleteUser).mockResolvedValue(undefined)
    renderWithQuery(<UsersList />)
    const user = userEvent.setup()
    await screen.findByText("Mei Lin Tan")
    await user.click(screen.getByRole("button", { name: "Go to next page" }))
    await screen.findByText("Priya Raman")

    total = 10 // Priya was the only user on page two.
    const dialog = await startDelete(user)
    await user.click(
      within(dialog).getByRole("button", { name: "Delete user" })
    )

    await waitFor(() => expect(lastQuery()).toMatchObject({ page: 1 }))
    expect(await screen.findByText("Mei Lin Tan")).toBeInTheDocument()
  })
})

describe("UsersList creating users", () => {
  async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole("button", { name: "Create User" }))
    await user.type(await screen.findByLabelText("Name"), "Sam Staff")
    await user.type(screen.getByLabelText("Email"), "sam@example.com")
    await user.click(screen.getByRole("button", { name: "Create user" }))
  }

  it("invites the user, confirms, and reloads the list", async () => {
    vi.mocked(inviteUser).mockResolvedValue({
      user: createUser({ email: "sam@example.com" }),
      invitationSent: true,
    })
    const user = await renderList()

    await fillAndSubmit(user)

    await waitFor(() =>
      expect(inviteUser).toHaveBeenCalledWith({
        name: "Sam Staff",
        email: "sam@example.com",
        role: "STAFF",
      })
    )
    expect(toast.success).toHaveBeenCalledWith(
      "Invitation sent to sam@example.com."
    )
    await waitFor(() => expect(listUsers).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  })

  it("warns when the account exists but the email could not be sent", async () => {
    vi.mocked(inviteUser).mockResolvedValue({
      user: createUser({ email: "sam@example.com" }),
      invitationSent: false,
    })
    const user = await renderList()

    await fillAndSubmit(user)

    await waitFor(() =>
      expect(toast.warning).toHaveBeenCalledWith(
        expect.stringContaining("could not be sent")
      )
    )
    expect(toast.success).not.toHaveBeenCalled()
    // The account was still created, so the list refreshes.
    await waitFor(() => expect(listUsers).toHaveBeenCalledTimes(2))
  })

  it("keeps the dialog open on a duplicate email and does not reload", async () => {
    vi.mocked(inviteUser).mockRejectedValue(
      new ApiError(409, ["A user with this email already exists"])
    )
    const user = await renderList()

    await fillAndSubmit(user)

    await waitFor(() =>
      expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
        "A user with this email already exists"
      )
    )
    expect(listUsers).toHaveBeenCalledTimes(1)
  })
})
