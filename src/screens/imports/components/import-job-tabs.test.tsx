import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"

import { mockImportJobs } from "@/lib/imports/import.mock-data"
import { ImportJobTabs } from "@/screens/imports/components/import-job-tabs"

vi.mock("sonner", () => ({ toast: { info: vi.fn() } }))

const user = userEvent.setup()

function renderTabs(jobs = mockImportJobs) {
  return render(<ImportJobTabs jobs={jobs} />)
}

async function openTab(name: string) {
  await user.click(screen.getByRole("tab", { name }))
  return screen.getByRole("tabpanel", { name })
}

afterEach(() => {
  vi.clearAllMocks()
})

describe("ImportJobTabs", () => {
  it("shows a tab per status with its job count", () => {
    renderTabs()

    expect(
      screen.getAllByRole("tab").map((tab) => tab.textContent)
    ).toEqual([
      "Processing (1)",
      "Queued (2)",
      "Completed (2)",
      "Failed (2)",
    ])
  })

  it("starts on Processing and switches between tabs", async () => {
    renderTabs()

    expect(screen.getByRole("tab", { name: "Processing (1)" })).toHaveAttribute(
      "aria-selected",
      "true"
    )
    expect(screen.getByText("products_batch.csv")).toBeInTheDocument()
    expect(screen.queryByText("accessories_restock.csv")).toBeNull()

    await user.click(screen.getByRole("tab", { name: "Queued (2)" }))

    expect(screen.getByText("accessories_restock.csv")).toBeInTheDocument()
    expect(screen.queryByText("products_batch.csv")).toBeNull()
  })

  it("counts only the jobs it was given", () => {
    renderTabs(mockImportJobs.filter((job) => job.status === "completed"))

    expect(
      screen.getAllByRole("tab").map((tab) => tab.textContent)
    ).toEqual([
      "Processing (0)",
      "Queued (0)",
      "Completed (2)",
      "Failed (0)",
    ])
  })
})

describe("processing jobs", () => {
  it("shows the filename, status, job ID, rows processed and progress", () => {
    renderTabs()
    const panel = screen.getByRole("tabpanel", { name: "Processing (1)" })

    expect(within(panel).getByText("products_batch.csv")).toBeInTheDocument()
    expect(within(panel).getByText("Processing")).toBeInTheDocument()
    expect(within(panel).getByText("IMP-0012")).toBeInTheDocument()
    expect(within(panel).getByText("287 of 500 rows processed")).toBeInTheDocument()
    expect(within(panel).getByText("57%")).toBeInTheDocument()
  })

  it("exposes the progress to assistive technology", () => {
    renderTabs()

    const progress = screen.getByRole("progressbar", {
      name: "287 of 500 rows processed",
    })
    expect(progress).toHaveAttribute("aria-valuenow", "57")
    expect(progress).toHaveAttribute("aria-valuemin", "0")
    expect(progress).toHaveAttribute("aria-valuemax", "100")
  })

  it("links View Details to the job", () => {
    renderTabs()

    expect(
      screen.getByRole("link", { name: "View Details for products_batch.csv" })
    ).toHaveAttribute("href", "/dashboard/imports/IMP-0012")
  })
})

describe("queued jobs", () => {
  it("shows the filename, status, job ID, total rows and when it was created", async () => {
    renderTabs()
    const panel = await openTab("Queued (2)")

    expect(within(panel).getAllByText("Queued")).toHaveLength(2)
    expect(within(panel).getByText("accessories_restock.csv")).toBeInTheDocument()
    expect(within(panel).getByText("IMP-0014")).toBeInTheDocument()
    expect(within(panel).getByText("340")).toBeInTheDocument()
    expect(
      within(panel).getByText("Oct 6, 2026, 10:24 AM UTC")
    ).toBeInTheDocument()
  })

  it("keeps a very long filename readable", async () => {
    renderTabs()
    const panel = await openTab("Queued (2)")

    expect(
      within(panel).getByRole("heading", {
        name: "office_supplies_q4_price_update_final_reviewed.csv",
      })
    ).toBeInTheDocument()
  })

  it("offers a distinctly named Cancel per job, without pretending to cancel", async () => {
    renderTabs()
    const panel = await openTab("Queued (2)")

    const cancel = within(panel).getByRole("button", {
      name: "Cancel import accessories_restock.csv",
    })
    expect(
      within(panel).getByRole("button", {
        name: "Cancel import office_supplies_q4_price_update_final_reviewed.csv",
      })
    ).toBeInTheDocument()

    await user.click(cancel)

    expect(toast.info).toHaveBeenCalledWith(
      "Not available yet",
      expect.objectContaining({ description: expect.any(String) })
    )
    expect(within(panel).getByText("accessories_restock.csv")).toBeInTheDocument()
  })
})

