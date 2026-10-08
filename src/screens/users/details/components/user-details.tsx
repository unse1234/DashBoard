"use client"

import { LoadError } from "@/components/shared/load-error"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useApiResource } from "@/hooks/use-api-resource"
import { isApiError } from "@/lib/api/api-error"
import { getUser } from "@/lib/users/user.api"
import { UserDetailsCard } from "@/screens/users/details/components/user-details-card"
import { UserNotFound } from "@/screens/users/details/components/user-not-found"

const DETAIL_PLACEHOLDER_COUNT = 6

type UserDetailsProps = {
  userId: string
}

/** Loads one user and renders the matching state: loading, missing, failed or ready. */
export function UserDetails({ userId }: UserDetailsProps) {
  const { data, error, reload } = useApiResource(`user:${userId}`, (signal) =>
    getUser(userId, signal)
  )

  if (error) {
    // The API answers 404 for unknown ids and 400 for ids that aren't UUIDs.
    if (isApiError(error) && (error.status === 404 || error.status === 400)) {
      return <UserNotFound />
    }
    return <LoadError resourceName="this user" error={error} onRetry={reload} />
  }

  // Ignore a previous user's data left over from navigating between users.
  if (data?.uid !== userId) return <UserDetailsSkeleton />

  return <UserDetailsCard user={data} />
}

function UserDetailsSkeleton() {
  return (
    <Card aria-busy="true">
      <CardHeader>
        <Skeleton className="h-5 w-36" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          {Array.from({ length: DETAIL_PLACEHOLDER_COUNT }, (_, index) => (
            <div key={index} className="flex flex-col gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
