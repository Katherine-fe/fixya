# FixYa

Marketplace en español para contratar servicios técnicos del hogar (plomeros, electricistas, etc.) con autenticación Clerk, pagos simulados (Yape, Plin, Tarjeta) y tres roles de usuario.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/fixya run dev` — run the React frontend (Vite dev server)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY` — Clerk auth keys

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite + Tailwind CSS + Wouter (routing) + Clerk (auth) + Framer Motion
- API: Express 5 + Clerk Express middleware
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec) → generates React Query hooks in `lib/api-client-react`
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — Source of truth for all API contracts
- `lib/api-client-react/src/generated/api.ts` — Generated React Query hooks (do not edit manually)
- `lib/db/src/schema/` — Drizzle ORM table schemas (users, services, technicians, requests, payments, reviews)
- `artifacts/api-server/src/routes/` — Express route handlers for all API endpoints
- `artifacts/api-server/src/middlewares/auth.ts` — Clerk `requireAuth` middleware
- `artifacts/fixya/src/App.tsx` — Root React app (Clerk + Wouter routing)
- `artifacts/fixya/src/pages/` — All frontend pages
- `artifacts/fixya/src/components/layout/` — Navbar, Footer, DashboardLayout
- `artifacts/fixya/public/` — Static assets (logo, hero-bg, service images)

## Architecture decisions

- **Contract-first API**: OpenAPI spec in `lib/api-spec` drives all codegen. Never edit generated files directly.
- **Clerk auth proxy**: The API server proxies Clerk auth requests to avoid CORS issues. `VITE_CLERK_PROXY_URL` points to `/api/clerk`.
- **Simulated payments**: Payments via Yape, Plin, or Tarjeta are marked `completado` immediately without a real gateway.
- **UserRole as const**: Frontend defines `UserRole` as a local `const` object (not imported from generated schemas) since TypeScript enums don't survive codegen boundaries cleanly.
- **Service auto-population**: When creating a service request with only `technicianId`, the server auto-populates `serviceId` from the technician's profile.

## Product

- **Home**: Hero section, service catalog (10 categories), top technician showcase, CTAs for sign-up.
- **Servicios** (`/servicios`): Searchable grid of all service categories with pricing.
- **Técnicos** (`/tecnicos`): Filterable directory of approved technicians with search by name/specialty.
- **Detalle de Técnico** (`/tecnicos/:id`): Full technician profile with reviews, pricing, and service request modal.
- **Dashboards**: Role-based dashboards for `usuario` (request history, spend), `tecnico` (earnings, job queue), `administrador` (platform stats, technician approvals).
- **Auth**: Clerk sign-in/sign-up with Spanish localization and custom FixYa branding.

## User preferences

- Entirely in Spanish — all UI text, labels, placeholders, and error messages.
- Peruvian locale (`es-PE`) for dates and currency (S/ soles).
- Blue color scheme (primary: `hsl(226 71% 40%)`).

## Gotchas

- Run `pnpm --filter @workspace/db run push` after any schema change in `lib/db/src/schema/`.
- Run `pnpm --filter @workspace/api-spec run codegen` after any change to `lib/api-spec/openapi.yaml`.
- The `precioBase` and `precioHora` DB columns are `numeric` → come back as strings from Drizzle; always `parseFloat()` them before JSON responses.
- Never `import from "@workspace/api-client-react/src/generated/api.schemas"` — import from `"@workspace/api-client-react"` only.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
