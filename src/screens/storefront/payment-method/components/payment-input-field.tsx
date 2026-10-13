import { useId, type ComponentProps, type ReactNode } from "react"

import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"

type PaymentInputFieldProps = ComponentProps<"input"> & {
  label: string
  error?: string
  icon: ReactNode
}

export function PaymentInputField({ label, error, icon, ...props }: PaymentInputFieldProps) {
  const id = useId()
  const errorId = `${id}-error`
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <InputGroup>
        <InputGroupInput {...props} id={id} aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined} />
        <InputGroupAddon>{icon}</InputGroupAddon>
      </InputGroup>
      <FieldError id={errorId}>{error}</FieldError>
    </Field>
  )
}
