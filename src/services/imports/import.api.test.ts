import { vi } from "vitest"

import { ApiError } from "@/lib/api/api-error"
import { apiClient, attachSessionHandlers } from "@/lib/api/axios"
import {
  buildImportsSearchParams,
  confirmImport,
  downloadImportErrors,
  downloadProductTemplate,
  getImport,
  getImportErrors,
  getImportPreview,
  getImportTypes,
  listImports,
  previewImport,
  toImportStatus,
} from "@/services/imports/import.api"
import { defaultImportsQuery } from "@/screens/imports/imports.filters"
import {
  createImportDetails,
  createImportJob,
  createPreviewRow,
  createRowIssue,
  toApiJob,
} from "@/test-utils/import-fixtures"
import { mockApi } from "@/test-utils/mock-api"

let api: ReturnType<typeof mockApi>

beforeEach(() => {
  attachSessionHandlers({
    getAccessToken: () => "token-1",
    requestRefresh: vi.fn(),
    updateSession: vi.fn(),
    clearSession: vi.fn(),
  })
})

afterEach(() => {
  api?.restore()
  vi.restoreAllMocks()
})

describe("toImportStatus", () => {
  it.each([
    ["READY", "ready"],
    ["VALIDATION_FAILED", "validation-failed"],
    ["PROCESSING", "processing"],
    ["COMPLETED", "completed"],
    ["FAILED", "failed"],
    ["EXPIRED", "expired"],
  ] as const)("reads %s as %s", (apiStatus, status) => {
    expect(toImportStatus(apiStatus)).toBe(status)
  })
})

describe("buildImportsSearchParams", () => {
  it("always sends the scope, page and page size", () => {
    expect(buildImportsSearchParams(defaultImportsQuery).toString()).toBe(
      "scope=own&page=1&pageSize=10"
    )
  })

  it("sends a status filter in the API's spelling and omits 'all'", () => {
    const params = buildImportsSearchParams({
      ...defaultImportsQuery,
      scope: "all",
      status: "validation-failed",
      page: 3,
      pageSize: 50,
    })

    expect(params.get("status")).toBe("VALIDATION_FAILED")
    expect(params.get("scope")).toBe("all")
    expect(params.get("page")).toBe("3")
    expect(params.get("pageSize")).toBe("50")
    expect(buildImportsSearchParams(defaultImportsQuery).has("status")).toBe(
      false
    )
  })
})

