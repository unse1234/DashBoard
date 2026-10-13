import type {
  ImportJob,
  ImportJobDetails,
  ImportPage,
  ImportPreviewResult,
  ImportPreviewRow,
  ImportRowIssue,
  ImportRowValues,
} from "@/types/import.types"

/** A job that passed validation and waits for confirmation; override per test. */
export function createImportJob(overrides: Partial<ImportJob> = {}): ImportJob {
  return {
    id: "IMP-1001",
    filename: "spring-catalogue.csv",
    status: "ready",
    initiatedBy: { name: "Ada Admin", isCurrentUser: true },
    totalRows: 3,
    validRows: 3,
    invalidRows: 0,
    importedRows: 0,
    createdAt: "2026-10-12T10:00:00Z",
    startedAt: null,
    completedAt: null,
    previewExpiresAt: "2026-10-12T10:15:00Z",
    errorsExpiresAt: "2026-10-19T10:00:00Z",
    retryable: false,
    failureCode: null,
    failureMessage: null,
    sampleErrors: [],
    errorCount: 0,
    ...overrides,
  }
}

export function createImportDetails(
  overrides: Partial<ImportJobDetails> = {}
): ImportJobDetails {
  return {
    ...createImportJob(),
    schemaVersion: 1,
    previewHash: "a".repeat(64),
    createdProductIds: [],
    ...overrides,
  }
}

export function createRowIssue(
  overrides: Partial<ImportRowIssue> = {}
): ImportRowIssue {
  return {
    rowNumber: 3,
    field: "price",
    code: "INVALID_MONEY",
    message: "Use an amount from 0 to 1000000 with at most two decimals.",
    ...overrides,
  }
}

export function createPreviewRow(
  rowNumber: number,
  values: Partial<ImportRowValues> = {},
  issues: ImportRowIssue[] = []
): ImportPreviewRow {
  return {
    rowNumber,
    values: {
      name: `Mug ${rowNumber}`,
      sku: `MUG-${rowNumber}`,
      category: "Home & Kitchen",
      price: "12.50",
      costPrice: "",
      stock: "5",
      status: "",
      brand: "",
      description: "",
      ...values,
    },
    issues,
  }
}

export function createPage<T>(
  items: T[],
  overrides: Partial<ImportPage<T>> = {}
): ImportPage<T> {
  return {
    items,
    page: 1,
    totalPages: 1,
    totalRecords: items.length,
    ...overrides,
  }
}

export function createPreviewResult(
  overrides: Partial<ImportPreviewResult> = {}
): ImportPreviewResult {
  const rows = [createPreviewRow(2), createPreviewRow(3), createPreviewRow(4)]

  return {
    job: createImportDetails(),
    mapping: [
      { header: "Product Name", column: "name" },
      { header: "sku", column: "sku" },
    ],
    rows: createPage(rows),
    errors: createPage<ImportRowIssue>([]),
    ...overrides,
  }
}

/** The API's spelling of a job: statuses upper-case with underscores. */
export function toApiJob<T extends ImportJob>(job: T) {
  return {
    ...job,
    status: job.status.toUpperCase().replace("-", "_"),
  }
}
