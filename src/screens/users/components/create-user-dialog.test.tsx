import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"

import { CreateUserDialog } from "@/screens/users/components/create-user-dialog"

async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Create User" }))
  return screen.findByRole("dialog", { name: "Create user" })
}

describe("CreateUserDialog", () => {
  it("opens an accessible dialog with the name and email fields", async () => {
    render(<CreateUserDialog />)
    const user = userEvent.setup()

    const dialog = await openDialog(user)

    expect(dialog).toBeInTheDocument()
    expect(screen.getByLabelText("Name")).toBeInTheDocument()
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
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

  it("submits trimmed values and closes", async () => {
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
    })
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

    expect(await screen.findByRole("button", { name: "Creating…" })).toBeDisabled()
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
