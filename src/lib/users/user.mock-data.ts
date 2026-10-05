import type { User } from "@/lib/users/user.types"

// Placeholder data until the users API exists. Stands in for one page of results.
export const mockUsers: User[] = [
  {
    uid: "USR-10482",
    name: "Priya Raman",
    email: "priya.raman@acme.io",
    status: "active",
    createdAt: "2024-03-14T09:12:00Z",
    lastLoginAt: "2026-10-05T07:41:00Z",
  },
  {
    uid: "USR-10483",
    name: "Jonathan Whitfield",
    email: "j.whitfield@northbridge.co",
    status: "active",
    createdAt: "2023-11-02T14:30:00Z",
    lastLoginAt: "2026-10-04T16:20:00Z",
  },
  {
    uid: "USR-10517",
    name: "Alexandria Montgomery-Fitzgerald",
    email:
      "alexandria.montgomery-fitzgerald@northwind-logistics-international.com",
    status: "active",
    createdAt: "2025-01-27T08:05:00Z",
    lastLoginAt: "2026-09-28T11:48:00Z",
  },
  {
    uid: "USR-10530",
    name: "Mei Lin Tan",
    email: "meilin.tan@orchardworks.sg",
    status: "inactive",
    createdAt: "2024-08-19T03:22:00Z",
    lastLoginAt: "2026-03-11T05:09:00Z",
  },
  {
    uid: "USR-10544",
    name: "Carlos Eduardo de la Cruz Hernández",
    email: "carlos.delacruz@globex.mx",
    status: "active",
    createdAt: "2022-06-30T17:55:00Z",
    lastLoginAt: "2026-10-02T13:36:00Z",
  },
  {
    uid: "USR-10561",
    name: "Fatima Al-Sayed",
    email: "fatima.alsayed@harborline.ae",
    status: "inactive",
    createdAt: "2025-05-08T10:40:00Z",
    lastLoginAt: null,
  },
  {
    uid: "USR-10602",
    name: "Tomás Okonkwo-Bennett",
    email: "tomas.okonkwo-bennett@meridian-health-partners.org",
    status: "active",
    createdAt: "2025-09-15T12:01:00Z",
    lastLoginAt: "2026-10-05T06:03:00Z",
  },
  {
    uid: "USR-10618",
    name: "Sofia Marchetti",
    email: "s.marchetti@bluepine.it",
    status: "inactive",
    createdAt: "2023-02-21T15:18:00Z",
    lastLoginAt: "2025-12-19T09:27:00Z",
  },
  {
    uid: "USR-10640",
    name: "Liam O'Connell",
    email: "liam@oconnell.dev",
    status: "active",
    createdAt: "2026-09-30T19:44:00Z",
    lastLoginAt: null,
  },
  {
    uid: "USR-10655",
    name: "Hannah Kowalczyk-Nowakowska",
    email: "hannah.kowalczyk@wisla-analytics.pl",
    status: "active",
    createdAt: "2024-12-01T07:33:00Z",
    lastLoginAt: "2026-08-17T18:12:00Z",
  },
]

// Simulates a larger result set so the pagination controls can be reviewed.
export const mockTotalUsers = 248

export function getMockUserByUid(uid: string) {
  return mockUsers.find((user) => user.uid === uid)
}
