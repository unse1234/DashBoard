import {
  canConfirmImport,
  getImportDurationSeconds,
  getImportTimeline,
  isPreviewHeld,
  isReportAvailable,
} from "@/utils/import.utils"
import { createImportDetails } from "@/test-utils/import-fixtures"

const before = Date.parse("2026-10-12T10:10:00Z")
const after = Date.parse("2026-10-12T10:16:00Z")

describe("isPreviewHeld", () => {
  it.each(["ready", "validation-failed", "failed"] as const)(
    "holds the rows of a %s job until its preview expires",
    (status) => {
      const job = createImportDetails({ status })

      expect(isPreviewHeld(job, before)).toBe(true)
      expect(isPreviewHeld(job, after)).toBe(false)
    }
  )

  it.each(["processing", "completed", "expired"] as const)(
    "never holds the rows of a %s job",
    (status) => {
      expect(isPreviewHeld(createImportDetails({ status }), before)).toBe(false)
    }
  )
})

describe("canConfirmImport", () => {
  it("allows the owner of a ready preview while it lasts", () => {
    const job = createImportDetails({ status: "ready" })

    expect(canConfirmImport(job, before)).toBe(true)
    expect(canConfirmImport(job, after)).toBe(false)
  })

  it("allows a retry only for a failure the API marked retryable", () => {
    expect(
      canConfirmImport(
        createImportDetails({ status: "failed", retryable: true }),
        before
      )
    ).toBe(true)
    expect(
      canConfirmImport(
        createImportDetails({ status: "failed", retryable: false }),
        before
      )
    ).toBe(false)
  })

  it("needs the hash, which only the owner receives", () => {
    const job = createImportDetails({ status: "ready", previewHash: null })

    expect(canConfirmImport(job, before)).toBe(false)
  })

  it.each(["validation-failed", "processing", "completed", "expired"] as const)(
    "never confirms a %s job",
    (status) => {
      expect(canConfirmImport(createImportDetails({ status }), before)).toBe(
        false
      )
    }
  )
})

describe("isReportAvailable", () => {
  it("needs problems to report and an unexpired report", () => {
    const job = { errorCount: 2, errorsExpiresAt: "2026-10-19T10:00:00Z" }

    expect(isReportAvailable(job, before)).toBe(true)
    expect(isReportAvailable({ ...job, errorCount: 0 }, before)).toBe(false)
    expect(isReportAvailable(job, Date.parse("2026-10-20T00:00:00Z"))).toBe(
      false
    )
  })
})

describe("getImportDurationSeconds", () => {
  it("is the time from start to finish", () => {
    expect(
      getImportDurationSeconds({
        startedAt: "2026-10-12T10:00:00Z",
        completedAt: "2026-10-12T10:00:07Z",
      })
    ).toBe(7)
  })

  it("is null until the job has both started and finished", () => {
    expect(
      getImportDurationSeconds({
        startedAt: "2026-10-12T10:00:00Z",
        completedAt: null,
      })
    ).toBeNull()
    expect(
      getImportDurationSeconds({ startedAt: null, completedAt: null })
    ).toBeNull()
  })
})

describe("getImportTimeline", () => {
  it("shows the validation and the wait for confirmation of a ready job", () => {
    const events = getImportTimeline(createImportDetails({ status: "ready" }))

    expect(events.map(({ id, state }) => [id, state])).toEqual([
      ["created", "done"],
      ["awaiting", "pending"],
    ])
  })

  it("adds only the steps a completed job went through", () => {
    const events = getImportTimeline(
      createImportDetails({
        status: "completed",
        startedAt: "2026-10-12T10:01:00Z",
        completedAt: "2026-10-12T10:01:04Z",
      })
    )

    expect(events.map(({ id, label, state }) => [id, label, state])).toEqual([
      ["created", "File validated", "done"],
      ["started", "Started creating products", "done"],
      ["finished", "Completed", "done"],
    ])
  })

  it("marks the end of a failed job as failed", () => {
    const events = getImportTimeline(
      createImportDetails({
        status: "failed",
        startedAt: "2026-10-12T10:01:00Z",
        completedAt: "2026-10-12T10:01:04Z",
      })
    )

    expect(events.at(-1)).toMatchObject({ label: "Failed", state: "failed" })
  })

  it("has only the validation for a job that never ran", () => {
    expect(
      getImportTimeline(createImportDetails({ status: "validation-failed" }))
    ).toHaveLength(1)
    expect(
      getImportTimeline(createImportDetails({ status: "expired" }))
    ).toHaveLength(1)
  })
})
