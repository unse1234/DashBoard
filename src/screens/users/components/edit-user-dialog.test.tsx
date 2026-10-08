import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"

import { ApiError } from "@/lib/api/api-error"
import type { User } from "@/lib/users/user.types"
import { EditUserDialog } from "@/screens/users/components/edit-user-dialog"
import { createUser } from "@/test-utils/user-fixtures"

const activeUser = createUser({ name: "Ada Lovelace", email: "ada@example.com" })
const inactiveUser = createUser({ status: "inactive" })

function renderDialog(
  user: User = activeUser,
  options: {
    onSubmit?: (values: unknown) => void | Promise<void>
    isCurrentUser?: boolean
  } = {}
) {
  const onOpenChange = vi.fn()
  render(
    <EditUserDialog
      user={user}
      open
      onOpenChange={onOpenChange}
      onSubmit={options.onSubmit}
      isCurrentUser={options.isCurrentUser}
    />
  )
  return { onOpenChange, user: userEvent.setup() }
}

function save(user: ReturnType<typeof userEvent.setup>) {
  return user.click(screen.getByRole("button", { name: "Save changes" }))
}

describe("EditUserDialog", () => {
  it("is an accessible dialog prefilled with the current user", async () => {
    renderDialog()

    expect(
      await screen.findByRole("dialog", { name: "Edit user" })
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Name")).toHaveValue("Ada Lovelace")
    expect(screen.getByRole("combobox", { name: "Role" })).toHaveTextContent(
      "Staff"
    )
  })

  it("shows the email as read-only and offers no password fields", async () => {
    renderDialog()
    await screen.findByRole("dialog")

    const email = screen.getByLabelText("Email")
    expect(email).toHaveValue("ada@example.com")
    expect(email).toHaveAttribute("readonly")
    expect(email).toHaveAccessibleDescription("Email addresses can't be changed.")
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument()
  })

  it("reflects the user's status in the switch", async () => {
    const { unmount } = render(
      <EditUserDialog user={activeUser} open onOpenChange={vi.fn()} />
    )
    expect(await screen.findByRole("switch", { name: "Status" })).toBeChecked()
    expect(screen.getByText("Active")).toBeInTheDocument()
    unmount()

    render(<EditUserDialog user={inactiveUser} open onOpenChange={vi.fn()} />)
    expect(
      await screen.findByRole("switch", { name: "Status" })
    ).not.toBeChecked()
    expect(screen.getByText("Inactive")).toBeInTheDocument()
  })

  it("submits the unchanged profile", async () => {
    const onSubmit = vi.fn()
    const { user, onOpenChange } = renderDialog(activeUser, { onSubmit })
    await screen.findByRole("dialog")

    await save(user)

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(onSubmit).toHaveBeenCalledWith({
      name: "Ada Lovelace",
      role: "STAFF",
      isActive: true,
    })
  })

  it("submits a new name, role and status", async () => {
    const onSubmit = vi.fn()
    const { user } = renderDialog(activeUser, { onSubmit })
    await screen.findByRole("dialog")

    await user.clear(screen.getByLabelText("Name"))
    await user.type(screen.getByLabelText("Name"), "  Ada King ")
    await user.click(screen.getByRole("combobox", { name: "Role" }))
    await user.click(await screen.findByRole("option", { name: "Admin" }))
    await user.click(screen.getByRole("switch", { name: "Status" }))
    await save(user)

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce())
    expect(onSubmit).toHaveBeenCalledWith({
      name: "Ada King",
      role: "ADMIN",
      isActive: false,
    })
  })

  it("keeps the dialog open and shows errors for an invalid name", async () => {
    const onSubmit = vi.fn()
    const { user, onOpenChange } = renderDialog(activeUser, { onSubmit })
    await screen.findByRole("dialog")

    await user.clear(screen.getByLabelText("Name"))
    await save(user)

    expect(screen.getByLabelText("Name")).toHaveAccessibleDescription(
      "Enter a name."
    )
    expect(screen.getByLabelText("Name")).toHaveFocus()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it("explains why role and status are locked on your own account", async () => {
    renderDialog(activeUser, { isCurrentUser: true })
    await screen.findByRole("dialog")

    expect(screen.getByRole("combobox", { name: "Role" })).toBeDisabled()
    // Base UI exposes a disabled switch through aria-disabled, not `disabled`.
    expect(screen.getByRole("switch", { name: "Status" })).toHaveAttribute(
      "aria-disabled",
      "true"
    )
    expect(
      screen.getByText("You can't change your own role or status.")
    ).toBeVisible()
    expect(screen.getByLabelText("Name")).toBeEnabled()
  })

  it("shows the error and stays open when saving fails", async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(new ApiError(409, ["At least one active admin is required"]))
    const { user, onOpenChange } = renderDialog(activeUser, { onSubmit })
    await screen.findByRole("dialog")

    await save(user)

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "At least one active admin is required"
    )
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled()
  })
})
