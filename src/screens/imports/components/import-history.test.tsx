import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"

import { useAuth } from "@/hooks/auth/use-auth"
import { ApiError } from "@/lib/api/api-error"
import { listImports } from "@/services/imports/import.api"
import { ImportHistory } from "@/screens/imports/components/import-history"
import { createAuthUser } from "@/test-utils/auth-fixtures"
import { createImportJob, createRowIssue } from "@/test-utils/import-fixtures"
import { renderWithQuery } from "@/test-utils/render"
import type { ImportStatus, ImportsPage } from "@/types/import.types"

vi.mock("@/services/imports/import.api")
vi.mock("@/hooks/auth/use-auth")

const user = userEvent.setup()

const noCounts = {
  ready: 0,
  "validation-failed": 0,
  processing: 0,
  completed: 0,
  failed: 0,
  expired: 0,
} satisfies Record<ImportStatus, number>

function page(overrides: Partial<ImportsPage> = {}): ImportsPage {
  return { jobs: [], totalRecords: 0, statusCounts: noCounts, ...overrides }
}

function signIn(role: "ADMIN" | "STAFF") {
  vi.mocked(useAuth).mockReturnValue({
    status: "authenticated",
    user: createAuthUser({ role }),
  })
}

beforeEach(() => {
  vi.resetAllMocks()
  signIn("STAFF")
})

describe("ImportHistory", () => {
  it("lists the caller's imports, newest first, with a link to each", async () => {
    vi.mocked(listImports).mockResolvedValue(
      page({
        jobs: [
          createImportJob({
            id: "IMP-1002",
            filename: "autumn.csv",
            status: "completed",
            importedRows: 3,
          }),
          createImportJob({
            id: "IMP-1001",
            filename: "spring.csv",
            status: "validation-failed",
            invalidRows: 2,
            errorCount: 5,
            sampleErrors: [createRowIssue({ rowNumber: 4 })],
          }),
        ],
        totalRecords: 2,
      })
    )

    renderWithQuery(<ImportHistory />)

    const autumn = (await screen.findByText("autumn.csv")).closest("li")!
    expect(within(autumn).getByText("Completed")).toBeInTheDocument()
    expect(
      within(autumn).getByRole("link", { name: "View details for autumn.csv" })
    ).toHaveAttribute("href", "/dashboard/imports/IMP-1002")
    const spring = screen.getByText("spring.csv").closest("li")!
    expect(within(spring).getByText("Needs corrections")).toBeInTheDocument()
    expect(within(spring).getByText("Row 4")).toBeInTheDocument()
    expect(within(spring).getByText(/and 4 more/)).toBeInTheDocument()
    expect(listImports).toHaveBeenCalledWith(
      { scope: "own", status: "all", page: 1, pageSize: 10 },
      expect.any(AbortSignal)
    )
  })

  it("does not offer staff a view of everyone's imports", async () => {
    vi.mocked(listImports).mockResolvedValue(page())
    renderWithQuery(<ImportHistory />)
    await screen.findByText("No imports yet")

    expect(
      screen.queryByRole("combobox", { name: "Whose imports to show" })
    ).toBeNull()
  })

  it("lets an administrator switch to everyone's imports and shows who started each", async () => {
    signIn("ADMIN")
    vi.mocked(listImports).mockResolvedValue(
      page({
        jobs: [
          createImportJob({
            id: "IMP-2000",
            initiatedBy: { name: "Sam Staff", isCurrentUser: false },
          }),
        ],
        totalRecords: 1,
      })
    )
    renderWithQuery(<ImportHistory />)
    await screen.findByText("spring-catalogue.csv")
    expect(screen.queryByText(/Sam Staff/)).toBeNull()

    await user.click(
      screen.getByRole("combobox", { name: "Whose imports to show" })
    )
    await user.click(await screen.findByRole("option", { name: "All imports" }))

    expect(await screen.findByText(/Sam Staff/)).toBeInTheDocument()
    expect(listImports).toHaveBeenLastCalledWith(
      expect.objectContaining({ scope: "all", page: 1 }),
      expect.any(AbortSignal)
    )
  })

  it("filters by status and returns to the first page", async () => {
    vi.mocked(listImports).mockResolvedValue(
      page({ jobs: [createImportJob()], totalRecords: 1 })
    )
    renderWithQuery(<ImportHistory />)
    await screen.findByText("spring-catalogue.csv")

    await user.click(screen.getByRole("combobox", { name: "Filter by status" }))
    await user.click(await screen.findByRole("option", { name: "Failed" }))

    await waitFor(() =>
      expect(listImports).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: "failed", page: 1 }),
        expect.any(AbortSignal)
      )
    )
  })

  it("explains an empty history", async () => {
    vi.mocked(listImports).mockResolvedValue(page())

    renderWithQuery(<ImportHistory />)

    expect(await screen.findByText("No imports yet")).toBeInTheDocument()
  })

  it("shows the API's message when the history cannot be loaded, and retries", async () => {
    vi.mocked(listImports)
      .mockRejectedValueOnce(new ApiError(500, ["boom"]))
      .mockResolvedValue(page({ jobs: [createImportJob()], totalRecords: 1 }))
    renderWithQuery(<ImportHistory />)

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't load imports"
    )
    await user.click(screen.getByRole("button", { name: "Try again" }))

    expect(await screen.findByText("spring-catalogue.csv")).toBeInTheDocument()
  })

  it("pages through the history", async () => {
    vi.mocked(listImports).mockImplementation((query) =>
      Promise.resolve(
        page({
          jobs: [
            createImportJob({
              id: `IMP-${query.page}`,
              filename: `page-${query.page}.csv`,
            }),
          ],
          totalRecords: 25,
        })
      )
    )
    renderWithQuery(<ImportHistory />)
    await screen.findByText("page-1.csv")

    await user.click(screen.getByRole("button", { name: "Go to next page" }))

    expect(await screen.findByText("page-2.csv")).toBeInTheDocument()
  })
})
