import {
  getMockImportFailedRows,
  getMockImportJobById,
  mockImportJobs,
} from "@/lib/imports/import.mock-data"
import {
  getImportDurationSeconds,
  getImportProgress,
  getImportTimeline,
  groupImportsByStatus,
} from "@/lib/imports/import.utils"

describe("getImportProgress", () => {
  it("is the whole percent of rows handled", () => {
    expect(getImportProgress({ processedRows: 287, totalRows: 500 })).toBe(57)
  })

  it("rounds down so it only reaches 100 once every row is handled", () => {
    expect(getImportProgress({ processedRows: 499, totalRows: 500 })).toBe(99)
    expect(getImportProgress({ processedRows: 500, totalRows: 500 })).toBe(100)
  })

  it("is zero before anything is processed or without rows", () => {
    expect(getImportProgress({ processedRows: 0, totalRows: 340 })).toBe(0)
    expect(getImportProgress({ processedRows: 0, totalRows: 0 })).toBe(0)
  })

  it("stays within 0 to 100", () => {
    expect(getImportProgress({ processedRows: 600, totalRows: 500 })).toBe(100)
  })
})

describe("getImportDurationSeconds", () => {
  it("is the time between starting and finishing", () => {
    expect(
      getImportDurationSeconds({
        startedAt: "2026-10-06T10:11:00Z",
        completedAt: "2026-10-06T10:15:00Z",
      })
    ).toBe(240)
  })

  it("is null until the job has finished", () => {
    expect(
      getImportDurationSeconds({
        startedAt: "2026-10-06T10:19:00Z",
        completedAt: null,
      })
    ).toBeNull()
    expect(
      getImportDurationSeconds({ startedAt: null, completedAt: null })
    ).toBeNull()
  })
})

describe("groupImportsByStatus", () => {
  it("puts every job in its status group and keeps the order", () => {
    const groups = groupImportsByStatus(mockImportJobs)

    expect(groups.processing.map((job) => job.id)).toEqual(["IMP-0012"])
    expect(groups.queued.map((job) => job.id)).toEqual(["IMP-0014", "IMP-0013"])
    expect(groups.completed.map((job) => job.id)).toEqual([
      "IMP-0010",
      "IMP-0009",
    ])
    expect(groups.failed.map((job) => job.id)).toEqual(["IMP-0011", "IMP-0008"])
  })

  it("includes a group for a status without jobs", () => {
    expect(groupImportsByStatus([])).toEqual({
      processing: [],
      queued: [],
      completed: [],
      failed: [],
    })
  })
})

describe("getImportTimeline", () => {
  function getTimeline(jobId: string) {
    return getImportTimeline(getMockImportJobById(jobId)!)
  }

  it("shows a completed job as done at every step", () => {
    expect(getTimeline("IMP-0010")).toEqual([
      {
        id: "created",
        label: "Created",
        timestamp: "2026-10-05T16:02:00Z",
        state: "done",
      },
      {
        id: "started",
        label: "Started Processing",
        timestamp: "2026-10-05T16:03:05Z",
        state: "done",
      },
      {
        id: "finished",
        label: "Completed",
        timestamp: "2026-10-05T16:09:17Z",
        state: "done",
      },
    ])
  })

  it("ends a failed job with a failed step", () => {
    const finished = getTimeline("IMP-0011")[2]

    expect(finished).toMatchObject({ label: "Failed", state: "failed" })
    expect(finished.timestamp).toBe("2026-10-06T10:15:00Z")
  })

  it("leaves the last step pending while a job is processing", () => {
    expect(getTimeline("IMP-0012").map((event) => event.state)).toEqual([
      "done",
      "done",
      "pending",
    ])
  })

  it("leaves the later steps pending while a job is queued", () => {
    expect(getTimeline("IMP-0014").map((event) => event.state)).toEqual([
      "done",
      "pending",
      "pending",
    ])
  })
})

describe("import mock data", () => {
  it("has internally consistent row counts", () => {
    for (const job of mockImportJobs) {
      expect(job.successfulRows + job.failedRows, job.id).toBeLessThanOrEqual(
        job.processedRows
      )
      expect(job.processedRows, job.id).toBeLessThanOrEqual(job.totalRows)
    }
  })

  it("has every failed row of a job, and a short sample on the job", () => {
    for (const job of mockImportJobs) {
      const failedRows = getMockImportFailedRows(job.id)

      expect(failedRows, job.id).toHaveLength(job.failedRows)
      expect(job.sampleErrors, job.id).toEqual(failedRows.slice(0, 3))
    }
  })

  it("covers all four statuses", () => {
    const groups = groupImportsByStatus(mockImportJobs)

    for (const jobs of Object.values(groups)) {
      expect(jobs.length).toBeGreaterThan(0)
    }
  })
})
