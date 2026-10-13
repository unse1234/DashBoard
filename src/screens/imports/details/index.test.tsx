import { screen, within } from "@testing-library/react"
import { vi } from "vitest"

import { useAuth } from "@/hooks/auth/use-auth"
import { ApiError } from "@/lib/api/api-error"
import {
  getImport,
  getImportErrors,
  getImportPreview,
} from "@/services/imports/import.api"
import { ImportDetailsScreen } from "@/screens/imports/details"
import { createAuthUser } from "@/test-utils/auth-fixtures"
import { createImportDetails, createPage } from "@/test-utils/import-fixtures"
import { renderWithQuery } from "@/test-utils/render"

vi.mock("@/services/imports/import.api")
vi.mock("@/hooks/auth/use-auth")
vi.mock("@/components/dashboard/dashboard-header", () => ({
  DashboardHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}))

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(useAuth).mockReturnValue({
    status: "authenticated",
    user: createAuthUser(),
  })
  vi.mocked(getImportPreview).mockResolvedValue(createPage([]))
  vi.mocked(getImportErrors).mockResolvedValue(createPage([]))
})

describe("ImportDetailsScreen", () => {
  it("shows the import's outcome beside its information and timeline", async () => {
    vi.mocked(getImport).mockResolvedValue(
      createImportDetails({
        id: "IMP-1005",
        filename: "autumn.csv",
        status: "completed",
        importedRows: 3,
        previewHash: null,
        startedAt: "2026-10-12T10:01:00Z",
        completedAt: "2026-10-12T10:01:04Z",
        initiatedBy: { name: "Sam Staff", isCurrentUser: false },
      })
    )

    renderWithQuery(<ImportDetailsScreen jobId="IMP-1005" />)

    expect(
      await screen.findByRole("heading", { name: "autumn.csv" })
    ).toBeInTheDocument()
    expect(screen.getByText("3 products were created")).toBeInTheDocument()
    expect(getImport).toHaveBeenCalledWith("IMP-1005", expect.any(AbortSignal))

    const info = (await screen.findByText("Job information")).closest(
      "[data-slot=card]"
    ) as HTMLElement
    expect(within(info).getByText("Sam Staff")).toBeInTheDocument()
    expect(within(info).getByText("4s")).toBeInTheDocument()
    expect(screen.getByText("Started creating products")).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /Back to Imports/ })
    ).toHaveAttribute("href", "/dashboard/imports")
  })

  it("says so when the import does not exist or is not the user's", async () => {
    vi.mocked(getImport).mockRejectedValue(
      new ApiError(404, ["Import not found"])
    )

    renderWithQuery(<ImportDetailsScreen jobId="IMP-9999" />)

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Import not found"
    )
    expect(screen.queryByText("Job information")).toBeNull()
  })
})
