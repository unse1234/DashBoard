import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"

import {
  getMockImportFailedRows,
  getMockImportJobById,
} from "@/lib/imports/import.mock-data"
import { getImportTimeline } from "@/lib/imports/import.utils"
import { ImportDetailsHeader } from "@/screens/imports/details/components/import-details-header"
import { ImportFailedRows } from "@/screens/imports/details/components/import-failed-rows"
import { ImportJobInfo } from "@/screens/imports/details/components/import-job-info"
import { ImportProgressCard } from "@/screens/imports/details/components/import-progress-card"
import { ImportTimeline } from "@/screens/imports/details/components/import-timeline"

vi.mock("sonner", () => ({ toast: { info: vi.fn() } }))

const user = userEvent.setup()

function getJob(jobId: string) {
  return getMockImportJobById(jobId)!
}

function getValue(label: string) {
  const term = screen.getByText(label, { selector: "dt" })
  return term.nextElementSibling as HTMLElement
}

afterEach(() => {
  vi.clearAllMocks()
})

describe("ImportDetailsHeader", () => {
  it("shows the filename, job ID and status", () => {
    render(<ImportDetailsHeader job={getJob("IMP-0011")} />)

    expect(
      screen.getByRole("heading", { level: 2, name: "products.csv" })
    ).toBeInTheDocument()
    expect(screen.getByText("IMP-0011")).toBeInTheDocument()
    expect(screen.getByText("Failed")).toBeInTheDocument()
  })

  it("offers both downloads when rows failed", () => {
    render(<ImportDetailsHeader job={getJob("IMP-0011")} />)

    expect(
      screen.getByRole("button", { name: "Download Original File" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Download Error Report" })
    ).toBeInTheDocument()
  })

  it("has no error report to download when nothing failed", () => {
    render(<ImportDetailsHeader job={getJob("IMP-0010")} />)

    expect(
      screen.getByRole("button", { name: "Download Original File" })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Download Error Report" })
    ).toBeNull()
  })

  it("does not pretend to download", async () => {
    render(<ImportDetailsHeader job={getJob("IMP-0011")} />)

    await user.click(screen.getByRole("button", { name: "Download Original File" }))

    expect(toast.info).toHaveBeenCalledWith(
      "Not available yet",
      expect.objectContaining({ description: expect.any(String) })
    )
  })
})

describe("ImportProgressCard", () => {
  it("shows the progress, status and row counts of a finished job", () => {
    render(<ImportProgressCard job={getJob("IMP-0011")} />)

    expect(
      screen.getByRole("progressbar", { name: "Progress" })
    ).toHaveAttribute("aria-valuenow", "100")
    expect(screen.getByText("100%")).toBeInTheDocument()
    expect(within(getValue("Status")).getByText("Failed")).toBeInTheDocument()
    expect(getValue("Total Rows")).toHaveTextContent("450")
    expect(getValue("Successful Rows")).toHaveTextContent("445")
    expect(getValue("Failed Rows")).toHaveTextContent("5")
  })

  it("shows partial progress while a job is processing", () => {
    render(<ImportProgressCard job={getJob("IMP-0012")} />)

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "57")
    expect(within(getValue("Status")).getByText("Processing")).toBeInTheDocument()
  })

  it("shows no progress for a queued job", () => {
    render(<ImportProgressCard job={getJob("IMP-0014")} />)

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0")
    expect(getValue("Successful Rows")).toHaveTextContent("0")
  })
})

describe("ImportJobInfo", () => {
  it("shows the filename, job ID, status and duration", () => {
    render(<ImportJobInfo job={getJob("IMP-0011")} />)

    expect(getValue("Filename")).toHaveTextContent("products.csv")
    expect(getValue("Job ID")).toHaveTextContent("IMP-0011")
    expect(within(getValue("Status")).getByText("Failed")).toBeInTheDocument()
    expect(getValue("Duration")).toHaveTextContent("4m")
  })

  it("includes seconds when the duration has them", () => {
    render(<ImportJobInfo job={getJob("IMP-0010")} />)

    expect(getValue("Duration")).toHaveTextContent("6m 12s")
  })

  it("does not invent a duration for a job that has not finished", () => {
    const { unmount } = render(<ImportJobInfo job={getJob("IMP-0012")} />)
    expect(getValue("Duration")).toHaveTextContent("In progress")
    unmount()

    render(<ImportJobInfo job={getJob("IMP-0014")} />)
    expect(getValue("Duration")).toHaveTextContent("Not started")
  })
})

describe("ImportTimeline", () => {
  function renderTimeline(jobId: string) {
    render(<ImportTimeline events={getImportTimeline(getJob(jobId))} />)
    return screen.getAllByRole("listitem")
  }

  it("lists created, started and completed with their timestamps", () => {
    const [created, started, completed] = renderTimeline("IMP-0010")

    expect(created).toHaveTextContent("Created")
    expect(created).toHaveTextContent("Oct 5, 2026, 4:02 PM UTC")
    expect(started).toHaveTextContent("Started Processing")
    expect(started).toHaveTextContent("Oct 5, 2026, 4:03 PM UTC")
    expect(completed).toHaveTextContent("Completed")
    expect(completed).toHaveTextContent("Oct 5, 2026, 4:09 PM UTC")
  })

  it("ends a failed job with a Failed step", () => {
    const steps = renderTimeline("IMP-0011")

    expect(steps[2]).toHaveTextContent("Failed")
    expect(steps[2]).toHaveTextContent("Oct 6, 2026, 10:15 AM UTC")
    expect(screen.queryByText("Completed")).toBeNull()
  })

  it("marks the steps a job has not reached as pending", () => {
    const steps = renderTimeline("IMP-0014")

    expect(steps[0]).not.toHaveTextContent("Pending")
    expect(steps[1]).toHaveTextContent("Pending")
    expect(steps[2]).toHaveTextContent("Pending")
  })
})

describe("ImportFailedRows", () => {
  function renderRows(jobId = "IMP-0011") {
    render(<ImportFailedRows rows={getMockImportFailedRows(jobId)} />)
  }

  it("titles the section with the number of failed rows", () => {
    renderRows()

    expect(
      screen.getByRole("heading", { level: 3, name: "Failed Rows (5)" })
    ).toBeInTheDocument()
  })

  it("is a table with the row number, SKU, product name and error", () => {
    renderRows()

    expect(
      screen.getAllByRole("columnheader").map((header) => header.textContent)
    ).toEqual(["Row #", "SKU", "Product Name", "Error"])
    expect(screen.getAllByRole("row")).toHaveLength(6)
    expect(screen.getByRole("table")).toHaveAccessibleName(
      "Rows that could not be imported, with the reason for each"
    )
  })

  it("lets keyboard users scroll a table that is wider than the screen", () => {
    renderRows()

    expect(
      screen.getByRole("region", { name: "Failed Rows (5)" })
    ).toHaveAttribute("tabindex", "0")
  })

  it("shows each failed row", () => {
    renderRows()
    const row = within(screen.getByRole("row", { name: /^14 / }))

    expect(row.getByText("AUD ANC 500")).toBeInTheDocument()
    expect(
      row.getByText("Aurora Wireless Noise-Cancelling Headphones")
    ).toBeInTheDocument()
    expect(
      row.getByText("Invalid SKU format: a SKU can't contain spaces.")
    ).toBeInTheDocument()
  })

  it("shows a long error in full", () => {
    renderRows()

    expect(
      screen.getByText(
        "Unknown category “Garden & Patio Furniture”. Use one of: Accessories, Electronics, Furniture, Home & Kitchen, Office Supplies, Sports & Outdoors."
      )
    ).toBeInTheDocument()
  })

  it("says when a row has no SKU", () => {
    renderRows("IMP-0008")

    expect(screen.getByText("Missing")).toBeInTheDocument()
  })

  it("offers Export Errors and Retry Failed without pretending they ran", async () => {
    renderRows()

    await user.click(screen.getByRole("button", { name: "Export Errors" }))
    await user.click(screen.getByRole("button", { name: "Retry Failed" }))

    expect(toast.info).toHaveBeenCalledTimes(2)
  })
})
