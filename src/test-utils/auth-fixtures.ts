import type { AuthUser } from "@/lib/auth/auth.types"

/** A verified, active administrator; override fields per test. */
export function createAuthUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: "6f1c2d3e-0000-4000-8000-000000000001",
    name: "Ada Admin",
    email: "ada@example.com",
    role: "ADMIN",
    emailVerifiedAt: "2026-01-01T00:00:00Z",
    isActive: true,
    lastLoginAt: "2026-10-01T09:00:00Z",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}
