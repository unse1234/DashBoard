import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"

import { Button } from "@/components/ui/button"

describe("Button", () => {
  it("renders its label and handles clicks", async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Save</Button>)

    await userEvent.click(screen.getByRole("button", { name: "Save" }))

    expect(onClick).toHaveBeenCalledOnce()
  })
})
