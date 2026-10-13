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
│   ├── orders/order.api.ts
│   └── imports/import.api.ts    # product CSV validation, confirmation, history, downloads
├── hooks/                       # query keys, query hooks, mutation hooks, and tests
│   ├── auth/                    # use-auth.ts and auth.mutations.ts
│   ├── users/                   # user.keys/queries/mutations.ts
│   ├── products/                # product.keys/queries/mutations.ts
│   ├── customers/               # customer.keys/queries.ts; read-only
│   ├── orders/                  # order.keys/queries/mutations.ts
│   ├── imports/                 # import.keys/queries/mutations.ts; polls a job being created
│   ├── use-debounced-value.ts
│   ├── use-now.ts
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
│   └── overview/data.json
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
| Imports | Backend product CSV import: validate, review every row, confirm, history, error report, template |
| Overview | Existing demo cards/chart and table rows from `mocks/overview/data.json` |

The Orders API integration already present before this structural refactor is preserved. Product analytics and product export remain unconnected.

### Imports

Imports create new products from a CSV file. They never update or delete existing products. The flow is validate, review, confirm: `POST /imports/preview` checks the file and creates nothing, the screen shows every row and each problem, and only the person who validated it can confirm. A confirmation creates every product and its `Created` history entry, or none of them.

- **Limits come from the API.** A file may hold up to 250 rows and 10 MB; the screen reads them from `GET /imports/types`. Category names must match an existing category exactly.
- **Progress is real.** Upload bytes show a percentage; the server's checks and the creation are indeterminate. There is no queue and no partial success.
- **A lost response is safe.** Sending the same file again reuses one request id and returns the same job, and an interrupted confirmation is read from the job's status rather than repeated.
- **Retention.** Validated rows are kept for 15 minutes, the error report for 7 days, and the job's history for 90 days. After the first deadline the file must be validated again.
- **Access.** Staff see their own imports; administrators can also list everyone's. A job someone else owns answers 404.

Products lists are refreshed when an import completes, including when the completion is only noticed later by reading the job.

## Tests

Tests remain beside the code they exercise, including moved API, query, mutation, utility, validation, provider, and adapter tests. `src/test-utils/` holds shared fixtures and rendering helpers. Its fake Axios transport preserves real interceptors and error normalization while preventing network access.
