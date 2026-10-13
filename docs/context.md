# ShopOS working context

**Last updated:** 13 October 2026 (Asia/Calcutta)
**Purpose:** Handoff snapshot for the next implementation session. Refresh after meaningful work.

## Workspace snapshot

- Workspace: `D:\Projects\ShopOS`.
- Frontend baseline: React, Vite, strict TypeScript, Tailwind CSS, Supabase JS, Vitest, React Testing Library.
- PostgreSQL testing toolchain: `@electric-sql/pglite` (WebAssembly PostgreSQL 18.6 with Row-Level Security support) installed as test devDependency.
- `.env.example` documents the two public Supabase settings. Local `.env*` files other than `.env.example` are ignored.

## Implemented

- `supabase/migrations/20261013000001_phase1_foundation_and_multitenancy.sql`: Complete Phase 1 schema, composite keys, constraints, helper functions, and RLS policies for profiles, organizations, organization_memberships, stores, store_assignments, platform_admins, and `create_organization_with_store` atomic RPC function.
- `supabase/seed.sql`: Seed fixtures for two organizations (Apex Mobiles, Star Cellular) with multiple stores, store assignments, active/deactivated staff, and a platform admin.
- `src/types/database.ts`: Strictly typed TypeScript models for database tables, roles, and onboarding RPC.
- `src/features/auth/authService.ts`: Supabase authentication service helpers.
- `src/features/organizations/organizationService.ts`: Organization query and atomic onboarding invocation.
- `src/features/stores/storeService.ts`: Store querying and branch creation.
- `src/components/Dashboard.tsx`: Mobile-first dashboard with organization selector, store selector, branch overview, and role display.
- `src/components/AuthScreen.tsx`: Accessible sign in and organization/first-store registration form with input validation.
- `src/App.tsx`: Foundation setup status screen with interactive navigation to Phase 1 Dashboard and AuthScreen.
- `src/data/database.test.ts`: 15 integration tests running in Vitest against real PostgreSQL with RLS, proving tenant isolation, store assignment scoping, deactivated membership denial, composite constraint enforcement, and platform admin separation.
- `src/components/Dashboard.test.tsx` and `src/components/AuthScreen.test.tsx`: Component tests verifying UI rendering and interactions.
- Maintained documentation in `docs/`: `PRD.md`, `architecture.md`, `database.md`, `security.md`, `rules.md`, `implementation-plan.md`, `tasks.md`, `context.md`, `memory.md`.

## Latest implementation verification

- `npm test`: 27 tests passed across 6 test files.
- `npm run typecheck`: passed with strict mode (0 errors).
- `npm run lint`: passed with 0 warnings and 0 errors across 18 files.
- `npm run build`: passed (Vite production bundle built in 1.17s).
- Production bundle sentinel check: 0 service-role or sentinel secrets found in `dist/`.

## Next action

Connect cloud Supabase project and credentials for browser session persistence, then begin Phase 2: Catalog and inventory schema, store pricing, and tracked IMEI identity model.