describe("completed jobs", () => {
  it("shows the rows imported, the total and when it completed", async () => {
    renderTabs()
    const panel = await openTab("Completed (2)")
    const job = within(
      within(panel).getByRole("heading", { name: "new_arrivals_october.csv" })
        .closest("li")!
    )

    expect(job.getByText("Completed", { selector: "span" })).toBeInTheDocument()
    expect(job.getByText("Successful Rows").nextElementSibling).toHaveTextContent("820")
    expect(job.getByText("Total Rows").nextElementSibling).toHaveTextContent("820")
    expect(job.getByText("Oct 5, 2026, 4:09 PM UTC")).toBeInTheDocument()
    expect(job.queryByText("Failed Rows")).toBeNull()
  })

  it("links View Report to the job details", async () => {
    renderTabs()
    await openTab("Completed (2)")

    expect(
      screen.getByRole("link", { name: "View Report for new_arrivals_october.csv" })
    ).toHaveAttribute("href", "/dashboard/imports/IMP-0010")
  })
})

describe("failed jobs", () => {
  async function openFailedJob(filename: string) {
    renderTabs()
    const panel = await openTab("Failed (2)")
    return within(
      within(panel).getByRole("heading", { name: filename }).closest("li")!
    )
  }

  it("shows the imported, failed and total rows and when it completed", async () => {
    const job = await openFailedJob("products.csv")

    expect(job.getByText("Successful Rows").nextElementSibling).toHaveTextContent("445")
    expect(job.getByText("Failed Rows").nextElementSibling).toHaveTextContent("5")
    expect(job.getByText("Total Rows").nextElementSibling).toHaveTextContent("450")
    expect(job.getByText("Oct 6, 2026, 10:15 AM UTC")).toBeInTheDocument()
  })

  it("shows a few sample errors and how many more there are", async () => {
    const job = await openFailedJob("products.csv")

    expect(job.getByText("Sample errors")).toBeInTheDocument()
    expect(job.getByText("Row 14")).toBeInTheDocument()
    expect(
      job.getByText("Invalid SKU format: a SKU can't contain spaces.")
    ).toBeInTheDocument()
    expect(
      job.getByText("Required price missing: Selling Price is empty.")
    ).toBeInTheDocument()
    expect(job.queryByText("Row 203")).toBeNull()
    expect(job.getByText(/and 2 more/)).toBeInTheDocument()
  })

  it("does not mention more errors when every one is shown", async () => {
    const job = await openFailedJob("supplier_feed_q3.csv")

    expect(job.getAllByText(/^Row \d+$/)).toHaveLength(3)
    expect(job.queryByText(/more\./)).toBeNull()
  })

  it("offers Error Report, Retry and View Details", async () => {
    const job = await openFailedJob("products.csv")

    expect(
      job.getByRole("button", { name: "Download error report for products.csv" })
    ).toBeInTheDocument()
    expect(
      job.getByRole("button", { name: "Retry import products.csv" })
    ).toBeInTheDocument()
    expect(
      job.getByRole("link", { name: "View Details for products.csv" })
    ).toHaveAttribute("href", "/dashboard/imports/IMP-0011")
  })

  it("does not pretend to retry", async () => {
    const job = await openFailedJob("products.csv")

    await user.click(job.getByRole("button", { name: "Retry import products.csv" }))

    expect(toast.info).toHaveBeenCalledTimes(1)
  })
})

describe("empty states", () => {
  it.each([
    ["Processing (0)", "No imports currently processing"],
    ["Queued (0)", "No imports waiting in the queue"],
    ["Completed (0)", "No completed imports yet"],
    ["Failed (0)", "No failed imports"],
  ])("explains an empty %s tab", async (tabName, message) => {
    renderTabs([])

    const panel = await openTab(tabName)

    expect(within(panel).getByText(message)).toBeInTheDocument()
    expect(within(panel).queryByRole("listitem")).toBeNull()
  })
})
