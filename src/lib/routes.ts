import type { Route } from "next"

/** App paths in one place; `typedRoutes` checks them against real routes. */
export const routes = {
  home: "/",
  dashboard: "/dashboard",
  users: "/dashboard/users",
  products: "/dashboard/products",
  newProduct: "/dashboard/products/new",
  orders: "/dashboard/orders",
  customers: "/dashboard/customers",
  imports: "/dashboard/imports",
  login: "/login",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  verifyEmail: "/verify-email",
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

export function getOrderRoute(orderId: string) {
  return `${routes.orders}/${encodeURIComponent(orderId)}` as Route
}

export function getCustomerRoute(customerId: string) {
  return `${routes.customers}/${encodeURIComponent(customerId)}` as Route
}

export function getImportRoute(jobId: string) {
  return `${routes.imports}/${encodeURIComponent(jobId)}` as Route
}
