import { DetailItem } from "@/components/shared/detail-item"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDateTime } from "@/lib/format-date"
import { USER_ROLE_LABELS } from "@/lib/users/user.constants"
import type { User } from "@/lib/users/user.types"
import { UserStatusBadge } from "@/screens/users/components/user-status-badge"

type UserDetailsCardProps = {
  user: User
}

export function UserDetailsCard({ user }: UserDetailsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Account details</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <DetailItem label="UID">
            <span className="font-mono text-xs break-all">{user.uid}</span>
          </DetailItem>
          <DetailItem label="Name">{user.name}</DetailItem>
          <DetailItem label="Email">{user.email}</DetailItem>
          <DetailItem label="Role">{USER_ROLE_LABELS[user.role]}</DetailItem>
          <DetailItem label="Status">
            <UserStatusBadge status={user.status} />
          </DetailItem>
          <DetailItem label="Created At">
            <time dateTime={user.createdAt}>
              {formatDateTime(user.createdAt)}
            </time>
          </DetailItem>
          <DetailItem label="Last Login">
            {user.lastLoginAt ? (
              <time dateTime={user.lastLoginAt}>
                {formatDateTime(user.lastLoginAt)}
              </time>
            ) : (
              <span className="text-muted-foreground">Never</span>
            )}
          </DetailItem>
        </dl>
      </CardContent>
    </Card>
  )
}
