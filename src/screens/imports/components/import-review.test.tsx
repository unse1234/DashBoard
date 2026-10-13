import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import { vi } from "vitest"

import { useAuth } from "@/hooks/auth/use-auth"
import { ApiError } from "@/lib/api/api-error"
import {
  confirmImport,
  downloadImportErrors,
  getImport,
  getImportErrors,
  getImportPreview,
} from "@/services/imports/import.api"
import { ImportReview } from "@/screens/imports/components/import-review"
import { createAuthUser } from "@/test-utils/auth-fixtures"
import {
  createImportDetails,
  createPage,
  createPreviewRow,
  createRowIssue,
} from "@/test-utils/import-fixtures"
import { networkError } from "@/test-utils/mock-api"
import { renderWithQuery } from "@/test-utils/render"
import type { ImportJobDetails } from "@/types/import.types"

vi.mock("@/services/imports/import.api")
vi.mock("@/hooks/auth/use-auth")
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), info: vi.fn(), warning: vi.fn(), error: vi.fn() },
}))

const user = userEvent.setup()
const FUTURE = new Date(Date.now() + 10 * 60_000).toISOString()
const FAR_FUTURE = new Date(Date.now() + 5 * 24 * 60 * 60_000).toISOString()

/** A job whose deadlines are still ahead, whatever day the tests run. */
function job(overrides: Partial<ImportJobDetails> = {}) {
  return createImportDetails({
    previewExpiresAt: FUTURE,
    errorsExpiresAt: FAR_FUTURE,
    ...overrides,
  })
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(useAuth).mockReturnValue({
    status: "authenticated",
    user: createAuthUser(),
  })
  vi.mocked(getImportPreview).mockResolvedValue(
    createPage([createPreviewRow(2), createPreviewRow(3), createPreviewRow(4)])
  )
  vi.mocked(getImportErrors).mockResolvedValue(createPage([]))
})

describe("a validated file that is ready", () => {
  beforeEach(() => {
    vi.mocked(getImport).mockResolvedValue(job())
  })

  it("shows the counts, the rows and a way to create the products", async () => {
    renderWithQuery(<ImportReview importId="IMP-1001" />)

    expect(
      await screen.findByRole("heading", { name: "spring-catalogue.csv" })
    ).toBeInTheDocument()
    expect(screen.getByText("IMP-1001")).toBeInTheDocument()
    expect(screen.getByText("Nothing has been created yet")).toBeInTheDocument()
    const rows = await screen.findByRole("region", {
      name: "Rows in this file",
    })
    expect(within(rows).getByText("MUG-3")).toBeInTheDocument()
    expect(within(rows).getAllByText("Valid")).toHaveLength(3)
    expect(
      screen.getByRole("button", { name: "Create 3 products" })
    ).toBeEnabled()
    expect(screen.queryByText(/Problems found/)).toBeNull()
  })

  it("names the headers it understood when it was just validated", async () => {
    renderWithQuery(
      <ImportReview
        importId="IMP-1001"
        mapping={[
          { header: "Product Name", column: "name" },
          { header: "sku", column: "sku" },
        ]}
      />
    )

    expect(await screen.findByText("Product Name")).toBeInTheDocument()
    expect(screen.getByText("name")).toBeInTheDocument()
    expect(screen.getByText(/stock 0 and status ACTIVE/)).toBeInTheDocument()
  })

  it("asks before creating, then sends only the job's version and hash", async () => {
    vi.mocked(confirmImport).mockResolvedValue({
      job: job({
        status: "completed",
        importedRows: 3,
        validRows: 3,
        previewHash: null,
      }),
      processing: false,
    })
    renderWithQuery(<ImportReview importId="IMP-1001" />)

    await user.click(
      await screen.findByRole("button", { name: "Create 3 products" })
    )
    const dialog = await screen.findByRole("dialog", {
      name: "Create 3 products?",
    })
    expect(confirmImport).not.toHaveBeenCalled()
    expect(dialog).toHaveAccessibleDescription(/or none are/)
    await user.click(
      within(dialog).getByRole("button", { name: "Create 3 products" })
    )

    await waitFor(() =>
      expect(confirmImport).toHaveBeenCalledWith("IMP-1001", 1, "a".repeat(64))
    )
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(toast.success).toHaveBeenCalledWith("3 products created.")
    expect(
      await screen.findByText("3 products were created")
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "View Products" })).toHaveAttribute(
      "href",
      "/dashboard/products"
    )
    expect(
      screen.queryByRole("button", { name: "Create 3 products" })
    ).toBeNull()
  })

  it("keeps the dialog open and explains a refusal", async () => {
    vi.mocked(confirmImport).mockRejectedValue(
      new ApiError(409, ["The catalogue changed. Validate the CSV again."])
    )
    renderWithQuery(<ImportReview importId="IMP-1001" />)

    await user.click(
      await screen.findByRole("button", { name: "Create 3 products" })
    )
    const dialog = await screen.findByRole("dialog")
    await user.click(
      within(dialog).getByRole("button", { name: "Create 3 products" })
    )

    expect(
      await within(dialog).findByText(
        "The catalogue changed. Validate the CSV again."
      )
    ).toBeInTheDocument()
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("does not claim a failure when the connection drops mid-confirmation", async () => {
    vi.mocked(confirmImport).mockRejectedValue(
      new ApiError(0, ["Unable to reach the server."])
    )
    renderWithQuery(<ImportReview importId="IMP-1001" />)
    await user.click(
      await screen.findByRole("button", { name: "Create 3 products" })
    )
    const dialog = await screen.findByRole("dialog")
    vi.mocked(getImport).mockClear()

    await user.click(
      within(dialog).getByRole("button", { name: "Create 3 products" })
    )

    expect(
      await within(dialog).findByText(
        /Check this import's status before trying again/
      )
    ).toBeInTheDocument()
    // The outcome of record is read straight away.
    await waitFor(() => expect(getImport).toHaveBeenCalled())
  })

  it("reports a confirmation another request is already running", async () => {
    vi.mocked(confirmImport).mockResolvedValue({
      job: job({ status: "processing", startedAt: new Date().toISOString() }),
      processing: true,
    })
    renderWithQuery(<ImportReview importId="IMP-1001" />)
    await user.click(
      await screen.findByRole("button", { name: "Create 3 products" })
    )
    const dialog = await screen.findByRole("dialog")
    await user.click(
      within(dialog).getByRole("button", { name: "Create 3 products" })
    )

    await waitFor(() =>
      expect(toast.info).toHaveBeenCalledWith(
        "This import is already being created.",
        expect.anything()
      )
    )
    expect(toast.success).not.toHaveBeenCalled()
  })

  it("pages through every row", async () => {
    vi.mocked(getImportPreview).mockImplementation((_id, page) =>
      Promise.resolve(
        createPage([createPreviewRow(page === 1 ? 2 : 27)], {
          page,
          totalPages: 2,
          totalRecords: 26,
        })
      )
    )
    renderWithQuery(<ImportReview importId="IMP-1001" />)
    await screen.findByText("MUG-2")

    await user.click(screen.getByRole("button", { name: "Next" }))

    expect(await screen.findByText("MUG-27")).toBeInTheDocument()
    expect(getImportPreview).toHaveBeenLastCalledWith(
      "IMP-1001",
      2,
      expect.any(AbortSignal)
    )
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument()
  })
})

