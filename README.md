# Dashboard

Next.js App Router · React · TypeScript · Tailwind CSS v4 · shadcn/ui (Base UI) · TanStack Query · Axios · Vitest

## Development

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_URL` to the backend base URL. The development fallback is `http://localhost:3001`; production builds require an explicit value. This public variable is embedded at build time, so rebuild after changing it.

```bash
npm run dev                    # development server on http://localhost:3000
npx tsc --noEmit                # TypeScript check; there is no typecheck package script
npm run lint                   # ESLint
npm run test                   # Vitest watch mode
npm run test:run               # full test suite
npm run test:run -- --maxWorkers=1 # lower test concurrency when resources are limited
npm run build                  # production build, including route generation/type checking
npm run start                  # serve the production build
```

## Architecture

API integration has three layers:

1. **Fetching — services:** plain async functions call the shared Axios client, adapt API payloads, and return typed data. They do not import React, query hooks, or screens.
2. **Caching — hooks:** TanStack Query queries, keys, and mutations manage server data, pending/error state, cache updates, and invalidation.
3. **Presentation — screens:** screen entry points, forms, tables, filters, and loading/error/empty states consume hooks. Local search/filter/selection state stays here.

```text
src/
├── app/                         # route pages, layouts, metadata, parameters, boundaries
│   ├── (auth)/                  # login, forgot-password, reset-password, verify-email
│   └── (dashboard)/dashboard/   # overview, users, products, customers, orders, imports
├── services/                    # typed HTTP functions and their API tests
│   ├── auth/auth.api.ts
│   ├── users/user.api.ts
│   ├── products/product.api.ts  # products, categories, and product history
│   ├── customers/customer.api.ts
│   └── orders/order.api.ts
├── hooks/                       # query keys, query hooks, mutation hooks, and tests
│   ├── auth/                    # use-auth.ts and auth.mutations.ts
│   ├── users/                   # user.keys/queries/mutations.ts
│   ├── products/                # product.keys/queries/mutations.ts
│   ├── customers/               # customer.keys/queries.ts; read-only
│   ├── orders/                  # order.keys/queries/mutations.ts
│   ├── use-debounced-value.ts
│   └── use-mobile.ts
├── screens/                     # screen entry points and feature-specific UI/tests
│   ├── auth/actions/            # auth form-action adapters and tests
│   ├── overview/
│   ├── users/user.filters.ts
│   ├── products/product.filters.ts
│   ├── customers/customer.filters.ts
│   ├── orders/order.filters.ts
│   └── imports/
├── components/                  # reusable presentation components
│   ├── auth/                    # guards, auth shell/form, local form controller
│   ├── dashboard/               # sidebar, navigation, profile dialog, header
│   ├── shared/                  # form controls, confirmation, pagination, load errors
│   └── ui/                      # shadcn/Base UI primitives
├── types/                       # shared domain, form, navigation, pagination, sort types
├── utils/                       # cn.ts, formatters, pagination, sort, pure domain helpers
├── constants/                   # domain labels/options, password policy, page sizes
├── validations/                 # auth validation, user/product Zod schemas, CSV validation
├── config/                      # app.constants.ts and routes.ts
├── lib/                         # shared infrastructure only
│   ├── api/                     # Axios client, base URL resolution, normalized API errors
│   ├── auth/                    # in-memory session/token store and infrastructure tests
│   └── query/                   # QueryClient policy and account cache cleanup
├── providers/                   # query-provider.tsx and session-restorer.tsx
├── mocks/                       # existing demo data only
│   ├── overview/data.json
│   └── imports/import.mock-data.ts
└── test-utils/                  # fixtures, fake Axios transport, query rendering helpers
```

The `@/*` alias resolves to `src/*`. shadcn's utility alias resolves to `@/utils/cn`; other shadcn aliases and Base UI styling remain unchanged. Import concrete modules directly rather than adding compatibility barrels at obsolete paths.

Shared types live in `types/`, including schema-derived form values and API page results. Component-specific props and JSX renderers remain beside their components. Utilities and constants must not depend on presentation components. Transport-specific private response types may stay beside their service implementation.

List defaults are screen-local `*.filters.ts` files. Existing exports such as `defaultProductsQuery` retain their names. `*.queries.ts`, `*.keys.ts`, and `*.mutations.ts` live under the relevant `hooks/<module>/` folder.

## Routes

| Path | Screen |
| --- | --- |
| `/` | Redirects to `/dashboard`; the auth guard then handles access |
| `/login` | Sign in |
| `/forgot-password` | Request a password reset link |
| `/reset-password` | Set a password from a reset/invitation token |
| `/verify-email` | Verify an emailed token or request another email |
| `/dashboard` | Overview |
| `/dashboard/users` | User management |
| `/dashboard/users/[userId]` | User details |
| `/dashboard/products` | Product list |
| `/dashboard/products/new` | Create product |
| `/dashboard/products/[productId]` | Product details |
| `/dashboard/products/[productId]/edit` | Edit product |
| `/dashboard/customers` | Customer list |
| `/dashboard/customers/[customerId]` | Customer details |
| `/dashboard/orders` | Order list |
| `/dashboard/orders/[orderId]` | Order details |
| `/dashboard/imports` | Product CSV import center |
| `/dashboard/imports/[jobId]` | Import job details |

Route constants and ID-encoding helpers live in `src/config/routes.ts`. `typedRoutes` remains enabled. Route groups organize layouts without changing URLs. Accounts are invited by administrators; there is no self-service registration route.

## Session and cache infrastructure

`app/layout.tsx` mounts `QueryProvider`, then `SessionRestorer` followed by page content inside that provider. The toast container remains outside the provider at the root so feedback survives navigation away from the dashboard.

The access token lives in the auth store's memory. Page loads restore it using the HttpOnly refresh cookie. Concurrent refresh callers share one refresh operation; the existing refresh-race retry and expiry policy remain in the store. Axios attaches bearer tokens and replays an authenticated request once after a successful refresh. Public auth endpoints skip bearer authentication; cookie endpoints keep their credential and CSRF-header settings.

Auth mutations call the session infrastructure for sign-in/sign-out and the auth service for recovery/verification. Form-action adapters in `screens/auth/actions/` turn submitted data and mutation results into form state. They are client callbacks, not Next.js Server Actions; moving them does not add a `"use server"` directive.

TanStack Query owns server data. Its existing query-key values, stale times, retry policy, mutation behavior, and invalidations are preserved. Account changes cancel outstanding requests and clear cached data. Role and email-verification guards remain in `components/auth/`.

## Feature integration

| Module | Current data source and behavior |
| --- | --- |
| Authentication | Backend login, refresh/logout, recovery, verification, and resend |
| Users | Backend list/details, invitations, edits, enable/disable/delete, and profile name |
| Products | Backend list/details/categories/history, create/edit, and bulk archive |
| Customers | Read-only backend list/details with addresses and recent orders |
| Orders | Existing backend list/details, status updates, and payment recording |
| Imports | Existing mock jobs/failed rows; CSV file selection and validation |
| Overview | Existing demo cards/chart and table rows from `mocks/overview/data.json` |

The Orders API integration already present before this structural refactor is preserved. Imports retain their existing lookup, missing-job boundary, and unavailable-action notices. Product analytics and product export remain unconnected. No additional integration is introduced by the folder moves.

## Tests

Tests remain beside the code they exercise, including moved API, query, mutation, utility, validation, provider, and adapter tests. `src/test-utils/` holds shared fixtures and rendering helpers. Its fake Axios transport preserves real interceptors and error normalization while preventing network access.
