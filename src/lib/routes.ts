import type { Route } from "next"

/** App paths in one place; `typedRoutes` checks them against real routes. */
export const routes = {
  home: "/",
  dashboard: "/dashboard",
  users: "/dashboard/users",
  products: "/dashboard/products",
  newProduct: "/dashboard/products/new",
  imports: "/dashboard/imports",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
} as const satisfies Record<string, Route>

// A dynamic segment can't be checked statically, hence the cast.
export function getUserRoute(uid: string) {
  return `${routes.users}/${encodeURIComponent(uid)}` as Route
}

export function getProductRoute(productId: string) {
  return `${routes.products}/${encodeURIComponent(productId)}` as Route
}

export function getEditProductRoute(productId: string) {
  return `${getProductRoute(productId)}/edit` as Route
}
