import type { ImportFailedRow, ImportJob } from "@/lib/imports/import.types"

// Placeholder data until the imports API exists.

const SAMPLE_ERROR_COUNT = 3

// Every row of every failed job, keyed by job ID. The job list only gets a few.
const failedRowsByJobId: Record<string, ImportFailedRow[]> = {
  "IMP-0011": [
    {
      id: "IMP-0011-row-14",
      rowNumber: 14,
      sku: "AUD ANC 500",
      productName: "Aurora Wireless Noise-Cancelling Headphones",
      error: "Invalid SKU format: a SKU can't contain spaces.",
    },
    {
      id: "IMP-0011-row-37",
      rowNumber: 37,
      sku: "HK-CIS-12",
      productName: "Pre-Seasoned Cast Iron Skillet, 12 inch",
      error: "Duplicate SKU: a product with this SKU already exists.",
    },
    {
      id: "IMP-0011-row-112",
      rowNumber: 112,
      sku: "OFF-PEN-GEL-12",
      productName: "Gel Pen Set, 12 Colours",
      error: "Required price missing: Selling Price is empty.",
    },
    {
      id: "IMP-0011-row-203",
      rowNumber: 203,
      sku: "GRD-PTO-SET-04",
      productName: "Garden & Patio Furniture Set",
      error:
        "Unknown category “Garden & Patio Furniture”. Use one of: Accessories, Electronics, Furniture, Home & Kitchen, Office Supplies, Sports & Outdoors.",
    },
    {
      id: "IMP-0011-row-341",
      rowNumber: 341,
      sku: "ELC-MON-27",
      productName: "Studio Monitor 27",
      error: "Invalid stock quantity: “12.5” is not a whole number.",
    },
  ],
  "IMP-0008": [
    {
      id: "IMP-0008-row-8",
      rowNumber: 8,
      sku: "",
      productName: "Insulated Lunch Bag",
      error: "Required SKU missing.",
    },
    {
      id: "IMP-0008-row-52",
      rowNumber: 52,
      sku: "SPT-BTL-750-GRN",
      productName: "Trail Insulated Water Bottle, 750 ml",
      error: "Duplicate SKU: this SKU also appears in row 87 of the file.",
    },
    {
      id: "IMP-0008-row-87",
      rowNumber: 87,
      sku: "SPT-BTL-750-GRN",
      productName: "Trail Insulated Water Bottle 750ml",
      error: "Duplicate SKU: this SKU also appears in row 52 of the file.",
    },
  ],
}

function getSampleErrors(jobId: string) {
  return (failedRowsByJobId[jobId] ?? []).slice(0, SAMPLE_ERROR_COUNT)
}

// Newest first.
export const mockImportJobs: ImportJob[] = [
  {
    id: "IMP-0014",
    filename: "accessories_restock.csv",
    status: "queued",
    totalRows: 340,
    processedRows: 0,
    successfulRows: 0,
    failedRows: 0,
    createdAt: "2026-10-06T10:24:00Z",
    startedAt: null,
    completedAt: null,
    sampleErrors: [],
  },
  {
    id: "IMP-0013",
    filename: "office_supplies_q4_price_update_final_reviewed.csv",
    status: "queued",
    totalRows: 1200,
    processedRows: 0,
    successfulRows: 0,
    failedRows: 0,
    createdAt: "2026-10-06T10:21:00Z",
    startedAt: null,
    completedAt: null,
    sampleErrors: [],
  },
  {
    id: "IMP-0012",
    filename: "products_batch.csv",
    status: "processing",
    totalRows: 500,
    processedRows: 287,
    successfulRows: 287,
    failedRows: 0,
    createdAt: "2026-10-06T10:18:00Z",
    startedAt: "2026-10-06T10:19:00Z",
    completedAt: null,
    sampleErrors: [],
  },
  {
    id: "IMP-0011",
    filename: "products.csv",
    status: "failed",
    totalRows: 450,
    processedRows: 450,
    successfulRows: 445,
    failedRows: 5,
    createdAt: "2026-10-06T10:10:00Z",
    startedAt: "2026-10-06T10:11:00Z",
    completedAt: "2026-10-06T10:15:00Z",
    sampleErrors: getSampleErrors("IMP-0011"),
  },
  {
    id: "IMP-0010",
    filename: "new_arrivals_october.csv",
    status: "completed",
    totalRows: 820,
    processedRows: 820,
    successfulRows: 820,
    failedRows: 0,
    createdAt: "2026-10-05T16:02:00Z",
    startedAt: "2026-10-05T16:03:05Z",
    completedAt: "2026-10-05T16:09:17Z",
    sampleErrors: [],
  },
  {
    id: "IMP-0009",
    filename: "furniture_range.csv",
    status: "completed",
    totalRows: 1250,
    processedRows: 1250,
    successfulRows: 1250,
    failedRows: 0,
    createdAt: "2026-10-04T09:40:00Z",
    startedAt: "2026-10-04T09:41:00Z",
    completedAt: "2026-10-04T09:52:30Z",
    sampleErrors: [],
  },
  {
    id: "IMP-0008",
    filename: "supplier_feed_q3.csv",
    status: "failed",
    totalRows: 120,
    processedRows: 120,
    successfulRows: 117,
    failedRows: 3,
    createdAt: "2026-10-02T13:15:00Z",
    startedAt: "2026-10-02T13:15:40Z",
    completedAt: "2026-10-02T13:16:25Z",
    sampleErrors: getSampleErrors("IMP-0008"),
  },
]

export function getMockImportJobById(jobId: string) {
  return mockImportJobs.find((job) => job.id === jobId)
}

export function getMockImportFailedRows(jobId: string) {
  return failedRowsByJobId[jobId] ?? []
}
