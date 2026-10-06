import { useId, type ComponentProps, type ReactNode } from "react"

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type FormSelectFieldProps = {
  name: string
  label: string
  options: readonly { value: string; label: string }[]
  /** Empty while nothing is chosen, which shows the placeholder. */
  value: string
  onValueChange: (value: string) => void
  onBlur?: () => void
  /** Lets a form library focus the field when it has an error. */
  ref?: ComponentProps<typeof SelectTrigger>["ref"]
  placeholder?: string
  description?: ReactNode
  error?: string
  disabled?: boolean
  required?: boolean
}

export function FormSelectField({
  name,
  label,
  options,
  value,
  onValueChange,
  onBlur,
  ref,
  placeholder,
  description,
  error,
  disabled,
  required,
}: FormSelectFieldProps) {
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
      <Select
        name={name}
        value={value || null}
        items={options}
        disabled={disabled}
        required={required}
        onValueChange={(next) => {
          if (next) onValueChange(next)
        }}
      >
        <SelectTrigger
          id={id}
          ref={ref}
          className="w-full data-[size=default]:h-9"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onBlur={onBlur}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {description && (
        <FieldDescription id={descriptionId}>{description}</FieldDescription>
      )}
      <FieldError id={errorId}>{error}</FieldError>
    </Field>
  )
}
