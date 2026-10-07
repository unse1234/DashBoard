import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress"

type ImportProgressProps = {
  /** Percentage from 0 to 100. */
  value: number
  /** What is being measured, such as "287 of 500 rows processed". It also names the bar for screen readers. */
  label: string
}

/** A labelled progress bar. It only displays `value`, wherever that value comes from. */
export function ImportProgress({ value, label }: ImportProgressProps) {
  return (
    <Progress value={value}>
      <ProgressLabel>{label}</ProgressLabel>
      <ProgressValue />
    </Progress>
  )
}