describe("a file that needs corrections", () => {
  beforeEach(() => {
    vi.mocked(getImport).mockResolvedValue(
      job({
        status: "validation-failed",
        validRows: 2,
        invalidRows: 1,
        errorCount: 1,
        previewHash: null,
      })
    )
    vi.mocked(getImportPreview).mockResolvedValue(
      createPage([
        createPreviewRow(2),
        createPreviewRow(3, { price: "abc" }, [createRowIssue()]),
      ])
    )
    vi.mocked(getImportErrors).mockResolvedValue(
      createPage([createRowIssue({ rowNumber: 3 })])
    )
  })

  it("creates nothing, lists each problem and offers no confirmation", async () => {
    renderWithQuery(<ImportReview importId="IMP-1001" />)

    expect(await screen.findByText("Nothing was created")).toBeInTheDocument()
    const problems = await screen.findByRole("region", {
      name: /Problems found \(1\)/,
    })
    expect(
      within(problems).getByText(/at most two decimals/)
    ).toBeInTheDocument()
    const rows = await screen.findByRole("region", {
      name: "Rows in this file",
    })
    expect(within(rows).getByText("Valid")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /^Create \d+ products$/ })
    ).toBeNull()
    expect(screen.queryByRole("button", { name: "Retry import" })).toBeNull()
  })

  it("downloads the report, and says why when it cannot", async () => {
    vi.mocked(downloadImportErrors)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(
        new ApiError(410, ["The error report has expired."])
      )
    renderWithQuery(<ImportReview importId="IMP-1001" />)
    const button = await screen.findByRole("button", {
      name: "Download Error Report",
    })

    await user.click(button)
    expect(downloadImportErrors).toHaveBeenCalledWith("IMP-1001")

    await user.click(button)
    expect(
      await screen.findByText("The error report has expired.")
    ).toBeInTheDocument()
  })

  it("explains an expired report instead of listing problems", async () => {
    vi.mocked(getImport).mockResolvedValue(
      job({
        status: "validation-failed",
        errorCount: 1,
        errorsExpiresAt: new Date(Date.now() - 1000).toISOString(),
      })
    )
    renderWithQuery(<ImportReview importId="IMP-1001" />)

    expect(
      await screen.findByText(/The error report has expired/)
    ).toBeInTheDocument()
    expect(getImportErrors).not.toHaveBeenCalled()
    expect(
      screen.queryByRole("button", { name: "Download Error Report" })
    ).toBeNull()
  })
})

