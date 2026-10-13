import { DetailItem } from "@/components/shared/detail-item"
import { formatInteger } from "@/utils/format-number"
import type { ImportColumnMapping, ImportJob } from "@/types/import.types"

type ImportValidationSummaryProps = {
  job: Pick<
    ImportJob,
    "totalRows" | "validRows" | "invalidRows" | "importedRows"
  >
  /** How the file's headers were read; only known right after validating. */
  mapping?: ImportColumnMapping[]
}

/** The counts of one import and, when known, how its headers were understood. */
export function ImportValidationSummary({
  job,
  mapping = [],
}: ImportValidationSummaryProps) {
  return (
    <div className="flex flex-col gap-3">
      <dl
        className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4"
        aria-live="polite"
      >
        <Count label="Total Rows" value={job.totalRows} />
        <Count label="Valid Rows" value={job.validRows} />
        <Count label="Rows With Errors" value={job.invalidRows} />
        <Count label="Products Created" value={job.importedRows} />
      </dl>
      {mapping.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Columns read from your file</p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {mapping.map(({ header, column }) => (
              <li key={header}>
                <span className="wrap-anywhere">{header}</span>
                {header !== column && (
                  <>
                    {" → "}
                    <span className="font-mono text-xs">{column}</span>
                  </>
                )}
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            Blank optional cells use the defaults: stock 0 and status ACTIVE.
          </p>
        </div>
      )}
    </div>
  )
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <DetailItem label={label}>
      <span className="text-xl font-semibold tabular-nums">
        {formatInteger(value)}
      </span>
    </DetailItem>
  )
}
