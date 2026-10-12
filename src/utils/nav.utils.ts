import type { NavItem } from "@/types/nav.types"
import type { UserRole } from "@/types/auth.types"

/** Items the given role may see; unrestricted items are always included. */
export function getVisibleNavItems(
  items: NavItem[],
  role: UserRole | undefined
) {
  return items.filter(
    (item) => !item.requiredRole || item.requiredRole === role
  )
}
