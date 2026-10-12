import type { EditUserValues } from "@/types/user.types";
import type { User } from "@/types/user.types"

/**
 * The edit-form values that differ from the user as it is now. Sending only
 * these keeps a name change from also re-submitting (and re-checking) the role
 * and status; an empty result means there is nothing to save.
 */
export function getChangedFields(
  user: User,
  values: EditUserValues
): Partial<EditUserValues> {
  const changes: Partial<EditUserValues> = {}

  if (values.name !== user.name) changes.name = values.name
  if (values.role !== user.role) changes.role = values.role
  if (values.isActive !== (user.status === "active")) {
    changes.isActive = values.isActive
  }
  return changes
}
