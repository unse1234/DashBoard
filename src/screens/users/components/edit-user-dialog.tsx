"use client"

import { useId } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"

import { AuthFormMessage } from "@/components/auth/auth-form"
import { FormField } from "@/components/shared/form-field"
import { FormSelectField } from "@/components/shared/form-select-field"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { describeApiError } from "@/lib/api/api-error"
import { USER_ROLE_OPTIONS, USER_STATUS_LABELS } from "@/lib/users/user.constants"
import { editUserSchema, type EditUserValues } from "@/lib/users/user.schemas"
import type { User } from "@/lib/users/user.types"
import { UserFormFooter } from "@/screens/users/components/user-form-footer"

type EditUserDialogProps = {
  user: User
  /** The API does not let you change your own role or status. */
  isCurrentUser?: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called with the validated values; the dialog closes once it resolves, and shows the error if it rejects. */
  onSubmit?: (values: EditUserValues) => void | Promise<void>
}

export function EditUserDialog({
  user,
  isCurrentUser = false,
  open,
  onOpenChange,
  onSubmit,
}: EditUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
          <DialogDescription>
            Update the details for {user.name}.
          </DialogDescription>
        </DialogHeader>
        <EditUserForm
          user={user}
          isCurrentUser={isCurrentUser}
          onSubmit={onSubmit}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

type EditUserFormProps = Pick<
  EditUserDialogProps,
  "user" | "isCurrentUser" | "onSubmit"
> & {
  onSuccess: () => void
}

function getDefaultValues(user: User): EditUserValues {
  return {
    name: user.name,
    role: user.role,
    isActive: user.status === "active",
  }
}

// Mounted only while the dialog is open, so every opening starts from the
// user's current details.
function EditUserForm({
  user,
  isCurrentUser,
  onSubmit,
  onSuccess,
}: EditUserFormProps) {
  const statusId = useId()
  const statusTextId = `${statusId}-text`
  const form = useForm<EditUserValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: getDefaultValues(user),
  })
  const { errors, isSubmitting } = form.formState

  async function submit(values: EditUserValues) {
    try {
      await onSubmit?.(values)
      onSuccess()
    } catch (error) {
      form.setError("root", { message: describeApiError(error) })
    }
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} noValidate>
      <fieldset disabled={isSubmitting} className="flex min-w-0 flex-col gap-6">
        <AuthFormMessage status="error" message={errors.root?.message} />
        <FieldGroup>
          <FormField
            label="Name"
            autoComplete="off"
            required
            error={errors.name?.message}
            {...form.register("name")}
          />
          <FormField
            name="email"
            label="Email"
            type="email"
            autoComplete="off"
            readOnly
            defaultValue={user.email}
            description="Email addresses can't be changed."
          />
          <Controller
            control={form.control}
            name="role"
            render={({ field, fieldState }) => (
              <FormSelectField
                name={field.name}
                label="Role"
                options={USER_ROLE_OPTIONS}
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
                error={fieldState.error?.message}
                disabled={isCurrentUser}
                required
              />
            )}
          />
          <Controller
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <Field orientation="horizontal" className="justify-between">
                <FieldLabel htmlFor={statusId}>Status</FieldLabel>
                <div className="flex items-center gap-2">
                  <span
                    id={statusTextId}
                    className="text-sm text-muted-foreground"
                  >
                    {USER_STATUS_LABELS[field.value ? "active" : "inactive"]}
                  </span>
                  <Switch
                    id={statusId}
                    aria-describedby={statusTextId}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isCurrentUser}
                  />
                </div>
              </Field>
            )}
          />
          {isCurrentUser && (
            <FieldDescription>
              You can&apos;t change your own role or status.
            </FieldDescription>
          )}
        </FieldGroup>
        <UserFormFooter
          isSubmitting={isSubmitting}
          submitLabel="Save changes"
          submittingLabel="Saving…"
        />
      </fieldset>
    </form>
  )
}
