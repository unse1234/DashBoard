import type { Route } from "next"

/** Single source of truth for app paths. Checked against real routes via `typedRoutes`. */
export const routes = {
  home: "/",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
} as const satisfies Record<string, Route>
