import { BackLink } from "@/components/shared/back-link"
import { routes } from "@/config/routes"

export function BackToUsersLink() {
  return <BackLink href={routes.users}>Back to Users</BackLink>
}
