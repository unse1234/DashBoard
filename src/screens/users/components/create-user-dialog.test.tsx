import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"

import { ApiError } from "@/lib/api/api-error"
import { CreateUserDialog } from "@/screens/users/components/create-user-dialog"

async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Create User" }))
  return screen.findByRole("dialog", { name: "Create user" })
}

describe("CreateUserDialog", () => {
  it("opens an accessible dialog with name, email and role fields", async () => {
    render(<CreateUserDialog />)
    const user = userEvent.setup()

    const dialog = await openDialog(user)

    expect(dialog).toBeInTheDocument()
    expect(screen.getByLabelText("Name")).toBeInTheDocument()
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
    // Staff is the safe default; there is no password field (the invitee sets it).
    expect(screen.getByRole("combobox", { name: "Role" })).toHaveTextContent(
      "Staff"
    )
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument()
  })

  it("shows errors tied to their fields and focuses the first one", async () => {
    render(<CreateUserDialog />)
    const user = userEvent.setup()
    await openDialog(user)

    await user.click(screen.getByRole("button", { name: "Create user" }))

    const name = screen.getByLabelText("Name")
    const email = screen.getByLabelText("Email")
    expect(name).toHaveAttribute("aria-invalid", "true")
    expect(name).toHaveAccessibleDescription("Enter a name.")
    expect(email).toHaveAccessibleDescription("Enter an email address.")
    expect(name).toHaveFocus()
  })

  it("rejects a malformed email and a too-short name", async () => {
    render(<CreateUserDialog />)
    const user = userEvent.setup()
    await openDialog(user)

    await user.type(screen.getByLabelText("Name"), "A")
    await user.type(screen.getByLabelText("Email"), "nope")
    await user.click(screen.getByRole("button", { name: "Create user" }))

    expect(screen.getByLabelText("Name")).toHaveAccessibleDescription(
      "Name must be at least 2 characters."
    )
    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
      "Enter a valid email address."
    )
  })

  it("submits trimmed values with the default role and closes", async () => {
    const onSubmit = vi.fn()
    render(<CreateUserDialog onSubmit={onSubmit} />)
    const user = userEvent.setup()
    await openDialog(user)

    await user.type(screen.getByLabelText("Name"), "  Ada Lovelace ")
    await user.type(screen.getByLabelText("Email"), "ada@example.com")
    await user.click(screen.getByRole("button", { name: "Create user" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(onSubmit).toHaveBeenCalledWith({
      name: "Ada Lovelace",
      email: "ada@example.com",
      role: "STAFF",
    })
  })

  it("lets an administrator be invited by choosing the Admin role", async () => {
    const onSubmit = vi.fn()
    render(<CreateUserDialog onSubmit={onSubmit} />)
    const user = userEvent.setup()
    await openDialog(user)

    await user.type(screen.getByLabelText("Name"), "Grace Hopper")
    await user.type(screen.getByLabelText("Email"), "grace@example.com")
    await user.click(screen.getByRole("combobox", { name: "Role" }))
    await user.click(await screen.findByRole("option", { name: "Admin" }))
    await user.click(screen.getByRole("button", { name: "Create user" }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce())
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ role: "ADMIN" })
    )
  })

  it("shows a taken email on the email field and stays open", async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(
        new ApiError(409, ["A user with this email already exists"])
      )
    render(<CreateUserDialog onSubmit={onSubmit} />)
    const user = userEvent.setup()
    await openDialog(user)

    await user.type(screen.getByLabelText("Name"), "Ada Lovelace")
    await user.type(screen.getByLabelText("Email"), "ada@example.com")
    await user.click(screen.getByRole("button", { name: "Create user" }))

    await waitFor(() =>
      expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
        "A user with this email already exists"
      )
    )
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByLabelText("Name")).toHaveValue("Ada Lovelace")
  })

  it("shows other failures as a form message and stays open", async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(new ApiError(403, ["Insufficient permissions"]))
    render(<CreateUserDialog onSubmit={onSubmit} />)
    const user = userEvent.setup()
    await openDialog(user)

    await user.type(screen.getByLabelText("Name"), "Ada Lovelace")
    await user.type(screen.getByLabelText("Email"), "ada@example.com")
    await user.click(screen.getByRole("button", { name: "Create user" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Insufficient permissions"
    )
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("shows a loading state and locks the fields while submitting", async () => {
    let finish: () => void = () => {}
    const onSubmit = vi.fn(
      () => new Promise<void>((resolve) => (finish = resolve))
    )
    render(<CreateUserDialog onSubmit={onSubmit} />)
    const user = userEvent.setup()
    await openDialog(user)

    await user.type(screen.getByLabelText("Name"), "Ada Lovelace")
    await user.type(screen.getByLabelText("Email"), "ada@example.com")
    await user.click(screen.getByRole("button", { name: "Create user" }))

    expect(
      await screen.findByRole("button", { name: "Creating…" })
    ).toBeDisabled()
    expect(screen.getByLabelText("Name")).toBeDisabled()

    finish()
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  })

  it("starts empty again after being cancelled", async () => {
    render(<CreateUserDialog />)
    const user = userEvent.setup()
    await openDialog(user)

    await user.type(screen.getByLabelText("Name"), "Ada")
    await user.click(screen.getByRole("button", { name: "Cancel" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())

    await openDialog(user)
    expect(screen.getByLabelText("Name")).toHaveValue("")
  })
})
