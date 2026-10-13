import { act, renderHook } from "@testing-library/react"
import { vi } from "vitest"

import { importKeys } from "@/hooks/imports/import.keys"
import {
  useConfirmImportMutation,
  usePreviewImportMutation,
} from "@/hooks/imports/import.mutations"
import { productKeys } from "@/hooks/products/product.keys"
import { ApiError } from "@/lib/api/api-error"
import { confirmImport, previewImport } from "@/services/imports/import.api"
import {
  createImportDetails,
  createPage,
  createPreviewResult,
  createPreviewRow,
  createRowIssue,
} from "@/test-utils/import-fixtures"
import { createQueryWrapper, createTestQueryClient } from "@/test-utils/render"

vi.mock("@/services/imports/import.api")

const hash = "a".repeat(64)
const file = new File(["name,sku"], "products.csv", { type: "text/csv" })

beforeEach(() => {
  vi.resetAllMocks()
})

/** The query keys passed to `invalidateQueries`, in call order. */
function invalidatedKeys(spy: { mock: { calls: unknown[][] } }) {
  return spy.mock.calls.map(
    ([filters]) => (filters as { queryKey?: unknown } | undefined)?.queryKey
  )
}

describe("usePreviewImportMutation", () => {
  it("caches the job and its first pages so the review needs no second request", async () => {
    const result = createPreviewResult({
      job: createImportDetails({ id: "IMP-1500", status: "validation-failed" }),
      rows: createPage([createPreviewRow(2)]),
      errors: createPage([createRowIssue({ rowNumber: 2 })]),
    })
    vi.mocked(previewImport).mockResolvedValue(result)
    const queryClient = createTestQueryClient()
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")
    const { result: hook } = renderHook(() => usePreviewImportMutation(), {
      wrapper: createQueryWrapper(queryClient),
    })

    await act(() =>
      hook.current.mutateAsync({ file, clientRequestId: "key-1" })
    )

    expect(queryClient.getQueryData(importKeys.detail("IMP-1500"))).toEqual(
      result.job
    )
    expect(queryClient.getQueryData(importKeys.preview("IMP-1500", 1))).toEqual(
      result.rows
    )
    expect(queryClient.getQueryData(importKeys.errors("IMP-1500", 1))).toEqual(
      result.errors
    )
    expect(invalidatedKeys(invalidate)).toContainEqual(importKeys.lists())
  })

  it("hands the request id, abort signal and progress callback to the service", async () => {
    vi.mocked(previewImport).mockResolvedValue(createPreviewResult())
    const controller = new AbortController()
    const onUploadProgress = vi.fn()
    const { result: hook } = renderHook(() => usePreviewImportMutation(), {
      wrapper: createQueryWrapper(),
    })

    await act(() =>
      hook.current.mutateAsync({
        file,
        clientRequestId: "key-1",
        signal: controller.signal,
        onUploadProgress,
      })
    )

    expect(previewImport).toHaveBeenCalledWith(file, "key-1", {
      signal: controller.signal,
      onUploadProgress,
    })
  })

  it("caches nothing when validation fails", async () => {
    vi.mocked(previewImport).mockRejectedValue(
      new ApiError(415, ["Save the file as CSV UTF-8."])
    )
    const queryClient = createTestQueryClient()
    const { result: hook } = renderHook(() => usePreviewImportMutation(), {
      wrapper: createQueryWrapper(queryClient),
    })

    await act(async () => {
      await expect(
        hook.current.mutateAsync({ file, clientRequestId: "key-1" })
      ).rejects.toBeInstanceOf(ApiError)
    })

    expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
  })
})

describe("useConfirmImportMutation", () => {
  const variables = {
    importId: "IMP-1001",
    schemaVersion: 1,
    previewHash: hash,
  }

  it("replaces the job, refreshes the lists and drops the held rows once completed", async () => {
    const completed = createImportDetails({
      status: "completed",
      importedRows: 3,
      previewHash: null,
    })
    vi.mocked(confirmImport).mockResolvedValue({
      job: completed,
      processing: false,
    })
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(
      importKeys.preview("IMP-1001", 1),
      createPage([createPreviewRow(2)])
    )
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")
    const { result: hook } = renderHook(() => useConfirmImportMutation(), {
      wrapper: createQueryWrapper(queryClient),
    })

    await act(() => hook.current.mutateAsync(variables))

    expect(confirmImport).toHaveBeenCalledWith("IMP-1001", 1, hash)
    expect(queryClient.getQueryData(importKeys.detail("IMP-1001"))).toEqual(
      completed
    )
    expect(queryClient.getQueryData(importKeys.preview("IMP-1001", 1))).toBe(
      undefined
    )
    const keys = invalidatedKeys(invalidate)
    expect(keys).toContainEqual(productKeys.lists())
    expect(keys).toContainEqual(importKeys.lists())
  })

  it("leaves the products alone while another request is still creating them", async () => {
    vi.mocked(confirmImport).mockResolvedValue({
      job: createImportDetails({ status: "processing" }),
      processing: true,
    })
    const queryClient = createTestQueryClient()
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")
    const { result: hook } = renderHook(() => useConfirmImportMutation(), {
      wrapper: createQueryWrapper(queryClient),
    })

    await act(() => hook.current.mutateAsync(variables))

    expect(
      queryClient.getQueryData(importKeys.detail("IMP-1001"))
    ).toMatchObject({ status: "processing" })
    expect(invalidatedKeys(invalidate)).not.toContainEqual(productKeys.lists())
  })

  it("changes nothing when the API refuses", async () => {
    vi.mocked(confirmImport).mockRejectedValue(
      new ApiError(409, ["The catalogue changed. Validate the CSV again."])
    )
    const queryClient = createTestQueryClient()
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")
    const { result: hook } = renderHook(() => useConfirmImportMutation(), {
      wrapper: createQueryWrapper(queryClient),
    })

    await act(async () => {
      await expect(hook.current.mutateAsync(variables)).rejects.toMatchObject({
        status: 409,
      })
    })

    expect(invalidate).not.toHaveBeenCalled()
  })
})
