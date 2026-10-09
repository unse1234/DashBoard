import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import { vi } from "vitest"

import { NavUser } from "@/components/dashboard/nav-user"
import { SidebarProvider } from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/use-auth"
import type { AuthUser } from "@/lib/auth/auth.types"
import { getAuthState, resetAuthStore, signIn } from "@/lib/auth/auth-store"
import { createAuthUser } from "@/test-utils/auth-fixtures"
import {
  mockApi,
  networkError,
  type MockReply,
  type RecordedRequest,
} from "@/test-utils/mock-api"
import { renderWithQuery } from "@/test-utils/render"

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}))
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => false }))

// The real session store, API client and mutation hooks run here; only the
// network is faked.

const ada = createAuthUser({ id: "u-ada", name: "Ada Admin" })

let api: ReturnType<typeof mockApi>
let onProfileUpdate: (request: RecordedRequest) => MockReply
let onLogout: () => MockReply

beforeEach(async () => {
  vi.clearAllMocks()
  resetAuthStore()
  onProfileUpdate = (request) => ({
    data: { ...ada, ...(request.body as Partial<AuthUser>) },
  })
  onLogout = () => ({ status: 204 })
  api = mockApi((request) => {
    if (request.url === "/auth/login") {
      return {
        data: {
          accessToken: "token-1",
          tokenType: "Bearer",
          expiresIn: 900,
          user: ada,
        },
      }
    }
    if (request.url === "/users/me") return onProfileUpdate(request)
    if (request.url === "/auth/logout") return onLogout()
    return { status: 404, data: { message: "unexpected request" } }
  })
  await signIn("ada@example.com", "pw")
})

afterEach(() => {
  api.restore()
})

function renderNav() {
  renderWithQuery(
    <SidebarProvider>
      <NavUser />
    </SidebarProvider>
  )
  return userEvent.setup()
}

// Like RequireAuth: the sidebar disappears the moment the session is cleared.
function SignedInOnly() {
  const { status } = useAuth()
  return status === "authenticated" ? <NavUser /> : null
}

async function openProfileDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /Ada Admin/ }))
  await user.click(await screen.findByRole("menuitem", { name: "Account" }))
  return screen.findByRole("dialog", { name: "Edit profile" })
}

const profileRequests = () => api.requests.filter((r) => r.url === "/users/me")

describe("NavUser profile", () => {
  it("shows the current name and the read-only email", async () => {
    const user = renderNav()

    const dialog = await openProfileDialog(user)

    expect(within(dialog).getByLabelText("Name")).toHaveValue("Ada Admin")
    expect(within(dialog).getByLabelText("Email")).toHaveAttribute("readonly")
  })

  it("saves a new name and shows it in the sidebar straight away", async () => {
    const user = renderNav()
    const dialog = await openProfileDialog(user)

    const name = within(dialog).getByLabelText("Name")
    await user.clear(name)
    await user.type(name, "  Ada King ")
    await user.click(
      within(dialog).getByRole("button", { name: "Save changes" })
    )

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(profileRequests()).toHaveLength(1)
    expect(profileRequests()[0]).toMatchObject({
      method: "PATCH",
      body: { name: "Ada King" },
    })
    expect(profileRequests()[0].headers.authorization).toBe("Bearer token-1")
    expect(toast.success).toHaveBeenCalledWith("Your profile was updated.")
    // The auth store, and so the sidebar, picked the change up without a refresh.
    expect(getAuthState().user?.name).toBe("Ada King")
    expect(screen.getByText("Ada King")).toBeInTheDocument()
  })

  it("closes without a request when the name is unchanged", async () => {
    const user = renderNav()
    const dialog = await openProfileDialog(user)

    await user.click(
      within(dialog).getByRole("button", { name: "Save changes" })
    )

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(profileRequests()).toHaveLength(0)
    expect(toast.success).not.toHaveBeenCalled()
  })

  it("validates the name before calling the API", async () => {
    const user = renderNav()
    const dialog = await openProfileDialog(user)

    await user.clear(within(dialog).getByLabelText("Name"))
    await user.click(
      within(dialog).getByRole("button", { name: "Save changes" })
    )

    expect(within(dialog).getByLabelText("Name")).toHaveAccessibleDescription(
      "Enter a name."
    )
    expect(profileRequests()).toHaveLength(0)
  })

  it("shows the API's reason, keeps the dialog open and leaves the session alone", async () => {
    onProfileUpdate = () => ({
      status: 400,
      data: {
        statusCode: 400,
        message: ["name must be shorter than 100 characters"],
      },
    })
    const user = renderNav()
    const dialog = await openProfileDialog(user)

    await user.type(within(dialog).getByLabelText("Name"), " Jr")
    await user.click(
      within(dialog).getByRole("button", { name: "Save changes" })
    )

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "name must be shorter than 100 characters"
    )
    expect(getAuthState().user?.name).toBe("Ada Admin")
    expect(toast.success).not.toHaveBeenCalled()
    expect(
      within(dialog).getByRole("button", { name: "Save changes" })
    ).toBeEnabled()
  })
})

describe("NavUser log out", () => {
  async function logOut(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole("button", { name: /Ada Admin/ }))
    await user.click(await screen.findByRole("menuitem", { name: "Log out" }))
  }

  it("ends the session on this device and on the server", async () => {
    const user = renderNav()

    await logOut(user)

    await waitFor(() =>
      expect(getAuthState()).toEqual({ status: "unauthenticated", user: null })
    )
    const request = api.requests.find((r) => r.url === "/auth/logout")
    expect(request).toMatchObject({ method: "POST", withCredentials: true })
    expect(request?.headers["x-csrf-protection"]).toBe("1")
    expect(toast.error).not.toHaveBeenCalled()
  })

  it("still warns about a failed server call although signing out removes the menu", async () => {
    onLogout = () => networkError()
    renderWithQuery(
      <SidebarProvider>
        <SignedInOnly />
      </SidebarProvider>
    )
    const user = userEvent.setup()

    await logOut(user)

    await waitFor(() => expect(screen.queryByText("Ada Admin")).toBeNull())
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("Your session may still be active.")
      )
    )
  })

  it("still signs out locally, and warns, when the server cannot be reached", async () => {
    onLogout = () => networkError()
    const user = renderNav()

    await logOut(user)

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("Your session may still be active.")
      )
    )
    expect(getAuthState().status).toBe("unauthenticated")
  })
})
