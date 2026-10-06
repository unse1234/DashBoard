import { DetailItem } from "@/components/shared/detail-item"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserStatusBadge } from "@/components/users/user-status-badge"
import { formatDateTime } from "@/lib/format-date"
import type { User } from "@/lib/users/user.types"

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
            <span className="font-mono text-xs">{user.uid}</span>
          </DetailItem>
          <DetailItem label="Name">{user.name}</DetailItem>
          <DetailItem label="Email">{user.email}</DetailItem>
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
