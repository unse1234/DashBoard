import { act, renderHook, waitFor } from "@testing-library/react"
import { vi } from "vitest"

import { useAuth } from "@/hooks/auth/use-auth"
import { importKeys } from "@/hooks/imports/import.keys"
import {
  shouldPollImport,
  useImportErrorsQuery,
  useImportPreviewQuery,
  useImportQuery,
  useImportsQuery,
  useImportTypesQuery,
} from "@/hooks/imports/import.queries"
import { productKeys } from "@/hooks/products/product.keys"
import { catalogKeys } from "@/hooks/storefront/catalog.keys"
import { defaultImportsQuery } from "@/screens/imports/imports.filters"
import {
  getImport,
  getImportErrors,
  getImportPreview,
  getImportTypes,
  listImports,
} from "@/services/imports/import.api"
import { createAuthUser } from "@/test-utils/auth-fixtures"
import {
  createImportDetails,
  createImportJob,
  createPage,
  createPreviewRow,
} from "@/test-utils/import-fixtures"
import { createQueryWrapper, createTestQueryClient } from "@/test-utils/render"

vi.mock("@/services/imports/import.api")
vi.mock("@/hooks/auth/use-auth")

function signIn(status: "authenticated" | "loading" = "authenticated") {
  vi.mocked(useAuth).mockReturnValue(
    status === "authenticated"
      ? { status, user: createAuthUser() }
      : { status, user: null }
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  signIn()
})

afterEach(() => {
  vi.useRealTimers()
})

describe("shouldPollImport", () => {
  const now = Date.parse("2026-10-12T10:01:00Z")

  it("polls a job that is being created", () => {
    expect(
      shouldPollImport(
        { status: "processing", startedAt: "2026-10-12T10:00:30Z" },
        now
      )
    ).toBe(true)
    expect(
      shouldPollImport({ status: "processing", startedAt: null }, now)
    ).toBe(true)
  })

  it("gives up once the attempt is older than the polling window", () => {
    expect(
      shouldPollImport(
        { status: "processing", startedAt: "2026-10-12T09:58:00Z" },
        now
      )
    ).toBe(false)
  })

  it.each([
    "ready",
    "validation-failed",
    "completed",
    "failed",
    "expired",
  ] as const)("does not poll a %s job", (status) => {
    expect(shouldPollImport({ status, startedAt: null }, now)).toBe(false)
  })

  it("does not poll before the job has loaded", () => {
    expect(shouldPollImport(undefined, now)).toBe(false)
  })
})

describe("import queries", () => {
  it("wait for the session before reading anything", () => {
    signIn("loading")

    renderHook(
      () => ({
        types: useImportTypesQuery(),
        list: useImportsQuery(defaultImportsQuery),
        job: useImportQuery("IMP-1001"),
        rows: useImportPreviewQuery("IMP-1001", 1, true),
        issues: useImportErrorsQuery("IMP-1001", 1, true),
      }),
      { wrapper: createQueryWrapper() }
    )

    expect(getImportTypes).not.toHaveBeenCalled()
    expect(listImports).not.toHaveBeenCalled()
    expect(getImport).not.toHaveBeenCalled()
    expect(getImportPreview).not.toHaveBeenCalled()
    expect(getImportErrors).not.toHaveBeenCalled()
  })

  it("lists the history for the query it was given", async () => {
    vi.mocked(listImports).mockResolvedValue({
      jobs: [createImportJob()],
      totalRecords: 1,
      statusCounts: {} as never,
    })
    const query = { ...defaultImportsQuery, status: "completed" as const }

    const { result } = renderHook(() => useImportsQuery(query), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(listImports).toHaveBeenCalledWith(query, expect.any(AbortSignal))
  })

  it("does not fetch rows or problems the job no longer holds", () => {
    renderHook(
      () => ({
        rows: useImportPreviewQuery("IMP-1001", 1, false),
        issues: useImportErrorsQuery("IMP-1001", 1, false),
      }),
      { wrapper: createQueryWrapper() }
    )

    expect(getImportPreview).not.toHaveBeenCalled()
    expect(getImportErrors).not.toHaveBeenCalled()
  })

  it("fetches the page of rows asked for", async () => {
    vi.mocked(getImportPreview).mockResolvedValue(
      createPage([createPreviewRow(27)], { page: 2, totalPages: 2 })
    )

    const { result } = renderHook(
      () => useImportPreviewQuery("IMP-1001", 2, true),
      { wrapper: createQueryWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getImportPreview).toHaveBeenCalledWith(
      "IMP-1001",
      2,
      expect.any(AbortSignal)
    )
  })
})

/**
 * Advances fake time, then a little more: React Query hands a finished fetch to
 * its observers on a later timer turn than the one that started it.
 */
async function tick(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
    await vi.advanceTimersByTimeAsync(100)
  })
}