describe("imports API calls", () => {
  it("reads the server's limits and columns", async () => {
    api = mockApi(() => ({
      data: {
        data: [
          {
            type: "PRODUCTS",
            maxRows: 250,
            maxFileBytes: 10_485_760,
            previewTtlSeconds: 900,
            columns: [{ name: "name", required: true }],
          },
        ],
      },
    }))

    const config = await getImportTypes()

    expect(config).toMatchObject({ maxRows: 250, previewTtlSeconds: 900 })
    expect(api.requests[0]).toMatchObject({
      method: "GET",
      url: "/imports/types",
    })
    expect(api.requests[0].headers.authorization).toBe("Bearer token-1")
  })

  it("lists a page of the history with the totals and per-status counts", async () => {
    api = mockApi(() => ({
      data: {
        data: [
          toApiJob(
            createImportJob({ id: "IMP-2", status: "validation-failed" })
          ),
          toApiJob(createImportJob({ id: "IMP-1", status: "completed" })),
        ],
        meta: {
          page: 1,
          pageSize: 10,
          total: 2,
          totalPages: 1,
          statusCounts: {
            READY: 0,
            VALIDATION_FAILED: 1,
            PROCESSING: 0,
            COMPLETED: 1,
            FAILED: 0,
            EXPIRED: 0,
          },
        },
      },
    }))

    const page = await listImports(defaultImportsQuery)

    expect(page.jobs.map((job) => [job.id, job.status])).toEqual([
      ["IMP-2", "validation-failed"],
      ["IMP-1", "completed"],
    ])
    expect(page.totalRecords).toBe(2)
    expect(page.statusCounts).toMatchObject({
      "validation-failed": 1,
      completed: 1,
      ready: 0,
    })
    expect(String(api.requests[0].params)).toBe("scope=own&page=1&pageSize=10")
  })

  it("reads one job, and escapes its id in the path", async () => {
    api = mockApi(() => ({
      data: toApiJob(createImportDetails({ status: "processing" })),
    }))

    const job = await getImport("IMP-1001")

    expect(job.status).toBe("processing")
    expect(api.requests[0].url).toBe("/imports/IMP-1001")
  })

  it("pages the rows and the problems of a job", async () => {
    const meta = { page: 2, pageSize: 25, total: 30, totalPages: 2 }
    api = mockApi((request) =>
      request.url.endsWith("/preview")
        ? { data: { data: [createPreviewRow(27)], meta } }
        : { data: { data: [createRowIssue({ rowNumber: 27 })], meta } }
    )

    const rows = await getImportPreview("IMP-1", 2)
    const issues = await getImportErrors("IMP-1", 2)

    expect(rows).toMatchObject({ page: 2, totalPages: 2, totalRecords: 30 })
    expect(rows.items[0].rowNumber).toBe(27)
    expect(issues.items[0].rowNumber).toBe(27)
    expect(api.requests.map((request) => request.params)).toEqual([
      { page: 2, pageSize: 25 },
      { page: 2, pageSize: 25 },
    ])
  })

  it("posts the confirmation with only the version and hash", async () => {
    api = mockApi(() => ({
      data: {
        job: toApiJob(createImportDetails({ status: "completed" })),
        processing: false,
      },
    }))

    const result = await confirmImport("IMP-1001", 1, "a".repeat(64))

    expect(result.job.status).toBe("completed")
    expect(result.processing).toBe(false)
    expect(api.requests[0]).toMatchObject({
      method: "POST",
      url: "/imports/IMP-1001/confirm",
      body: { schemaVersion: 1, previewHash: "a".repeat(64) },
    })
  })

  it("passes the API's refusal of a confirmation on as an ApiError", async () => {
    api = mockApi(() => ({
      status: 409,
      data: { statusCode: 409, message: "The catalogue changed." },
    }))

    await expect(confirmImport("IMP-1", 1, "a".repeat(64))).rejects.toEqual(
      expect.objectContaining({ status: 409 })
    )
    await expect(
      confirmImport("IMP-1", 1, "a".repeat(64))
    ).rejects.toBeInstanceOf(ApiError)
  })
})

describe("previewImport", () => {
  const apiResult = {
    job: toApiJob(createImportDetails()),
    mapping: { "Product Name": "name", sku: "sku" },
    preview: {
      data: [createPreviewRow(2)],
      meta: { page: 1, pageSize: 25, total: 1, totalPages: 1 },
    },
    errors: {
      data: [],
      meta: { page: 1, pageSize: 25, total: 0, totalPages: 0 },
    },
  }

  it("sends the file, type and request id as multipart form data", async () => {
    const post = vi
      .spyOn(apiClient, "post")
      .mockResolvedValue({ data: apiResult })
    const file = new File(["name,sku"], "products.csv", { type: "text/csv" })

    const result = await previewImport(
      file,
      "11111111-1111-4111-8111-111111111111"
    )

    const [url, body] = post.mock.calls[0]
    expect(url).toBe("/imports/preview")
    expect(body).toBeInstanceOf(FormData)
    const form = body as FormData
    expect(form.get("type")).toBe("PRODUCTS")
    expect(form.get("clientRequestId")).toBe(
      "11111111-1111-4111-8111-111111111111"
    )
    expect((form.get("file") as File).name).toBe("products.csv")
    expect(result.job.status).toBe("ready")
    expect(result.mapping).toEqual([
      { header: "Product Name", column: "name" },
      { header: "sku", column: "sku" },
    ])
    expect(result.rows.items).toHaveLength(1)
    expect(result.errors).toMatchObject({ items: [], totalRecords: 0 })
  })

  it("reports the upload as whole percents and forwards the abort signal", async () => {
    const progress: number[] = []
    const controller = new AbortController()
    const post = vi
      .spyOn(apiClient, "post")
      .mockImplementation((_url, _body, config) => {
        config?.onUploadProgress?.({ loaded: 50, total: 200 } as never)
        config?.onUploadProgress?.({ loaded: 200, total: 200 } as never)
        return Promise.resolve({ data: apiResult })
      })

    await previewImport(new File(["x"], "p.csv"), "key", {
      signal: controller.signal,
      onUploadProgress: (percent) => progress.push(percent),
    })

    expect(progress).toEqual([25, 100])
    expect(post.mock.calls[0][2]?.signal).toBe(controller.signal)
  })

  it("ignores progress events that do not know the total", async () => {
    const progress: number[] = []
    vi.spyOn(apiClient, "post").mockImplementation((_url, _body, config) => {
      config?.onUploadProgress?.({ loaded: 50 } as never)
      return Promise.resolve({ data: apiResult })
    })

    await previewImport(new File(["x"], "p.csv"), "key", {
      onUploadProgress: (percent) => progress.push(percent),
    })

    expect(progress).toEqual([])
  })
})

