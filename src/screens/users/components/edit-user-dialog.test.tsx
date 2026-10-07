import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"

import type { User } from "@/lib/users/user.types"
import { EditUserDialog } from "@/screens/users/components/edit-user-dialog"

const activeUser: User = {
  uid: "USR-1",
  name: "Ada Lovelace",
  email: "ada@example.com",
  status: "active",
  createdAt: "2025-01-01T00:00:00Z",
  lastLoginAt: null,
}

const inactiveUser: User = { ...activeUser, uid: "USR-2", status: "inactive" }

function renderDialog(
  user: User = activeUser,
  onSubmit?: (values: unknown) => void | Promise<void>
) {
  const onOpenChange = vi.fn()
  render(
    <EditUserDialog
      user={user}
      open
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
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
    expect(screen.getByLabelText("Email")).toHaveValue("ada@example.com")
    expect(screen.getByLabelText("New password")).toHaveValue("")
    expect(screen.getByLabelText("Confirm password")).toHaveValue("")
  })

  it("reflects the user's status in the switch", async () => {
    const { unmount } = render(
      <EditUserDialog user={activeUser} open onOpenChange={vi.fn()} />
    )
    expect(await screen.findByRole("switch", { name: "Status" })).toBeChecked()
    expect(screen.getByText("Active")).toBeInTheDocument()
    unmount()

    render(<EditUserDialog user={inactiveUser} open onOpenChange={vi.fn()} />)
    expect(await screen.findByRole("switch", { name: "Status" })).not.toBeChecked()
    expect(screen.getByText("Inactive")).toBeInTheDocument()
  })

  it("submits the profile with the password left empty", async () => {
    const onSubmit = vi.fn()
    const { user, onOpenChange } = renderDialog(activeUser, onSubmit)
    await screen.findByRole("dialog")

    await save(user)

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(onSubmit).toHaveBeenCalledWith({
      name: "Ada Lovelace",
      email: "ada@example.com",
      isActive: true,
      newPassword: "",
      confirmPassword: "",
    })
  })

  it("submits the changed status and a matching new password", async () => {
    const onSubmit = vi.fn()
    const { user } = renderDialog(activeUser, onSubmit)
    await screen.findByRole("dialog")

    await user.click(screen.getByRole("switch", { name: "Status" }))
    await user.type(screen.getByLabelText("New password"), "long-enough-1")
    await user.type(screen.getByLabelText("Confirm password"), "long-enough-1")
    await save(user)

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce())
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        isActive: false,
        newPassword: "long-enough-1",
        confirmPassword: "long-enough-1",
      })
    )
  })

  it("asks for confirmation when only the new password is filled", async () => {
    const onSubmit = vi.fn()
    const { user } = renderDialog(activeUser, onSubmit)
    await screen.findByRole("dialog")

    await user.type(screen.getByLabelText("New password"), "long-enough-1")
    await save(user)

    expect(screen.getByLabelText("Confirm password")).toHaveAccessibleDescription(
      "Confirm the new password."
    )
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("asks for the new password when only the confirmation is filled", async () => {
    const { user } = renderDialog()
    await screen.findByRole("dialog")

    await user.type(screen.getByLabelText("Confirm password"), "long-enough-1")
    await save(user)

    expect(screen.getByLabelText("New password")).toHaveAccessibleDescription(
      "Enter a new password."
    )
  })

  it("flags passwords that do not match", async () => {
    const { user } = renderDialog()
    await screen.findByRole("dialog")

    await user.type(screen.getByLabelText("New password"), "long-enough-1")
    await user.type(screen.getByLabelText("Confirm password"), "long-enough-2")
    await save(user)

    expect(screen.getByLabelText("Confirm password")).toHaveAccessibleDescription(
      "Passwords do not match."
    )
  })

  it("lets each password field be shown and hidden", async () => {
    const { user } = renderDialog()
    await screen.findByRole("dialog")
    const [showNew] = screen.getAllByRole("button", { name: "Show password" })

    expect(screen.getByLabelText("New password")).toHaveAttribute("type", "password")
    await user.click(showNew)

    expect(screen.getByLabelText("New password")).toHaveAttribute("type", "text")
    expect(screen.getByLabelText("Confirm password")).toHaveAttribute(
      "type",
      "password"
    )
  })

  it("keeps the dialog open and shows errors for an invalid profile", async () => {
    const { user, onOpenChange } = renderDialog()
    await screen.findByRole("dialog")

    await user.clear(screen.getByLabelText("Name"))
    await save(user)

    expect(screen.getByLabelText("Name")).toHaveAccessibleDescription("Enter a name.")
    expect(screen.getByLabelText("Name")).toHaveFocus()
    expect(onOpenChange).not.toHaveBeenCalled()
  })
})
