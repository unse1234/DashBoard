import { useId, type ComponentProps, type ReactNode } from "react"

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"

type FormTextareaFieldProps = Omit<
  ComponentProps<"textarea">,
  "id" | "className"
> & {
  name: string
  label: string
  description?: ReactNode
  error?: string
}

export function FormTextareaField({
  label,
  description,
  error,
  ...textareaProps
}: FormTextareaFieldProps) {
  const id = useId()
  const descriptionId = `${id}-description`
  const errorId = `${id}-error`
  const describedBy =
    [description && descriptionId, error && errorId]
      .filter(Boolean)
      .join(" ") || undefined

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...textareaProps}
      />
      {description && (
        <FieldDescription id={descriptionId}>{description}</FieldDescription>
      )}
      <FieldError id={errorId}>{error}</FieldError>
    </Field>
  )
}
