import { act, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import { vi } from "vitest"

import { useAuth } from "@/hooks/auth/use-auth"
import { ApiError } from "@/lib/api/api-error"
import {
  confirmImport,
  downloadProductTemplate,
  getImport,
  getImportErrors,
  getImportPreview,
  getImportTypes,
  listImports,
  previewImport,
} from "@/services/imports/import.api"
import { ImportsScreen } from "@/screens/imports"
import { createAuthUser } from "@/test-utils/auth-fixtures"
import {
  createImportDetails,
  createPage,
  createPreviewResult,
  createPreviewRow,
  createRowIssue,
} from "@/test-utils/import-fixtures"
import { renderWithQuery } from "@/test-utils/render"
import type { ImportJobDetails } from "@/types/import.types"

vi.mock("@/services/imports/import.api")
vi.mock("@/hooks/auth/use-auth")
vi.mock("@/components/dashboard/dashboard-header", () => ({
  DashboardHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}))
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), info: vi.fn(), warning: vi.fn(), error: vi.fn() },
}))

const user = userEvent.setup({ applyAccept: false })
const FUTURE = new Date(Date.now() + 10 * 60_000).toISOString()
const FAR_FUTURE = new Date(Date.now() + 5 * 24 * 60 * 60_000).toISOString()

function job(overrides: Partial<ImportJobDetails> = {}) {
  return createImportDetails({
    previewExpiresAt: FUTURE,
    errorsExpiresAt: FAR_FUTURE,
    ...overrides,
  })
}

function csv(name = "products.csv") {
  return new File(["name,sku,category,price"], name, { type: "text/csv" })
}

async function chooseAndValidate(file = csv()) {
  await user.upload(screen.getByLabelText("Product CSV file"), file)
  await user.click(
    screen.getByRole("button", { name: `Validate ${file.name}` })
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(useAuth).mockReturnValue({
    status: "authenticated",
    user: createAuthUser({ role: "STAFF" }),
  })
  vi.mocked(getImportTypes).mockResolvedValue({
    maxFileBytes: 10 * 1024 * 1024,
    maxRows: 250,
    previewTtlSeconds: 900,
    columns: [
      { name: "name", required: true },
      { name: "sku", required: true },
      { name: "category", required: true },
      { name: "price", required: true },
      { name: "stock", required: false },
    ],
  })
  vi.mocked(listImports).mockResolvedValue({
    jobs: [],
    totalRecords: 0,
    statusCounts: {} as never,
  })
  vi.mocked(getImport).mockResolvedValue(job())
  vi.mocked(getImportPreview).mockResolvedValue(
    createPage([createPreviewRow(2), createPreviewRow(3), createPreviewRow(4)])
  )
  vi.mocked(getImportErrors).mockResolvedValue(createPage([]))
})

