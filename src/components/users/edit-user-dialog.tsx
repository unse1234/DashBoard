"use client"

import { useId } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"

import { FormField } from "@/components/shared/form-field"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { PASSWORD_HINT } from "@/lib/auth/validation"
import { USER_STATUS_LABELS } from "@/lib/users/user.constants"
import { editUserSchema, type EditUserValues } from "@/lib/users/user.schemas"
import type { User } from "@/lib/users/user.types"

type EditUserDialogProps = {
  user: User
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called with the validated values; the dialog closes once it resolves. */
  onSubmit?: (values: EditUserValues) => void | Promise<void>
}

export function EditUserDialog({
  user,
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
          onSubmit={onSubmit}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

type EditUserFormProps = Pick<EditUserDialogProps, "user" | "onSubmit"> & {
  onSuccess: () => void
}

function getDefaultValues(user: User): EditUserValues {
  return {
    name: user.name,
    email: user.email,
    isActive: user.status === "active",
    newPassword: "",
    confirmPassword: "",
  }
}

// Mounted only while the dialog is open, so every opening starts from the
// user's current details.
function EditUserForm({ user, onSubmit, onSuccess }: EditUserFormProps) {
  const statusId = useId()
  const statusTextId = `${statusId}-text`
  const form = useForm<EditUserValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: getDefaultValues(user),
  })
  const { errors, isSubmitting } = form.formState

  async function submit(values: EditUserValues) {
    await onSubmit?.(values)
    onSuccess()
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} noValidate>
      <fieldset disabled={isSubmitting} className="flex min-w-0 flex-col gap-6">
        <FieldGroup>
          <FormField
            label="Name"
            autoComplete="off"
            required
            error={errors.name?.message}
            {...form.register("name")}
          />
          <FormField
            label="Email"
            type="email"
            autoComplete="off"
            required
            error={errors.email?.message}
            {...form.register("email")}
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
                  />
                </div>
              </Field>
            )}
          />
          <FieldSet>
            <FieldLegend variant="label">Change password</FieldLegend>
            <FieldDescription>
              Leave both fields empty to keep the current password.{" "}
              {PASSWORD_HINT}
            </FieldDescription>
            <FieldGroup>
              <FormField
                label="New password"
                type="password"
                autoComplete="new-password"
                error={errors.newPassword?.message}
                {...form.register("newPassword")}
              />
              <FormField
                label="Confirm password"
                type="password"
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                {...form.register("confirmPassword")}
              />
            </FieldGroup>
          </FieldSet>
        </FieldGroup>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancel
          </DialogClose>
          <Button type="submit">
            {isSubmitting ? (
              <>
                <Spinner aria-hidden="true" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </DialogFooter>
      </fieldset>
    </form>
  )
}
