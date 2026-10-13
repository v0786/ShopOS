# ShopOS architecture

## Current implementation

ShopOS is a React single-page application built with Vite and strict TypeScript. Tailwind CSS is integrated through the Vite plugin. Supabase JS is installed, and its client currently uses only the public anon key from validated settings. The only screen is an informational setup-in-progress page.

- `src/App.tsx` — setup status screen; no business flow.
- `src/config/env.ts` — validates and returns only the two public Supabase settings.
- `src/lib/supabase.ts` — browser client, public anon key only.
- `vite.config.ts` — React/Tailwind plugins, Vite automatic env exposure disabled, two exact `define` entries for the public URL and anon key.
- `src/config/env.test.ts`, `vite.config.test.ts`, `src/App.test.tsx` — config allowlist and screen behavior tests.
- `docs/database.md`, `docs/security.md`, `docs/rules.md` — data, security, and engineering constraints.

There is currently no router, state library, auth workflow, database schema, migration, seed, server function, protected operation, or production backend configuration.

## Target application shape

Keep one deployable frontend and a managed Supabase backend. Organize code around capabilities rather than creating generic layers before they are needed:

```text
src/
  app/                 # app shell, route table, auth/tenant providers
  components/          # shared accessible UI primitives
  features/
    auth/
    organizations/
    stores/
    catalog/
    inventory/
    sales/
    purchases/
    customers/
    expenses/
    repairs/
    transfers/
    reports/
  data/                # typed Supabase boundary and shared query helpers
  config/              # validated public runtime configuration
supabase/
  migrations/          # version-controlled schema, grants, policies, functions
  seed.sql             # non-production example organizations and stores
```

This is a destination map, not a requirement to create empty folders. Put feature UI, validation, and data operations together. Extract shared components only when real screens need them. Add React Router when multiple actual screens exist; add Zustand only when cross-route state has a concrete need.

## Trust boundaries and data flow

```text
Mobile/desktop React UI
  -> feature validation and typed data access
  -> Supabase Auth session + PostgREST or trusted RPC
  -> PostgreSQL constraints, RLS, transactional functions
```

The browser is an untrusted client. It can provide responsive presentation and draft state, but never decides whether the user may access an organization/store, the authoritative price/tax/total, whether stock is available, or whether a posted transaction exists. Enforce those decisions in RLS, constraints, and transactional database functions.

Only `SHOPOS_PUBLIC_SUPABASE_URL` and `SHOPOS_PUBLIC_SUPABASE_ANON_KEY` may be injected into browser modules. Vite automatic environment exposure is disabled. Service-role secrets belong only in a trusted server/operations environment and are never valid browser settings.

## Tenant and database boundaries

Every organization-owned row must include an organization scope. Store-owned rows also carry a store scope where appropriate. Policies derive access from `auth.uid()` and active membership/store assignment rather than trusting client-supplied IDs. Composite constraints prevent cross-organization references. Critical state changes execute transactionally and record actor, time, reason, and idempotency identity as applicable.

Detailed schema direction, indexes, RLS, and transaction boundaries are in [database.md](database.md). Security invariants are in [rules.md](rules.md) and [security.md](security.md).

## State, offline, and deployment

Authentication/session and current organization/store selection become shared state only when those workflows are implemented. Server data remains authoritative. IndexedDB/offline drafts are deferred to Phase 6 and only for explicitly approved workflows; a local draft must be visibly distinct from a server-confirmed transaction. No offline commit behavior is currently designed or implemented.

Target a static frontend host such as Vercel and managed Supabase. Browser configuration contains public URL/anon key only. Apply backend migrations through a controlled release path; production secrets do not belong in repository `.env` files. Monitoring, storage policy, backup, restore, and release checks remain Phase 6 work.
