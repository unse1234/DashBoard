import type { Route } from "next"

/** App paths in one place; `typedRoutes` checks them against real routes. */
export const routes = {
  home: "/",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
} as const satisfies Record<string, Route>
