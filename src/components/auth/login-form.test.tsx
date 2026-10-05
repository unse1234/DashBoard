import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"

import { LoginForm } from "@/components/auth/login-form"
import type { AuthFormAction } from "@/lib/auth/form-state"
import type { LoginField } from "@/lib/auth/validation"

describe("LoginForm", () => {
  it("shows field errors linked to their inputs and focuses the first one", async () => {
    const action = vi.fn<AuthFormAction<LoginField>>()
    render(<LoginForm action={action} />)

    await userEvent.click(screen.getByRole("button", { name: "Log in" }))

    const email = screen.getByLabelText("Email")
    expect(email).toHaveAttribute("aria-invalid", "true")
    expect(email).toHaveAccessibleDescription("Enter your email address.")
    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription(
      "Enter your password."
    )
    expect(email).toHaveFocus()
    expect(action).not.toHaveBeenCalled()
  })

  it("toggles password visibility with an accessible control", async () => {
    render(<LoginForm />)

    const password = screen.getByLabelText("Password")
    expect(password).toHaveAttribute("type", "password")

    await userEvent.click(screen.getByRole("button", { name: "Show password" }))
    expect(password).toHaveAttribute("type", "text")

    await userEvent.click(screen.getByRole("button", { name: "Hide password" }))
    expect(password).toHaveAttribute("type", "password")
  })

  it("submits valid data to the action and renders its error message", async () => {
    const action = vi.fn<AuthFormAction<LoginField>>(async () => ({
      status: "error",
      message: "Invalid email or password.",
    }))
    render(<LoginForm action={action} />)

    await userEvent.type(screen.getByLabelText("Email"), "ada@example.com")
    await userEvent.type(screen.getByLabelText("Password"), "secret")
    await userEvent.click(screen.getByRole("checkbox", { name: "Remember me" }))
    await userEvent.click(screen.getByRole("button", { name: "Log in" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid email or password."
    )
    const formData = action.mock.calls[0][1]
    expect(formData.get("email")).toBe("ada@example.com")
    expect(formData.get("password")).toBe("secret")
    expect(formData.get("remember")).not.toBeNull()
    // Inputs keep their values after an error response.
    expect(screen.getByLabelText("Email")).toHaveValue("ada@example.com")
  })
})
