import { screen } from "@testing-library/react"
import { vi } from "vitest"

import AuthLayout from "@/app/(auth)/layout"
import DashboardLayout from "@/app/(dashboard)/layout"
import StorefrontLayout from "@/app/(storefront)/layout"
import { restoreSession } from "@/lib/auth/auth-store"
import { renderWithQuery } from "@/test-utils/render"

// next/font only works inside the Next.js compiler.
vi.mock("next/font/google", () => ({
  Cabin: () => ({ variable: "font-cabin" }),
}))
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }))
// The real store, so the guards see a session that is still being restored;
// only the restore itself is recorded instead of sent.
vi.mock("@/lib/auth/auth-store", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/auth/auth-store")>()),
  restoreSession: vi.fn(),
}))

describe("restoring the staff session, by route group", () => {
  beforeEach(() => {
    vi.mocked(restoreSession).mockClear()
    window.localStorage.clear()
  })

  it("does not restore a session on a storefront page", () => {
    renderWithQuery(
      <StorefrontLayout>
        <p>Catalog</p>
      </StorefrontLayout>
    )

    expect(screen.getByText("Catalog")).toBeInTheDocument()
    expect(restoreSession).not.toHaveBeenCalled()
  })

  it("restores the session on the sign-in screens", () => {
    renderWithQuery(
      <AuthLayout>
        <p>Sign in</p>
      </AuthLayout>
    )

    expect(screen.getByText("Sign in")).toBeInTheDocument()
    expect(restoreSession).toHaveBeenCalledTimes(1)
  })

  it("restores the session for the dashboard while its guard waits for it", () => {
    renderWithQuery(
      <DashboardLayout>
        <p>Dashboard</p>
      </DashboardLayout>
    )

    // The guard shows nothing of the dashboard until the restore settles, so
    // the restore must not depend on the guard rendering its children.
    expect(
      screen.getByRole("status", { name: "Loading your account" })
    ).toBeVisible()
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument()
    expect(restoreSession).toHaveBeenCalledTimes(1)
  })
})