describe("useImportQuery", () => {
  it("reads a job that is being created every two seconds until it finishes", async () => {
    vi.useFakeTimers()
    vi.mocked(getImport)
      .mockResolvedValueOnce(
        createImportDetails({
          status: "processing",
          startedAt: new Date().toISOString(),
        })
      )
      .mockResolvedValue(
        createImportDetails({ status: "completed", importedRows: 3 })
      )

    const { result } = renderHook(() => useImportQuery("IMP-1001"), {
      wrapper: createQueryWrapper(),
    })
    await tick(0)
    expect(result.current.data?.status).toBe("processing")
    expect(getImport).toHaveBeenCalledTimes(1)

    await tick(2000)
    expect(getImport).toHaveBeenCalledTimes(2)
    expect(result.current.data?.status).toBe("completed")

    // Finished: nothing more is asked.
    await tick(20_000)
    expect(getImport).toHaveBeenCalledTimes(2)
  })

  it("stops polling when a read fails", async () => {
    vi.useFakeTimers()
    vi.mocked(getImport)
      .mockResolvedValueOnce(
        createImportDetails({
          status: "processing",
          startedAt: new Date().toISOString(),
        })
      )
      .mockRejectedValue(new Error("offline"))

    const { result } = renderHook(() => useImportQuery("IMP-1001"), {
      wrapper: createQueryWrapper(),
    })
    await tick(0)
    await tick(2000)
    expect(getImport).toHaveBeenCalledTimes(2)
    expect(result.current.isError).toBe(true)

    await tick(20_000)
    expect(getImport).toHaveBeenCalledTimes(2)
  })

  it("refreshes the product and import lists when it finds the job newly completed", async () => {
    const queryClient = createTestQueryClient()
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")
    queryClient.setQueryData(
      importKeys.detail("IMP-1001"),
      createImportDetails({ status: "processing" })
    )
    vi.mocked(getImport).mockResolvedValue(
      createImportDetails({ status: "completed", importedRows: 3 })
    )

    const { result } = renderHook(() => useImportQuery("IMP-1001"), {
      wrapper: createQueryWrapper(queryClient),
    })
    await act(() => result.current.refetch())

    const keys = invalidate.mock.calls.map(([filters]) => filters?.queryKey)
    expect(keys).toContainEqual(productKeys.lists())
    expect(keys).toContainEqual(catalogKeys.all)
    expect(keys).toContainEqual(importKeys.lists())
  })

  it("does not refresh anything when a completed job is merely read again", async () => {
    const queryClient = createTestQueryClient()
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")
    queryClient.setQueryData(
      importKeys.detail("IMP-1001"),
      createImportDetails({ status: "completed", importedRows: 3 })
    )
    vi.mocked(getImport).mockResolvedValue(
      createImportDetails({ status: "completed", importedRows: 3 })
    )

    const { result } = renderHook(() => useImportQuery("IMP-1001"), {
      wrapper: createQueryWrapper(queryClient),
    })
    await act(() => result.current.refetch())

    expect(invalidate).not.toHaveBeenCalled()
  })

  it("does not refresh the products for a job first seen already completed", async () => {
    const queryClient = createTestQueryClient()
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")
    vi.mocked(getImport).mockResolvedValue(
      createImportDetails({ status: "completed", importedRows: 3 })
    )

    const { result } = renderHook(() => useImportQuery("IMP-1001"), {
      wrapper: createQueryWrapper(queryClient),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidate).not.toHaveBeenCalled()
  })
})