describe("other outcomes", () => {
  it("shows work in progress without offering to repeat it", async () => {
    vi.mocked(getImport).mockResolvedValue(
      job({
        status: "processing",
        previewHash: null,
        startedAt: new Date().toISOString(),
      })
    )
    renderWithQuery(<ImportReview importId="IMP-1001" />)

    expect(
      await screen.findByText(/This page updates when it finishes/)
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /^Create \d+ products$/ })
    ).toBeNull()
    expect(
      screen.getByRole("button", { name: "Refresh Status" })
    ).toBeInTheDocument()
    // The held rows are not shown while another request is writing them.
    expect(getImportPreview).not.toHaveBeenCalled()
  })

  it("offers a retry of a transient failure with the same file", async () => {
    vi.mocked(getImport).mockResolvedValue(
      job({
        status: "failed",
        retryable: true,
        failureMessage:
          "Processing was interrupted. You can retry this preview.",
      })
    )
    renderWithQuery(<ImportReview importId="IMP-1001" />)

    expect(
      await screen.findByText(/Processing was interrupted/)
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Retry import" })
    ).toBeInTheDocument()
    expect(
      screen.getByText(/retry with the same validated file/)
    ).toBeInTheDocument()
  })

  it("asks for a new validation after a conflict that cannot be retried", async () => {
    vi.mocked(getImport).mockResolvedValue(
      job({
        status: "failed",
        retryable: false,
        failureMessage: "The catalogue changed. Validate the CSV again.",
        previewHash: null,
      })
    )
    renderWithQuery(<ImportReview importId="IMP-1001" />)

    expect(
      await screen.findByText(/Validate the CSV again to continue/)
    ).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Retry import" })).toBeNull()
  })

  it("says an expired preview is gone and shows no rows", async () => {
    vi.mocked(getImport).mockResolvedValue(
      job({ status: "expired", previewHash: null })
    )
    renderWithQuery(<ImportReview importId="IMP-1001" />)

    expect(await screen.findByText("This preview expired")).toBeInTheDocument()
    expect(screen.queryByText("Rows in this file")).toBeNull()
    expect(getImportPreview).not.toHaveBeenCalled()
  })

  it("does not let a preview that ran out in the meantime be confirmed", async () => {
    vi.mocked(getImport).mockResolvedValue(
      job({ previewExpiresAt: new Date(Date.now() - 1000).toISOString() })
    )
    renderWithQuery(<ImportReview importId="IMP-1001" />)

    await screen.findByRole("heading", { name: "spring-catalogue.csv" })

    expect(
      screen.queryByRole("button", { name: /^Create \d+ products$/ })
    ).toBeNull()
  })

  it("hides the confirmation from someone who does not own the job", async () => {
    vi.mocked(getImport).mockResolvedValue(job({ previewHash: null }))
    renderWithQuery(<ImportReview importId="IMP-1001" />)

    await screen.findByRole("heading", { name: "spring-catalogue.csv" })

    expect(
      screen.queryByRole("button", { name: /^Create \d+ products$/ })
    ).toBeNull()
  })
})

describe("loading", () => {
  it("shows the API's message when the job cannot be read, and can try again", async () => {
    vi.mocked(getImport)
      .mockRejectedValueOnce(new ApiError(404, ["Import not found"]))
      .mockResolvedValue(job())
    renderWithQuery(<ImportReview importId="IMP-9999" />)

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /Couldn't load import.*Import not found/
    )
    await user.click(screen.getByRole("button", { name: "Try again" }))

    expect(
      await screen.findByRole("heading", { name: "spring-catalogue.csv" })
    ).toBeInTheDocument()
  })

  it("keeps showing a job that could be read when a later read fails", async () => {
    vi.mocked(getImport).mockResolvedValueOnce(job())
    renderWithQuery(<ImportReview importId="IMP-1001" />)
    await screen.findByRole("heading", { name: "spring-catalogue.csv" })
    vi.mocked(getImport).mockRejectedValue(networkError())

    await user.click(screen.getByRole("button", { name: "Refresh Status" }))

    expect(
      await screen.findByRole("heading", { name: "spring-catalogue.csv" })
    ).toBeInTheDocument()
    expect(screen.queryByText(/Couldn't load import/)).toBeNull()
  })
})
