import type { Route } from "next"

/** App paths in one place; `typedRoutes` checks them against real routes. */
export const routes = {
  home: "/",
  dashboard: "/dashboard",
  users: "/dashboard/users",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
} as const satisfies Record<string, Route>

// A dynamic segment can't be checked statically, hence the cast.
export function getUserRoute(uid: string) {
  return `${routes.users}/${encodeURIComponent(uid)}` as Route
}