const BOM_BYTES = [0xef, 0xbb, 0xbf]
const decode = (bytes: number[] = []) =>
  new TextDecoder().decode(new Uint8Array(bytes))

describe("CSV downloads", () => {
  let saved: { download: string; href: string; bytes: number[] } | undefined

  beforeEach(() => {
    saved = undefined
    vi.useFakeTimers()
    URL.createObjectURL = vi.fn((blob: Blob) => {
      // Raw bytes: Blob.text() would strip the byte-order mark being tested.
      void blob.arrayBuffer().then((buffer) => {
        if (saved) saved.bytes = [...new Uint8Array(buffer)]
      })
      return "blob:csv-1"
    })
    URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      saved = { download: this.download, href: this.href, bytes: [] }
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("saves the template under a fixed name, as text, with a byte-order mark", async () => {
    api = mockApi(() => ({ data: "name,sku,category,price\n" }))

    await downloadProductTemplate()
    await vi.advanceTimersByTimeAsync(0)

    expect(api.requests[0]).toMatchObject({
      method: "GET",
      url: "/imports/templates/products",
    })
    expect(saved).toMatchObject({
      download: "products-import-v1.csv",
      href: "blob:csv-1",
    })
    expect(saved?.bytes.slice(0, 3)).toEqual(BOM_BYTES)
    expect(decode(saved?.bytes.slice(3))).toBe("name,sku,category,price\n")
  })

  it("does not add a second byte-order mark", async () => {
    api = mockApi(() => ({ data: "\uFEFFrowNumber,field,code,message\n" }))

    await downloadImportErrors("IMP-1001")
    await vi.advanceTimersByTimeAsync(0)

    expect(saved?.download).toBe("IMP-1001-errors.csv")
    expect(saved?.bytes.slice(0, 3)).toEqual(BOM_BYTES)
    expect(decode(saved?.bytes.slice(3))).toBe("rowNumber,field,code,message\n")
    expect(api.requests[0]).toMatchObject({
      url: "/imports/IMP-1001/errors",
      params: { format: "csv" },
    })
  })

  it("releases the object URL shortly after the download starts", async () => {
    api = mockApi(() => ({ data: "a,b\n" }))

    await downloadProductTemplate()
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1000)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:csv-1")
  })

  it("surfaces the API's message when the report is gone", async () => {
    api = mockApi(() => ({
      status: 410,
      data: JSON.stringify({
        statusCode: 410,
        message: "The error report has expired.",
      }),
    }))

    await expect(downloadImportErrors("IMP-1")).rejects.toMatchObject({
      status: 410,
      message: "The error report has expired.",
    })
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })
})
