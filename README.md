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
│   ├── (dashboard)/dashboard/   # overview, users, products, customers, orders, imports
│   └── (storefront)/            # public shop, bag, checkout (no sign-in, no dashboard shell)
├── services/                    # typed HTTP functions and their API tests
│   ├── auth/auth.api.ts
│   ├── users/user.api.ts
│   ├── products/product.api.ts  # products, categories, and product history
│   ├── customers/customer.api.ts
│   ├── orders/order.api.ts
│   ├── imports/import.api.ts    # product CSV validation, confirmation, history, downloads
│   └── storefront/              # catalog.api.ts, bag.api.ts (bag quote), checkout.api.ts (checkout quote, place order); all public
├── hooks/                       # query keys, query hooks, mutation hooks, and tests
│   ├── auth/                    # use-auth.ts and auth.mutations.ts
│   ├── storefront/              # catalog and checkout-quote keys/queries; use-bag, use-order-submission, use-order-confirmation, use-checkout-draft
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
│   ├── imports/
│   └── storefront/              # catalog, product-details, bag, checkout, shipping-address (delivery details), payment-method, confirmation
├── components/                  # reusable presentation components
│   ├── auth/                    # guards, auth shell/form, local form controller
│   ├── dashboard/               # sidebar, navigation, profile dialog, header
│   ├── shared/                  # form controls, confirmation, pagination, load errors
│   ├── storefront/              # product card, product image, add-to-bag button, load error, icons
│   │   └── layout/              # shell, navigation rail, menu, bag preview, font
│   └── ui/                      # shadcn/Base UI primitives
├── types/                       # shared domain, form, navigation, pagination, sort types
│   └── storefront/              # product and bag types
├── utils/                       # cn.ts, formatters, pagination, sort, pure domain helpers
│   └── storefront/              # bag draft and order-session storage, price format, request mapping, order refusals
├── constants/                   # domain labels/options, password policy, page sizes
├── validations/                 # auth validation, user/product Zod schemas, CSV validation
│   └── storefront/              # checkout-details.schema.ts (delivery details form)
├── config/                      # app.constants.ts and routes.ts
├── lib/                         # shared infrastructure only
│   ├── api/                     # Axios client, base URL resolution, normalized API errors
│   ├── auth/                    # in-memory session/token store and infrastructure tests
│   └── query/                   # QueryClient policy and account cache cleanup
├── providers/                   # query-provider.tsx, session-restorer.tsx, and bag-provider.tsx (storefront)
├── mocks/                       # demo data
│   └── overview/data.json
└── test-utils/                  # fixtures, fake Axios transport, query rendering helpers, a fake bag server
```

The `@/*` alias resolves to `src/*`. shadcn's utility alias resolves to `@/utils/cn`; other shadcn aliases and Base UI styling remain unchanged. Import concrete modules directly rather than adding compatibility barrels at obsolete paths.

Shared types live in `types/`, including schema-derived form values and API page results. Component-specific props and JSX renderers remain beside their components. Utilities and constants must not depend on presentation components. Transport-specific private response types may stay beside their service implementation.

List defaults are screen-local `*.filters.ts` files. Existing exports such as `defaultProductsQuery` retain their names. `*.queries.ts`, `*.keys.ts`, and `*.mutations.ts` live under the relevant `hooks/<module>/` folder.

## Routes

| Path | Screen |
| --- | --- |
| `/` | Redirects to `/shop` |
| `/shop` | Storefront catalog: server search and paging, product tiles, add to bag, bag preview (public; API data) |
| `/shop/[productId]` | Storefront product details: pictures, price, description, add to bag; a missing product shows "Product not found" (public; API data) |
| `/bag` | Storefront bag: lines priced by the server, quantity steppers, total, checkout link (public; API data) |
| `/checkout` | Checkout review: delivery details, cash on delivery, the bag, the server's quote and Place your order (public; API data) |
| `/checkout/address` | Contact and Pakistan delivery address form (public) |
| `/checkout/payment` | Payment method: cash on delivery, nothing to enter (public) |
| `/checkout/confirmation` | The receipt of the order this tab placed (public; session-scoped) |
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

### Storefront routes

The customer-facing storefront lives in the `(storefront)` route group, beside `(auth)` and `(dashboard)`. Route protection is per group: `RequireAuth` is mounted only by `(dashboard)/layout.tsx`, so the storefront has no sign-in requirement and renders neither the dashboard shell nor its sidebar providers. Signed-in staff who open a storefront URL stay on it; only `/login` sends them on to `/dashboard`.

Every storefront screen is built and reads the public API; checkout is a guest checkout (no sign-in), which does not settle whether customers will need an account later.

### Storefront catalog

- **Data.** Products come from the public catalog API (`GET /storefront/products`, no sign-in): `services/storefront/catalog.api.ts` → `hooks/storefront/catalog.queries.ts` (`useStorefrontProductsQuery`, `useStorefrontProductQuery`; keys in `catalog.keys.ts` hold every input the answer depends on). Requests are `skipAuth`, so a staff token sharing the browser is never sent. The server searches (name, subtitle, brand), sorts and pages; the screen keeps the typed text (debounced 300 ms) and the chosen page, shows the previous results dimmed while the next load, and renders the server's `meta`. Twenty-four per page (`catalog.filters.ts`), with a Previous / Next pager that appears only when `totalPages > 1`; a new search returns to page 1.
- **Product states.** Loading (skeleton and a live "Loading products"), failure (`StorefrontLoadError`, with Try again), an empty catalog, a search with no match, a page past the end, a sold-out product (listed with "Sold out" and a disabled add button) and a product without an image (a placeholder; the API stores URLs only, no dimensions, so the tile's box sets the proportions and the picture is contained). A subtitle, description and gallery are optional. There is no rating: the API has none.
- **Images.** `ProductImage` renders a path of this site (`/images/...`, optimized) or an absolute `http(s)` URL as it is (`unoptimized`, because the host is not known ahead of time for `images.remotePatterns`). The files in `public/images/storefront/products/` are the 1x design crops; a product's `imageUrl` may point at them.
- **Wide tile.** The design's two-column MacBook tile is gone: the API has no tile shape, and with server sorting and paging a fixed wide position means nothing. Every card is the design's 191 × 232 tile.
- **Currency.** Rupees are written `Rs 1,500.00` (grouped; the design's dollar prices, `$ 3249.99`, are not), chosen by the product's `currency` through `formatStorefrontPrice(amount, currency)`.
- **Shell.** `StorefrontShell` (rail, content, bag preview) is rendered only by the screens that opt in (catalog, bag, product details), so checkout does not inherit it. `bagPreviewAction="checkout"` turns the preview's button into the bag total and a Checkout link, as the bag screen does. From `xl` it is the three-area desktop layout with four columns; the bag preview appears from `lg`; below `md` the rail becomes a bar across the top and the bag shows as a count on its icon. The rail and the bag stay at the window's edges at any width; only the catalog between them stops growing (at 1136 px) and is centered.
- **Bag.** `BagProvider` (mounted in the storefront layout, so it survives navigation between storefront routes) keeps only the *draft*: product ids and quantities, exactly as the server last returned them. Every price, line total, subtotal and count is the answer to `POST /storefront/bag/quote` (`services/storefront/bag.api.ts`, public). The shopper's clicks are sent as actions (`add`, `increment`, `decrement`, `remove`) that the server applies, so the client does no quantity or money arithmetic. Intents run one request at a time, in the order they were made, each from the draft the previous answer produced, so a slow answer cannot land after a newer one; a refused action (`409 INSUFFICIENT_STOCK` / `PRODUCT_UNAVAILABLE`) changes nothing and shows a sticky notice (`BagNotice`, in `StorefrontShell`) naming the product. A polite live region announces each change without moving focus. The draft (ids and quantities only) is kept in `localStorage` under `ecom-dash.storefront.bag.v1` and priced again by the server on the next visit; unavailable storage is tolerated, and a stored bag that is not well formed is dropped. `useBag()` exposes `items`, `itemCount`, `subtotal`, `currency`, `hasIssues`, `isRestoring`, `isUpdating`, `loadError`, `notice`, and the intents `addProduct`, `increase`, `decrease`, `remove`, `refresh` and `clear` (empties the bag without a request, for after an order is placed). Not synchronised between tabs.

### Storefront bag screen

- **Lines.** One card per bag line, as the server priced it: picture, name, subtitle, the product's description (three lines at most), `unit x quantity`, and a minus / quantity / plus stepper whose buttons are intents. At one unit the minus is labelled "Remove … from bag" and the server removes the line. The bag is priced again each time the screen opens.
- **Lines that went bad.** A product that stopped being buyable is not an error: its line says why (`This product is no longer available.` with only its id, since nothing else is revealed, or `There is not enough stock for this quantity.`), can still be lowered or removed, and the bag shows a banner while `hasIssues`. Checkout stays unavailable until every line can be bought. The API never says how many are left.
- **Loading and failure.** "Loading your bag…" while a bag from the last visit awaits its first answer; "Couldn’t load your bag" with Try again when it cannot be reached (the draft is kept).
- **Total.** The bag preview on this screen shows the server's subtotal (`formatStorefrontTotal`, e.g. `Rs 5,849.93`) and a Checkout link. An empty bag shows an empty state, a zero total, and an unavailable Checkout.
- **Styling.** The storefront palette, typeface (Cabin, via `storefrontFont`), radii, and shadow are theme tokens named `store-*` in `globals.css`; only storefront components use them, and the dashboard and auth screens are unaffected.
- **Sign-out.** The rail's red button is rendered unavailable (`aria-disabled`, with a description) and is not connected to staff logout.
- **Price format.** Prices follow the design's shape (a symbol, a space, two decimals) via `formatStorefrontPrice(amount, currency)`, not `formatCurrency`: `Rs 1,500.00`, or `$ 3249.99` for dollars.

### Storefront checkout

A guest buys with cash on delivery, in Pakistan, in rupees. There is no card, no gift card, no default-address preference and no billing address (the delivery address is the billing address). The server prices everything; the screens render what it says.

- **Delivery details** (`/checkout/address`): the buyer's name, email and phone (a Pakistani number), a shipping name (left blank, the order goes to the buyer), street, optional line 2, city, province, optional five-digit postal code, and the country, which is shown (Pakistan) and not chosen. `checkout-details.schema.ts` gives feedback while typing with the API's own limits (city and province are 100 characters, not 120); the API validates again and its answer is final. The draft (`CheckoutDraftProvider`) lives in memory for the checkout layout only and holds no price.
- **Review** (`/checkout`): the bag is priced again on opening, then `POST /storefront/checkout/quote` prices it for the address (`useCheckoutQuoteQuery`). The key of that query is the lines and the address, and nothing is kept across a change of them, so Place your order is only ever enabled for the quote of the bag and address on screen: not while the quote loads or refetches, after `expiresAt` (the shopper is told and can refresh), or while an earlier attempt is unresolved. Items, shipping, tax, discount and the total are the quote's; without one they show "—" rather than a made-up zero. The quote's lines can still be lowered or removed with the bag's steppers, which prices a new quote.
- **Placing** (`useOrderSubmission`): the attempt (the request, the quote token and a random `Idempotency-Key`) is frozen and written to `sessionStorage` *before* it is sent, with a 30 s timeout. A 201 stores the receipt for the confirmation, forgets the attempt, empties the bag with no request, clears the typed details and invalidates the orders, customers, products and catalog queries for any dashboard use in the same browser. A definitive refusal (a 4xx other than 408 and 429) proves no order exists, so the attempt is forgotten, the bag and quote are asked for again, and the panel says what to fix. Anything else (a lost connection, a timeout, a 5xx, a 429) leaves the order unknown: the attempt is kept, the shopper is told it may exist and that trying again is safe, no new order can start, and **Try again** sends exactly the same request and key, which the server answers with the original order if there is one. A reload brings the pending attempt back.
- **Refusals** (`order-refusal.ts`): a stale quote (expired, price or total moved, items or province changed) is explained as something to review and the quote is renewed; a product that cannot be bought sends the shopper to the bag; a rejected contact or address lists the API's messages and links to the details.
- **Confirmation** (`/checkout/confirmation`): the reference, cash to pay, where it is going and the lines and totals from the receipt, kept for the tab's session. The reference is for display only; there is no lookup by it.
- **Payment method** (`/checkout/payment`): cash on delivery is the only option and is shown selected, with how paying works. The route stays so the review's Change link has somewhere to go.

The root layout still mounts `SessionRestorer` for every route, so a storefront page load also attempts a session restore. Storefront rendering does not wait for it and does not read the session. An anonymous visitor's restore is rejected by the API; the client retries it once after 300 ms, so each such page load sends two `POST /auth/refresh` requests.

`AppLogo` takes a required `href`: the dashboard sidebar and the auth screens pass `routes.dashboard`; the storefront chrome should pass `routes.shop`. Dynamic `params` reach a page still percent-encoded, as they do on the dashboard pages.

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

- **Limits come from the API.** A file may hold up to 250 rows and 10 MB; the screen reads them from `GET /imports/types`. A category name matches an existing category ignoring case; one that does not exist yet is created when the import is confirmed.
- **Progress is real.** Upload bytes show a percentage; the server's checks and the creation are indeterminate. There is no queue and no partial success.
- **A lost response is safe.** Sending the same file again reuses one request id and returns the same job, and an interrupted confirmation is read from the job's status rather than repeated.
- **Retention.** Validated rows are kept for 15 minutes, the error report for 7 days, and the job's history for 90 days. After the first deadline the file must be validated again.
- **Access.** Staff see their own imports; administrators can also list everyone's. A job someone else owns answers 404.

Products lists are refreshed when an import completes, including when the completion is only noticed later by reading the job.

## Tests

Tests remain beside the code they exercise, including moved API, query, mutation, utility, validation, provider, and adapter tests. `src/test-utils/` holds shared fixtures and rendering helpers. Its fake Axios transport preserves real interceptors and error normalization while preventing network access.
