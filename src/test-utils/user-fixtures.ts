import type { User } from "@/lib/users/user.types"

/** An active staff member who has logged in before; override fields per test. */
export function createUser(overrides: Partial<User> = {}): User {
  return {
    uid: "11111111-1111-4111-8111-111111111111",
    name: "Priya Raman",
    email: "priya.raman@acme.io",
    role: "STAFF",
    status: "active",
    createdAt: "2025-01-27T08:05:00Z",
    lastLoginAt: "2026-09-28T11:48:00Z",
    ...overrides,
  }
}
