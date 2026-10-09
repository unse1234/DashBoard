import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { vi } from "vitest"

import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { ApiError } from "@/lib/api/api-error"

function deferred() {
  let resolve!: () => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function Harness({ onConfirm }: { onConfirm: () => Promise<void> }) {
  const [open, setOpen] = useState(true)
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={setOpen}
      title="Delete Ada?"
      description="This can't be undone."
      confirmLabel="Delete user"
      pendingLabel="Deleting…"
      destructive
      onConfirm={onConfirm}
    />
  )
}

describe("ConfirmDialog", () => {
  it("is an accessible dialog that names the action", async () => {
    render(<Harness onConfirm={vi.fn()} />)

    const dialog = await screen.findByRole("dialog", { name: "Delete Ada?" })
    expect(dialog).toHaveAccessibleDescription("This can't be undone.")
    expect(screen.getByRole("button", { name: "Delete user" })).toBeEnabled()
  })

  it("does not act until confirmed", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined)
    render(<Harness onConfirm={onConfirm} />)
    await screen.findByRole("dialog")

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it("blocks a second submission while working, then closes on success", async () => {
    const work = deferred()
    const onConfirm = vi.fn().mockReturnValue(work.promise)
    render(<Harness onConfirm={onConfirm} />)
    await screen.findByRole("dialog")

    await userEvent.click(screen.getByRole("button", { name: "Delete user" }))

    const busy = screen.getByRole("button", { name: "Deleting…" })
    expect(busy).toBeDisabled()
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled()
    await userEvent.click(busy)
    expect(onConfirm).toHaveBeenCalledTimes(1)

    work.resolve()
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  })

  it("stays open, shows the reason and allows another attempt when it fails", async () => {
    const onConfirm = vi
      .fn()
      .mockRejectedValueOnce(new ApiError(403, ["Insufficient permissions"]))
      .mockResolvedValueOnce(undefined)
    render(<Harness onConfirm={onConfirm} />)
    await screen.findByRole("dialog")

    await userEvent.click(screen.getByRole("button", { name: "Delete user" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Insufficient permissions"
    )
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Delete user" })).toBeEnabled()

    await userEvent.click(screen.getByRole("button", { name: "Delete user" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(onConfirm).toHaveBeenCalledTimes(2)
  })

  it("does not show server internals", async () => {
    render(
      <Harness
        onConfirm={vi
          .fn()
          .mockRejectedValue(new ApiError(500, ["stack trace"]))}
      />
    )
    await screen.findByRole("dialog")

    await userEvent.click(screen.getByRole("button", { name: "Delete user" }))

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent(/something went wrong on our side/i)
    expect(alert).not.toHaveTextContent("stack trace")
  })
})
