# ShopOS implementation checklist

Status is mapped to the user-provided ShopOS master build instructions (referenced by [PRD.md](PRD.md)). `Done` means implemented and checked in this repository. `Partial` means only a bounded prerequisite exists. `Not started` means there is no implementation. A scaffold does not satisfy a phase exit gate.

## Phase 1 — foundation and multi-tenancy

| Requirement | Status | Relevant files | Tests / evidence |
|---|---|---|---|
| Typed public environment configuration and exact browser allowlist | Done | `src/config/env.ts`, `vite.config.ts`, `.env.example` | `src/config/env.test.ts`, `vite.config.test.ts`; secret sentinel bundle check |
| Supabase browser client configuration | Done — lazy anon-key client | `src/lib/supabase.ts` | Build/typecheck, Vitest import safe |
| Versioned migrations | Done | `supabase/migrations/20261013000001_phase1_foundation_and_multitenancy.sql` | `src/data/database.test.ts` executes migration in Vitest via PGlite |
| User profiles and authentication (signup/login/logout/recovery/session) | Partial — client auth service and accessible auth screen; awaits cloud project | `src/features/auth/authService.ts`, `src/components/AuthScreen.tsx` | `src/components/AuthScreen.test.tsx` (2 tests passing) |
| Organizations, membership, ownership, and admin permissions | Done | `supabase/migrations/*`, `src/features/organizations/organizationService.ts` | `src/data/database.test.ts` proves owner/admin permissions and RLS |
| Stores, creation/management, assignments, selectors | Done | `supabase/migrations/*`, `src/features/stores/storeService.ts`, `src/components/Dashboard.tsx` | `src/data/database.test.ts`, `src/components/Dashboard.test.tsx` (3 tests) |
| Minimal functional dashboard | Done | `src/components/Dashboard.tsx`, `src/App.tsx` | `src/components/Dashboard.test.tsx`, `src/App.test.tsx` |
| Tenant and branch-level RLS; deactivated membership denial | Done | `supabase/migrations/*` | `src/data/database.test.ts` (15 tests: cross-org denial, deactivated denial, unassigned store denial) |
| Separate platform-admin authority | Done | `supabase/migrations/*` | `src/data/database.test.ts` proves platform_admin separation and access |
| Two-organization/multi-store seed | Done | `supabase/seed.sql` | `src/data/database.test.ts` applies seed and asserts fixtures |
| Setup, migration, configuration, and test documentation | Done | `README.md`, `docs/database.md`, `docs/security.md` | Verified against active schema and tests |
| **Phase 1 exit gate** | **Substantially met** (Local RLS & schema verified; cloud project config pending) | `supabase/*`, `src/data/database.test.ts` | 15/15 database integration tests pass proving tenant isolation, self-service onboarding, and branch security |

## Phase 2 — catalog and inventory

| Requirement group | Status | Relevant files | Tests / evidence |
|---|---|---|---|
| Categories, brands/models, SKUs/barcodes, tax configuration, catalog | Not started | None | None |
| Store pricing and reorder thresholds | Not started | None | None |
| Quantity stock and IMEI/serial-tracked devices | Not started | None | None |
| Receipts, opening stock, adjustments, movements, counts/reconciliation | Not started | None | None |
| Low-stock reporting, concurrency, idempotency | Not started | None | None |
| **Phase 2 exit gate** | **Not met** — no stock ledger or IMEI concurrency protections | — | — |

## Phase 3 — sales and payments

| Requirement group | Status | Relevant files | Tests / evidence |
|---|---|---|---|
| Billing/cart/search/IMEI selection and authoritative pricing/tax | Not started | None | None |
| Discount permissions, invoice numbering/snapshots | Not started | None | None |
| Payment methods, split payments, receipts, history/search | Not started | None | None |
| Returns, refunds, reversals, customer purchase history | Not started | None | None |
| Atomic checkout, stock deduction, idempotency, IMEI concurrency | Not started | None | None |
| **Phase 3 exit gate** | **Not met** — no sales or payment operations exist | — | — |

## Phase 4 — purchases, customers, expenses, reports

| Requirement group | Status | Relevant files | Tests / evidence |
|---|---|---|---|
| Suppliers, purchase orders/receipts, partial receiving, supplier payments/balance | Not started | None | None |
| Customer records, ledgers, credit rules | Not started | None | None |
| Expenses, attachments, filtering, exports | Not started | None | None |
| Branch/consolidated sales, payment, inventory, low-stock, profit/expense/valuation/balance reports | Not started | None | None |
| **Phase 4 exit gate** | **Not met** — no source transactions or report definitions | — | — |

## Phase 5 — repairs, transfers, permissions

| Requirement group | Status | Relevant files | Tests / evidence |
|---|---|---|---|
| Repair intake, condition/accessories, estimates/approval, technician/status history | Not started | None | None |
| Parts, labor, deposits/payments, receipts/delivery | Not started | None | None |
| Branch transfers, in-transit, receipt/discrepancy resolution | Not started | None | None |
| Granular staff permissions and audit log | Not started | None | None |
| **Phase 5 exit gate** | **Not met** — no repair, transfer, or permission model exists | — | — |

## Phase 6 — PWA, subscriptions, production

| Requirement group | Status | Relevant files | Tests / evidence |
|---|---|---|---|
| Manifest/icons/service worker/install support/cache/network states | Not started | None | None |
| Explicit offline drafts, sync/conflict handling | Not started | None | None |
| Server-enforced subscription/usage/renewals and approved provider/webhooks | Not started | None | None |
| Separate platform admin, monitoring, secure storage, backup/restore | Not started | None | None |
| Production security/performance/deployment/release gates | Not started | None | None |
| **Phase 6 exit gate** | **Not met** | — | — |

## Product-wide interface and quality requirements

| Requirement | Status | Files / tests |
|---|---|---|
| Mobile-first setup-state screen with accessible status | Partial — starter only; no application navigation/workflow | `src/App.tsx`, `src/App.css`, `src/App.test.tsx` |
| Functional forms, loading/empty/error/permission states | Not started — no forms or protected data operations exist | None |
| Currency/date formatting, receipts, accessible billing flows | Not started | None |
| Typed code, automated checks, environment setup documentation | Partial — strict TS, Vitest, lint/build checks, setup instructions | `tsconfig*.json`, `src/**`, `vite.config.test.ts`, `README.md` |

## Open product decisions

These decisions remain unresolved and must be agreed before the affected workflows are implemented: GST and invoice requirements; inventory costing; store-specific tax/invoice variation; customer credit/dues; refund and payment allocation; printer/scanner compatibility; subscription pricing and limits; offline operations; retention/deletion/export; backup retention and recovery objectives.

## First bounded implementation step

Completed the repository baseline, strict TypeScript and Tailwind setup, typed public Supabase configuration with an exact browser-key allowlist, a public-anon-key client, a truthful responsive setup screen, and baseline project/security documentation. All current tests, typecheck, lint, build, and similarly-prefixed secret sentinel bundle checks passed. The next recommended task is Phase 1 auth and organization/store schema design, migrations, and RLS integration tests. Before treating it as an exit-gate implementation, configure a Supabase project and agree organization creation/ownership and first-store semantics.