describe("ImportsScreen", () => {
  it("shows the server's limits and the required columns", async () => {
    renderWithQuery(<ImportsScreen />)

    expect(
      await screen.findByText(/A file can hold up to 250 products/)
    ).toHaveTextContent("Required columns: name, sku, category, price.")
    expect(screen.getByRole("heading", { name: "Imports" })).toBeInTheDocument()
    expect(
      await screen.findByRole("heading", { name: "Import history" })
    ).toBeInTheDocument()
  })

  it("validates a chosen file, then reviews it before anything is created", async () => {
    vi.mocked(previewImport).mockResolvedValue(
      createPreviewResult({ job: job() })
    )
    renderWithQuery(<ImportsScreen />)

    await chooseAndValidate()

    expect(
      await screen.findByRole("heading", { name: "spring-catalogue.csv" })
    ).toHaveFocus()
    expect(previewImport).toHaveBeenCalledWith(
      expect.objectContaining({ name: "products.csv" }),
      expect.stringMatching(/^[0-9a-f-]{36}$/),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    )
    expect(toast.success).toHaveBeenCalledWith(
      "CSV validated. Review it before creating products."
    )
    expect(confirmImport).not.toHaveBeenCalled()
    expect(
      screen.getByRole("button", { name: "Create 3 products" })
    ).toBeInTheDocument()
    // The file picker still holds the file, so a correction is one click away.
    expect(screen.getByText("products.csv")).toBeInTheDocument()
  })

  it("reports upload progress, then an indeterminate check, and can be cancelled", async () => {
    let finish!: () => void
    let report!: (percent: number) => void
    vi.mocked(previewImport).mockImplementation(
      (_file, _key, options) =>
        new Promise((resolve, reject) => {
          report = (percent) => options?.onUploadProgress?.(percent)
          finish = () => resolve(createPreviewResult())
          options?.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError"))
          )
        })
    )
    renderWithQuery(<ImportsScreen />)
    await chooseAndValidate()

    expect(await screen.findByText("Uploading file")).toBeInTheDocument()
    act(() => report(40))
    expect(
      await screen.findByRole("progressbar", { name: "Uploading file" })
    ).toHaveAttribute("aria-valuenow", "40")
    act(() => report(100))
    expect(await screen.findByText("Checking every row")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Cancel" }))

    await waitFor(() =>
      expect(toast.info).toHaveBeenCalledWith("Validation cancelled.")
    )
    expect(screen.queryByText("Checking every row")).toBeNull()
    expect(screen.queryByRole("alert")).toBeNull()
    // Never resolved: nothing was reviewed or created.
    finish()
    expect(confirmImport).not.toHaveBeenCalled()
  })

  it("keeps one request id for retries of the same file, and a new one for another", async () => {
    vi.mocked(previewImport)
      .mockRejectedValueOnce(new ApiError(0, ["Unable to reach the server."]))
      .mockResolvedValue(createPreviewResult())
    renderWithQuery(<ImportsScreen />)

    await chooseAndValidate()
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to reach the server."
    )
    await user.click(
      screen.getByRole("button", { name: "Validate products.csv" })
    )
    await screen.findByRole("heading", { name: "spring-catalogue.csv" })
    await user.upload(
      screen.getByLabelText("Product CSV file"),
      csv("corrected.csv")
    )
    await user.click(
      screen.getByRole("button", { name: "Validate corrected.csv" })
    )

    await waitFor(() => expect(previewImport).toHaveBeenCalledTimes(3))
    const keys = vi.mocked(previewImport).mock.calls.map(([, key]) => key)
    expect(keys[0]).toBe(keys[1])
    expect(keys[2]).not.toBe(keys[0])
  })

  it("says what was wrong when a file is rejected, and creates nothing", async () => {
    vi.mocked(previewImport).mockRejectedValue(
      new ApiError(415, ["Save the file as CSV UTF-8."])
    )
    renderWithQuery(<ImportsScreen />)

    await chooseAndValidate()

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Save the file as CSV UTF-8."
    )
    expect(
      screen.queryByRole("heading", { name: "spring-catalogue.csv" })
    ).toBeNull()
  })

  it("shows the problems of an invalid file and no confirmation", async () => {
    const failed = job({
      status: "validation-failed",
      validRows: 2,
      invalidRows: 1,
      errorCount: 1,
      previewHash: null,
    })
    vi.mocked(getImport).mockResolvedValue(failed)
    vi.mocked(previewImport).mockResolvedValue(
      createPreviewResult({
        job: failed,
        errors: createPage([createRowIssue({ rowNumber: 3 })]),
      })
    )
    vi.mocked(getImportErrors).mockResolvedValue(
      createPage([createRowIssue({ rowNumber: 3 })])
    )
    renderWithQuery(<ImportsScreen />)

    await chooseAndValidate()

    expect(await screen.findByText("Nothing was created")).toBeInTheDocument()
    expect(toast.warning).toHaveBeenCalled()
    expect(
      screen.queryByRole("button", { name: /^Create \d+ products$/ })
    ).toBeNull()
  })

  it("clears the review when the file is replaced or removed", async () => {
    vi.mocked(previewImport).mockResolvedValue(createPreviewResult())
    renderWithQuery(<ImportsScreen />)
    await chooseAndValidate()
    await screen.findByRole("heading", { name: "spring-catalogue.csv" })

    await user.click(
      screen.getByRole("button", { name: "Remove products.csv" })
    )

    expect(
      screen.queryByRole("heading", { name: "spring-catalogue.csv" })
    ).toBeNull()
  })

  it("downloads the template, and reports why it could not", async () => {
    vi.mocked(downloadProductTemplate)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new ApiError(0, ["Unable to reach the server."]))
    renderWithQuery(<ImportsScreen />)
    const button = screen.getByRole("button", { name: "Download CSV Template" })

    await user.click(button)
    expect(downloadProductTemplate).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole("alert")).toBeNull()

    await user.click(button)
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to reach the server."
    )
  })

  it("keeps the history on screen while a file is reviewed", async () => {
    vi.mocked(previewImport).mockResolvedValue(createPreviewResult())
    renderWithQuery(<ImportsScreen />)
    await chooseAndValidate()
    await screen.findByRole("heading", { name: "spring-catalogue.csv" })

    const history = screen.getByRole("region", { name: "Import history" })

    expect(within(history).getByText("No imports yet")).toBeInTheDocument()
  })
})
