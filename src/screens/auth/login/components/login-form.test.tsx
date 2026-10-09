import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"

import { ApiError } from "@/lib/api/api-error"
import { signIn } from "@/lib/auth/auth-store"

import type { AuthFormAction } from "@/lib/auth/form-state"
import type { LoginField } from "@/lib/auth/validation"
import { LoginForm } from "@/screens/auth/login/components/login-form"
import { renderWithQuery } from "@/test-utils/render"

vi.mock("@/lib/auth/auth-store")

describe("LoginForm", () => {
  beforeEach(() => {
    vi.mocked(signIn).mockReset()
  })

  it("shows field errors linked to their inputs and focuses the first one", async () => {
    const action = vi.fn<AuthFormAction<LoginField>>()
    renderWithQuery(<LoginForm action={action} />)

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
    renderWithQuery(<LoginForm />)

    const password = screen.getByLabelText("Password")
    expect(password).toHaveAttribute("type", "password")

    await userEvent.click(screen.getByRole("button", { name: "Show password" }))
    expect(password).toHaveAttribute("type", "text")

    await userEvent.click(screen.getByRole("button", { name: "Hide password" }))
    expect(password).toHaveAttribute("type", "password")
  })

  it("has no remember-me option, because sessions are always persistent", () => {
    renderWithQuery(<LoginForm />)

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "Forgot password?" })
    ).toHaveAttribute("href", "/forgot-password")
  })

  it("submits valid data to the action and renders its error message", async () => {
    const action = vi.fn<AuthFormAction<LoginField>>(async () => ({
      status: "error",
      message: "Invalid email or password.",
    }))
    renderWithQuery(<LoginForm action={action} />)

    await userEvent.type(screen.getByLabelText("Email"), "ada@example.com")
    await userEvent.type(screen.getByLabelText("Password"), "secret")
    await userEvent.click(screen.getByRole("button", { name: "Log in" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid email or password."
    )
    const formData = action.mock.calls[0][1]
    expect(formData.get("email")).toBe("ada@example.com")
    expect(formData.get("password")).toBe("secret")
    // Inputs keep their values after an error response.
    expect(screen.getByLabelText("Email")).toHaveValue("ada@example.com")
  })

  it("signs in through the login mutation with the trimmed email", async () => {
    vi.mocked(signIn).mockResolvedValue(undefined)
    renderWithQuery(<LoginForm />)

    await userEvent.type(screen.getByLabelText("Email"), "  ada@example.com ")
    await userEvent.type(screen.getByLabelText("Password"), "secret")
    await userEvent.click(screen.getByRole("button", { name: "Log in" }))

    await waitFor(() =>
      expect(signIn).toHaveBeenCalledWith("ada@example.com", "secret")
    )
    expect(signIn).toHaveBeenCalledTimes(1)
  })

  it("shows invalid credentials and keeps the form usable for another try", async () => {
    vi.mocked(signIn).mockRejectedValue(
      new ApiError(401, ["Invalid email or password"])
    )
    renderWithQuery(<LoginForm />)

    await userEvent.type(screen.getByLabelText("Email"), "ada@example.com")
    await userEvent.type(screen.getByLabelText("Password"), "wrong")
    await userEvent.click(screen.getByRole("button", { name: "Log in" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid email or password"
    )
    expect(screen.getByRole("button", { name: "Log in" })).toBeEnabled()
    expect(screen.getByLabelText("Email")).toHaveValue("ada@example.com")
  })
})
