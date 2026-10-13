# ShopOS task board

This file is the short actionable queue. The complete requirement/status map and phase exit gates live in [implementation-plan.md](implementation-plan.md); it is the status source of truth.

## Current state

- [x] Create React/Vite/strict-TypeScript/Tailwind baseline.
- [x] Add typed public Supabase configuration and exact browser-key allowlist.
- [x] Add setup status screen and baseline documentation.
- [x] Add the MVP implementation guide and reusable documentation review prompt.
- [x] Verify tests, typecheck, lint, build, dependency audit, and secret sentinel absence.
- [x] Complete Phase 1 schema, tenancy, stores, RLS, seed, and 15 allowed/denied integration tests.
- [x] Implement multi-store Dashboard, selectors, and onboarding AuthScreen components with automated tests.
- [ ] Connect production/cloud Supabase project and complete browser session recovery flow.
- [ ] Begin Phase 2: Catalog and inventory schema, store pricing, and IMEI tracking models.

## Completed task: Phase 1 schema and access design

**Delivered:**
1. Defined profiles, organizations, memberships, stores, store assignments, and platform admins schema in `supabase/migrations/20261013000001_phase1_foundation_and_multitenancy.sql`.
2. Composite foreign keys `(organization_id, store_id)` and `(organization_id, user_id)` preventing cross-organization assignments.
3. RLS policies with least-privilege grants and SECURITY DEFINER helper functions (`is_platform_admin`, `is_active_member`, `has_org_role`, `has_store_access`).
4. Trusted atomic self-service onboarding RPC `create_organization_with_store`.
5. Seed fixtures in `supabase/seed.sql` for Apex Mobiles and Star Cellular with multiple stores, active/deactivated staff, and a platform admin.
6. 15 automated database integration tests in `src/data/database.test.ts` executing real PostgreSQL via PGlite in Vitest.
7. Mobile-first Dashboard (`src/components/Dashboard.tsx`) with organization/store selectors and AuthScreen (`src/components/AuthScreen.tsx`) with unit tests.

## Next task: Phase 2 catalog and device tracking schema design

**Goal:** Settle data model for products, categories, brands, models, SKUs, barcodes, store pricing, reorder thresholds, and tracked IMEI/serial units.

## Decisions needed before dependent work

Record options, recommendation, affected modules/data, and approval needed before work that depends on:

- GST and invoice requirements, including store-specific variation.
- Inventory costing and valuation.
- Customer credit and dues.
- Refund and payment allocation behavior.
- Printer/scanner compatibility.
- Subscription pricing, limits, renewals, and provider.
- Supported offline workflows and conflict resolution.
- Retention, deletion, export, backup retention, and recovery objectives.

## Later phase queue

- **Phase 2:** Catalog, store inventory, tracked devices, stock movements/counts, concurrency, idempotency.
- **Phase 3:** Transactional billing, invoices, payments, returns/refunds, IMEI sale protection.
- **Phase 4:** Purchasing, customers/ledgers, expenses, reconciled reports.
- **Phase 5:** Repair lifecycle, stock transfers, granular permissions/audit.
- **Phase 6:** PWA/offline drafts, subscriptions/webhooks, platform administration, monitoring, backup/restore, production release gates.
